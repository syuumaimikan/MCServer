import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  getAvailableVersions,
  createServer,
  listServers,
  deleteServer
} from './serverInstaller.js';

import { processManager } from './processManager.js';
import {
  listInstalledMods,
  toggleMod,
  deleteMod,
  searchModrinth,
  installModrinthMod,
  saveUploadedMod
} from './modManager.js';

import {
  getWorldInfo,
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  resetDimension
} from './worldManager.js';

import {
  getServerProperties,
  saveServerProperties,
  getCraftosConfig,
  saveCraftosConfig
} from './configManager.js';

import {
  getPlayerLists,
  executePlayerAction
} from './playerManager.js';

import {
  initServerGit,
  commitServerChange,
  getServerGitHistory,
  rollbackServerToCommit
} from './gitManager.js';

import {
  getOptimizationStatus,
  installPerformanceMods,
  applyPaperOptimizations,
  setServerGCPreset,
  RECOMMENDED_PERFORMANCE_MODS,
  GC_PRESETS
} from './optimizer.js';

import {
  analyzeServerCrash,
  executeCrashRepair
} from './crashAnalyzer.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Client connections by serverId
const subscribers = new Map(); // serverId -> Set<WebSocket>

wss.on('connection', (ws) => {
  let subscribedServerId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.action === 'subscribe' && data.serverId) {
        if (subscribedServerId && subscribers.has(subscribedServerId)) {
          subscribers.get(subscribedServerId).delete(ws);
        }
        subscribedServerId = data.serverId;
        if (!subscribers.has(subscribedServerId)) {
          subscribers.set(subscribedServerId, new Set());
        }
        subscribers.get(subscribedServerId).add(ws);

        // Send current state immediately
        const state = processManager.getServerState(subscribedServerId);
        const logs = processManager.getLogs(subscribedServerId, 150);
        ws.send(JSON.stringify({ type: 'init', state, logs }));
      }
    } catch (_) {}
  });

  ws.on('close', () => {
    if (subscribedServerId && subscribers.has(subscribedServerId)) {
      subscribers.get(subscribedServerId).delete(ws);
    }
  });
});

// Configure ProcessManager broadcast forwarding to WebSockets
function broadcastToClients(serverId, event, data) {
  const clients = subscribers.get(serverId);
  if (clients) {
    const payload = JSON.stringify({ type: event, serverId, data });
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}

// Attach broadcast listeners for all servers
setInterval(() => {
  for (const serverId of subscribers.keys()) {
    processManager.setBroadcastHandler(serverId, (event, data) => {
      broadcastToClients(serverId, event, data);
    });
  }
}, 1000);

// --- REST API ENDPOINTS ---

// System Information
app.get('/api/system', async (req, res) => {
  try {
    const networkInterfaces = os.networkInterfaces();
    let localIp = '127.0.0.1';
    for (const name of Object.keys(networkInterfaces)) {
      for (const net of networkInterfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          localIp = net.address;
          break;
        }
      }
    }

    res.json({
      platform: os.platform(),
      hostname: os.hostname(),
      localIp,
      totalMemGB: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
      freeMemGB: Math.round(os.freemem() / (1024 * 1024 * 1024)),
      cpus: os.cpus().length,
      nodeVersion: process.version
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Available Minecraft versions
app.get('/api/versions', async (req, res) => {
  try {
    const type = req.query.type || 'fabric';
    const versions = await getAvailableVersions(type);
    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Server list & creation
app.get('/api/servers', (req, res) => {
  try {
    const servers = listServers();
    const enriched = servers.map(s => {
      const state = processManager.getServerState(s.id);
      return { ...s, state };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers', async (req, res) => {
  try {
    const { id, name, type, version, ram, port, motd, autoEula } = req.body;
    
    // Track installation progress
    const tempId = id || (name || 'server').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    
    const config = await createServer({
      id: tempId,
      name,
      type,
      version,
      ram,
      port,
      motd,
      autoEula,
      onProgress: (progress) => {
        // Broadcast install progress to global listeners if any
        broadcastToClients(tempId, 'install_progress', progress);
      }
    });

    res.json({ success: true, server: config });
  } catch (err) {
    console.error('Server creation failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/servers/:id', async (req, res) => {
  try {
    const serverId = req.params.id;
    // Stop server first if running
    await processManager.killServer(serverId);
    const success = deleteServer(serverId);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Server Process Control
app.get('/api/servers/:id/state', (req, res) => {
  try {
    const state = processManager.getServerState(req.params.id);
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/start', async (req, res) => {
  try {
    processManager.setBroadcastHandler(req.params.id, (event, data) => {
      broadcastToClients(req.params.id, event, data);
    });
    const state = await processManager.startServer(req.params.id);
    res.json({ success: true, state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/stop', async (req, res) => {
  try {
    await processManager.stopServer(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/restart', async (req, res) => {
  try {
    await processManager.restartServer(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/kill', async (req, res) => {
  try {
    await processManager.killServer(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Console Logs & Commands
app.get('/api/servers/:id/logs', (req, res) => {
  try {
    const logs = processManager.getLogs(req.params.id, Number(req.query.limit) || 300);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/command', (req, res) => {
  try {
    const { command } = req.body;
    processManager.sendCommand(req.params.id, command);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mods & Plugins Management
app.get('/api/servers/:id/mods', (req, res) => {
  try {
    const mods = listInstalledMods(req.params.id);
    res.json(mods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/mods/toggle', (req, res) => {
  try {
    const { fileName, folder } = req.body;
    const result = toggleMod(req.params.id, fileName, folder);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/servers/:id/mods', (req, res) => {
  try {
    const { fileName, folder } = req.body;
    const result = deleteMod(req.params.id, fileName, folder);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/mods/search', async (req, res) => {
  try {
    const { query, loader, version, limit, offset } = req.query;
    const results = await searchModrinth({
      query: query || '',
      loader: loader || 'fabric',
      version: version || '',
      limit: Number(limit) || 20,
      offset: Number(offset) || 0
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/mods/install-modrinth', async (req, res) => {
  try {
    const { projectId, version, loader, folder } = req.body;
    const srvConfig = getCraftosConfig(req.params.id);
    const mcVersion = version || srvConfig.version;
    const srvLoader = loader || (srvConfig.type === 'paper' || srvConfig.type === 'purpur' ? 'paper' : srvConfig.type);
    const targetFolder = folder || (srvConfig.type === 'paper' || srvConfig.type === 'purpur' ? 'plugins' : 'mods');

    const result = await installModrinthMod({
      serverId: req.params.id,
      projectId,
      version: mcVersion,
      loader: srvLoader,
      targetFolder
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/mods/upload', (req, res) => {
  try {
    const { fileName, base64Content, folder } = req.body;
    if (!fileName || !base64Content) {
      return res.status(400).json({ error: 'Missing fileName or base64Content' });
    }
    const buffer = Buffer.from(base64Content, 'base64');
    const result = saveUploadedMod(req.params.id, fileName, buffer, folder || 'mods');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// World & Backups
app.get('/api/servers/:id/world', (req, res) => {
  try {
    const info = getWorldInfo(req.params.id);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/servers/:id/backups', (req, res) => {
  try {
    const backups = listBackups(req.params.id);
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/backups', async (req, res) => {
  try {
    const { label } = req.body;
    const result = await createBackup(req.params.id, label || 'manual');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/backups/restore', (req, res) => {
  try {
    const { fileName } = req.body;
    const result = restoreBackup(req.params.id, fileName);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/servers/:id/backups', (req, res) => {
  try {
    const { fileName } = req.body;
    const result = deleteBackup(req.params.id, fileName);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/world/reset-dimension', (req, res) => {
  try {
    const { dimension } = req.body;
    const result = resetDimension(req.params.id, dimension);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Configuration & Properties
app.get('/api/servers/:id/properties', (req, res) => {
  try {
    const properties = getServerProperties(req.params.id);
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/properties', (req, res) => {
  try {
    const updated = saveServerProperties(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/servers/:id/config', (req, res) => {
  try {
    const config = getCraftosConfig(req.params.id);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/config', (req, res) => {
  try {
    const updated = saveCraftosConfig(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Players
app.get('/api/servers/:id/players', (req, res) => {
  try {
    const data = getPlayerLists(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/players/action', (req, res) => {
  try {
    const { action, payload } = req.body;
    const result = executePlayerAction(req.params.id, action, payload || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Performance & Optimization API ---
app.get('/api/servers/:id/optimization', (req, res) => {
  try {
    const status = getOptimizationStatus(req.params.id);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/optimization/install-mods', async (req, res) => {
  try {
    const { modIds } = req.body;
    const result = await installPerformanceMods(req.params.id, modIds || []);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/optimization/paper-tweak', (req, res) => {
  try {
    const result = applyPaperOptimizations(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/optimization/gc-preset', (req, res) => {
  try {
    const { presetId } = req.body;
    const result = setServerGCPreset(req.params.id, presetId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Git Time Machine API ---
app.get('/api/servers/:id/git/history', (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const history = getServerGitHistory(req.params.id, limit);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/git/commit', (req, res) => {
  try {
    const { message, category } = req.body;
    if (!message) return res.status(400).json({ error: 'Commit message is required' });
    const result = commitServerChange(req.params.id, message, category || 'manual');
    res.json({ success: true, commit: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/git/rollback', (req, res) => {
  try {
    const { commitHash } = req.body;
    if (!commitHash) return res.status(400).json({ error: 'Commit hash is required' });
    const result = rollbackServerToCommit(req.params.id, commitHash);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Public IP & Network Diagnostic API ---
app.get('/api/network/public-ip', async (req, res) => {
  try {
    const response = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    const data = await response.json();
    res.json({ ip: data.ip });
  } catch (_) {
    try {
      const response2 = await fetch('https://icanhazip.com', { signal: AbortSignal.timeout(3000) });
      const text = await response2.text();
      res.json({ ip: text.trim() });
    } catch (err) {
      res.json({ ip: 'Unable to detect public IP' });
    }
  }
});

// --- Crash Doctor & Log Analysis API ---
app.get('/api/servers/:id/crash-analysis', async (req, res) => {
  try {
    // Try high-speed Go native engine first
    try {
      const goRes = await fetch(`http://localhost:3002/api/engine/crash-analyze?serverId=${req.params.id}`, {
        signal: AbortSignal.timeout(600)
      });
      if (goRes.ok) {
        const goData = await goRes.json();
        return res.json(goData);
      }
    } catch (_) {}

    // Fallback to built-in JS engine
    const analysis = analyzeServerCrash(req.params.id);
    res.json({ ...analysis, engine: 'Built-in Node.js Engine' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/crash-repair', async (req, res) => {
  try {
    const { action, payload } = req.body;
    if (!action) return res.status(400).json({ error: 'Repair action is required' });
    const result = await executeCrashRepair(req.params.id, action, payload || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[CraftOS Backend] Server running on http://localhost:${PORT}`);

  // Automatically spawn Go native engine if binary exists
  const engineExePath = path.resolve(__dirname, '../engine/craftos-engine.exe');
  if (fs.existsSync(engineExePath)) {
    try {
      const goProcess = spawn(engineExePath, [], {
        cwd: path.resolve(__dirname, '../engine'),
        stdio: 'inherit'
      });
      goProcess.on('error', () => {});
      process.on('exit', () => goProcess.kill());
    } catch (_) {}
  }
});
