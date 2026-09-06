import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import si from 'systeminformation';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVERS_DIR = path.resolve(__dirname, '../servers');

class ProcessManager {
  constructor() {
    this.processes = new Map(); // serverId -> { process, status, logs, players, startTime, subscribers }
    this.systemStats = { cpu: 0, memory: { used: 0, total: 0, percent: 0 } };
    this.statsInterval = null;
    this.startSystemStatsPolling();
  }

  startSystemStatsPolling() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    this.statsInterval = setInterval(async () => {
      try {
        const [cpu, mem] = await Promise.all([
          si.currentLoad(),
          si.mem()
        ]);
        this.systemStats = {
          cpu: Math.round(cpu.currentLoad || 0),
          memory: {
            usedMB: Math.round((mem.active || mem.used) / (1024 * 1024)),
            totalMB: Math.round(mem.total / (1024 * 1024)),
            percent: Math.round(((mem.active || mem.used) / mem.total) * 100)
          }
        };
      } catch (_) {}
    }, 2000);
  }

  getServerState(serverId) {
    const instance = this.processes.get(serverId);
    if (!instance) {
      return {
        serverId,
        status: 'OFFLINE',
        players: [],
        playerCount: 0,
        maxPlayers: 20,
        uptime: 0,
        cpu: 0,
        ramUsedMB: 0,
        systemStats: this.systemStats
      };
    }

    const uptime = instance.startTime ? Math.floor((Date.now() - instance.startTime) / 1000) : 0;

    return {
      serverId,
      status: instance.status,
      players: Array.from(instance.players),
      playerCount: instance.players.size,
      maxPlayers: instance.maxPlayers || 20,
      uptime,
      cpu: instance.metrics?.cpu || 0,
      ramUsedMB: instance.metrics?.ram || 0,
      systemStats: this.systemStats
    };
  }

  getLogs(serverId, limit = 300) {
    const instance = this.processes.get(serverId);
    if (!instance) return [];
    return instance.logs.slice(-limit);
  }

  broadcast(serverId, event, data) {
    const instance = this.processes.get(serverId);
    if (instance && instance.broadcastFn) {
      instance.broadcastFn(event, data);
    }
  }

  setBroadcastHandler(serverId, fn) {
    let instance = this.processes.get(serverId);
    if (!instance) {
      instance = {
        process: null,
        status: 'OFFLINE',
        logs: [],
        players: new Set(),
        startTime: null,
        metrics: { cpu: 0, ram: 0 },
        broadcastFn: fn
      };
      this.processes.set(serverId, instance);
    } else {
      instance.broadcastFn = fn;
    }
  }

  async startServer(serverId) {
    const serverDir = path.join(SERVERS_DIR, serverId);
    if (!fs.existsSync(serverDir)) {
      throw new Error(`Server ${serverId} not found`);
    }

    let instance = this.processes.get(serverId);
    if (instance && (instance.status === 'RUNNING' || instance.status === 'STARTING')) {
      throw new Error(`Server is already ${instance.status.toLowerCase()}`);
    }

    // Read config
    let config = {
      ram: 4,
      javaPath: 'java',
      aikarFlags: true,
      serverJar: 'server.jar'
    };
    const configPath = path.join(serverDir, 'craftos-config.json');
    if (fs.existsSync(configPath)) {
      try {
        config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
      } catch (_) {}
    }

    // Read server.properties for max-players
    let maxPlayers = 20;
    const propPath = path.join(serverDir, 'server.properties');
    if (fs.existsSync(propPath)) {
      const content = fs.readFileSync(propPath, 'utf8');
      const match = content.match(/max-players=(\d+)/);
      if (match) maxPlayers = parseInt(match[1], 10);
    }

    const ramGB = Number(config.ram) || 4;
    const javaArgs = [];

    // Apply GC Preset
    const presetId = config.gcPreset || (config.aikarFlags ? 'aikar' : 'standard');
    
    if (presetId === 'aikar') {
      javaArgs.push(
        `-Xms${ramGB}G`,
        `-Xmx${ramGB}G`,
        '-XX:+UseG1GC',
        '-XX:+ParallelRefProcEnabled',
        '-XX:MaxGCPauseMillis=200',
        '-XX:+UnlockExperimentalVMOptions',
        '-XX:+DisableExplicitGC',
        '-XX:+AlwaysPreTouch',
        '-XX:G1NewSizePercent=30',
        '-XX:G1MaxNewSizePercent=40',
        '-XX:G1ReservePercent=20',
        '-XX:G1HeapWastePercent=5',
        '-XX:G1MixedGCCountTarget=4',
        '-XX:InitiatingHeapOccupancyPercent=15',
        '-XX:G1MixedGCLiveThresholdPercent=90',
        '-XX:G1RSetUpdatingPauseTimePercent=5',
        '-XX:SurvivorRatio=32',
        '-XX:+PerfDisableSharedMem',
        '-XX:MaxTenuringThreshold=1',
        '-Dusing.aikars.flags=https://mcflags.emc.gs',
        '-Daikars.new.flags=true'
      );
    } else if (presetId === 'shenandoah') {
      javaArgs.push(
        `-Xms${ramGB}G`,
        `-Xmx${ramGB}G`,
        '-XX:+UseShenandoahGC',
        '-XX:+UnlockExperimentalVMOptions',
        '-XX:ShenandoahGCMode=iu',
        '-XX:ShenandoahGCHeuristics=adaptive',
        '-XX:+AlwaysPreTouch',
        '-XX:+DisableExplicitGC'
      );
    } else if (presetId === 'zgc') {
      javaArgs.push(
        `-Xms${ramGB}G`,
        `-Xmx${ramGB}G`,
        '-XX:+UseZGC',
        '-XX:+ZGenerational',
        '-XX:+AlwaysPreTouch',
        '-XX:+DisableExplicitGC'
      );
    } else if (presetId === 'low_memory') {
      javaArgs.push(
        `-Xms${Math.max(1, ramGB - 1)}G`,
        `-Xmx${ramGB}G`,
        '-XX:+UseG1GC',
        '-XX:MaxGCPauseMillis=300',
        '-XX:G1NewSizePercent=20',
        '-XX:G1ReservePercent=10',
        '-XX:+DisableExplicitGC'
      );
    } else {
      javaArgs.push(`-Xms${ramGB}G`, `-Xmx${ramGB}G`);
    }

    const jarFile = config.serverJar || 'server.jar';
    const fullJarPath = path.join(serverDir, jarFile);
    if (!fs.existsSync(fullJarPath)) {
      throw new Error(`サーバーバイナリ (${jarFile}) が見つかりません。サーバー作成時にダウンロードが完了していない可能性があります。`);
    }

    javaArgs.push('-jar', jarFile, 'nogui');

    if (!instance) {
      instance = {
        process: null,
        status: 'STARTING',
        logs: [],
        players: new Set(),
        startTime: Date.now(),
        metrics: { cpu: 0, ram: 0 },
        maxPlayers
      };
      this.processes.set(serverId, instance);
    } else {
      instance.status = 'STARTING';
      instance.startTime = Date.now();
      instance.players.clear();
      instance.maxPlayers = maxPlayers;
    }

    this.addLog(serverId, `[CraftOS] Launching Minecraft Server: ${config.javaPath} ${javaArgs.join(' ')}`, 'INFO');
    this.broadcast(serverId, 'status', this.getServerState(serverId));

    const child = spawn(config.javaPath, javaArgs, {
      cwd: serverDir,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    instance.process = child;

    // Handle stdout
    child.stdout.on('data', (data) => {
      const text = data.toString('utf8');
      this.handleOutput(serverId, text, 'STDOUT');
    });

    // Handle stderr
    child.stderr.on('data', (data) => {
      const text = data.toString('utf8');
      this.handleOutput(serverId, text, 'STDERR');
    });

    child.on('error', (err) => {
      this.addLog(serverId, `[CraftOS Process Error]: ${err.message}`, 'ERROR');
      instance.status = 'OFFLINE';
      instance.process = null;
      this.broadcast(serverId, 'status', this.getServerState(serverId));
    });

    child.on('close', (code) => {
      this.addLog(serverId, `[CraftOS] Server process exited with code ${code}`, 'INFO');
      instance.status = 'OFFLINE';
      instance.process = null;
      instance.players.clear();
      this.broadcast(serverId, 'status', this.getServerState(serverId));
    });

    return this.getServerState(serverId);
  }

  handleOutput(serverId, rawText, type) {
    const lines = rawText.split(/\r?\n/);
    const instance = this.processes.get(serverId);
    if (!instance) return;

    for (const line of lines) {
      if (!line.trim()) continue;

      let level = 'INFO';
      if (line.includes('/WARN') || line.includes('[WARN]')) level = 'WARN';
      if (line.includes('/ERROR') || line.includes('[ERROR]') || type === 'STDERR') level = 'ERROR';

      // Detect server ready
      if (line.includes('Done (') && line.includes(')! For help, type "help"')) {
        instance.status = 'RUNNING';
        this.broadcast(serverId, 'status', this.getServerState(serverId));
      }

      // Detect player joined
      // Example: [Server thread/INFO]: Steve joined the game
      // Example: [Server thread/INFO]: UUID of player Alex is ...
      const joinMatch = line.match(/: ([a-zA-Z0-9_]{2,16}) joined the game/);
      if (joinMatch) {
        const playerName = joinMatch[1];
        instance.players.add(playerName);
        this.broadcast(serverId, 'player_joined', { player: playerName });
        this.broadcast(serverId, 'status', this.getServerState(serverId));
      }

      // Detect player left
      // Example: [Server thread/INFO]: Steve left the game
      const leaveMatch = line.match(/: ([a-zA-Z0-9_]{2,16}) left the game/);
      if (leaveMatch) {
        const playerName = leaveMatch[1];
        instance.players.delete(playerName);
        this.broadcast(serverId, 'player_left', { player: playerName });
        this.broadcast(serverId, 'status', this.getServerState(serverId));
      }

      this.addLog(serverId, line, level);
    }
  }

  addLog(serverId, message, level = 'INFO') {
    const instance = this.processes.get(serverId);
    if (!instance) return;

    const logEntry = {
      id: Date.now() + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString(),
      message,
      level
    };

    instance.logs.push(logEntry);
    if (instance.logs.length > 1500) {
      instance.logs.shift();
    }

    this.broadcast(serverId, 'log', logEntry);
  }

  sendCommand(serverId, command) {
    const instance = this.processes.get(serverId);
    if (!instance || !instance.process || instance.status === 'OFFLINE') {
      throw new Error('Server is offline');
    }

    this.addLog(serverId, `> ${command}`, 'COMMAND');
    instance.process.stdin.write(command + '\n');
    return true;
  }

  async stopServer(serverId) {
    const instance = this.processes.get(serverId);
    if (!instance || !instance.process || instance.status === 'OFFLINE') {
      return;
    }

    instance.status = 'STOPPING';
    this.broadcast(serverId, 'status', this.getServerState(serverId));
    this.addLog(serverId, '[CraftOS] Gracefully shutting down server (sending "stop" command)...', 'INFO');

    instance.process.stdin.write('stop\n');

    // Timeout safety fallback after 20 seconds
    setTimeout(() => {
      if (instance.process) {
        this.addLog(serverId, '[CraftOS] Server did not exit in 20s, terminating process...', 'WARN');
        instance.process.kill();
      }
    }, 20000);
  }

  async killServer(serverId) {
    const instance = this.processes.get(serverId);
    if (!instance || !instance.process) return;

    this.addLog(serverId, '[CraftOS] Force-killing server process...', 'WARN');
    instance.process.kill('SIGKILL');
    instance.status = 'OFFLINE';
    instance.process = null;
    this.broadcast(serverId, 'status', this.getServerState(serverId));
  }

  async restartServer(serverId) {
    await this.stopServer(serverId);
    
    // Wait for OFFLINE status
    const checkInterval = setInterval(async () => {
      const state = this.getServerState(serverId);
      if (state.status === 'OFFLINE') {
        clearInterval(checkInterval);
        setTimeout(async () => {
          await this.startServer(serverId);
        }, 1000);
      }
    }, 500);
  }
}

export const processManager = new ProcessManager();
