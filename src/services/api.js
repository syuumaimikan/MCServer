const API_BASE = '/api';

export async function fetchSystemInfo() {
  const res = await fetch(`${API_BASE}/system`);
  if (!res.ok) throw new Error('Failed to fetch system info');
  return res.json();
}

export async function fetchVersions(type = 'fabric') {
  const res = await fetch(`${API_BASE}/versions?type=${type}`);
  if (!res.ok) throw new Error('Failed to fetch versions');
  return res.json();
}

export async function fetchServers() {
  const res = await fetch(`${API_BASE}/servers`);
  if (!res.ok) throw new Error('Failed to fetch servers');
  return res.json();
}

export async function createNewServer(serverData) {
  const res = await fetch(`${API_BASE}/servers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serverData)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Server creation failed');
  }
  return res.json();
}

export async function deleteServerById(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete server');
  return res.json();
}

export async function fetchServerState(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/state`);
  if (!res.ok) throw new Error('Failed to fetch server state');
  return res.json();
}

export async function startServer(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/start`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to start server');
  }
  return res.json();
}

export async function stopServer(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/stop`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to stop server');
  return res.json();
}

export async function restartServer(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/restart`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to restart server');
  return res.json();
}

export async function killServer(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/kill`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to kill server');
  return res.json();
}

export async function sendServerCommand(serverId, command) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command })
  });
  if (!res.ok) throw new Error('Failed to send command');
  return res.json();
}

export async function fetchInstalledMods(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/mods`);
  if (!res.ok) throw new Error('Failed to fetch mods');
  return res.json();
}

export async function toggleModState(serverId, fileName, folder = 'mods') {
  const res = await fetch(`${API_BASE}/servers/${serverId}/mods/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, folder })
  });
  if (!res.ok) throw new Error('Failed to toggle mod');
  return res.json();
}

export async function deleteModFile(serverId, fileName, folder = 'mods') {
  const res = await fetch(`${API_BASE}/servers/${serverId}/mods`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, folder })
  });
  if (!res.ok) throw new Error('Failed to delete mod');
  return res.json();
}

export async function searchModrinthMods({ query, loader, version, limit, offset }) {
  const params = new URLSearchParams({
    query: query || '',
    loader: loader || '',
    version: version || '',
    limit: limit || 20,
    offset: offset || 0
  });
  const res = await fetch(`${API_BASE}/mods/search?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to search Modrinth');
  return res.json();
}

export async function installModrinthMod({ serverId, projectId, version, loader, folder }) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/mods/install-modrinth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, version, loader, folder })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to install mod');
  }
  return res.json();
}

export async function uploadModJar(serverId, fileName, base64Content, folder = 'mods') {
  const res = await fetch(`${API_BASE}/servers/${serverId}/mods/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, base64Content, folder })
  });
  if (!res.ok) throw new Error('Failed to upload mod');
  return res.json();
}

export async function fetchWorldInfo(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/world`);
  if (!res.ok) throw new Error('Failed to fetch world info');
  return res.json();
}

export async function fetchBackups(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/backups`);
  if (!res.ok) throw new Error('Failed to fetch backups');
  return res.json();
}

export async function createBackupNow(serverId, label = 'manual') {
  const res = await fetch(`${API_BASE}/servers/${serverId}/backups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label })
  });
  if (!res.ok) throw new Error('Failed to create backup');
  return res.json();
}

export async function restoreBackupFile(serverId, fileName) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/backups/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName })
  });
  if (!res.ok) throw new Error('Failed to restore backup');
  return res.json();
}

export async function deleteBackupFile(serverId, fileName) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/backups`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName })
  });
  if (!res.ok) throw new Error('Failed to delete backup');
  return res.json();
}

export async function resetWorldDimension(serverId, dimension) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/world/reset-dimension`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dimension })
  });
  if (!res.ok) throw new Error('Failed to reset dimension');
  return res.json();
}

export async function fetchServerProperties(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/properties`);
  if (!res.ok) throw new Error('Failed to fetch properties');
  return res.json();
}

export async function saveServerProperties(serverId, properties) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(properties)
  });
  if (!res.ok) throw new Error('Failed to save properties');
  return res.json();
}

export async function fetchCraftosConfig(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/config`);
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
}

export async function saveCraftosConfig(serverId, config) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to save config');
  return res.json();
}

export async function fetchPlayerLists(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/players`);
  if (!res.ok) throw new Error('Failed to fetch players');
  return res.json();
}

export async function executePlayerCommand(serverId, action, payload) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/players/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  if (!res.ok) throw new Error('Failed to execute player action');
  return res.json();
}

// --- Optimization & Performance API ---
export async function fetchOptimizationStatus(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/optimization`);
  if (!res.ok) throw new Error('Failed to fetch optimization status');
  return res.json();
}

export async function installPerformanceModsBatch(serverId, modIds = []) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/optimization/install-mods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modIds })
  });
  if (!res.ok) throw new Error('Failed to install performance mods');
  return res.json();
}

export async function applyPaperPerformanceTweaks(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/optimization/paper-tweak`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to apply paper tweaks');
  return res.json();
}

export async function setGCPreset(serverId, presetId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/optimization/gc-preset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ presetId })
  });
  if (!res.ok) throw new Error('Failed to set GC preset');
  return res.json();
}

// --- Git Time Machine API ---
export async function fetchGitHistory(serverId, limit = 50) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/git/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch git history');
  return res.json();
}

export async function createManualGitCommit(serverId, message, category = 'manual') {
  const res = await fetch(`${API_BASE}/servers/${serverId}/git/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, category })
  });
  if (!res.ok) throw new Error('Failed to create commit');
  return res.json();
}

export async function rollbackGitCommit(serverId, commitHash) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/git/rollback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commitHash })
  });
  if (!res.ok) throw new Error('Failed to rollback commit');
  return res.json();
}

// --- Network & Public IP ---
export async function fetchPublicIP() {
  const res = await fetch(`${API_BASE}/network/public-ip`);
  if (!res.ok) throw new Error('Failed to fetch public IP');
  return res.json();
}

// --- Crash Doctor & Log Analysis ---
export async function fetchCrashAnalysis(serverId) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/crash-analysis`);
  if (!res.ok) throw new Error('Failed to fetch crash analysis');
  return res.json();
}

export async function executeCrashRepairAction(serverId, action, payload = {}) {
  const res = await fetch(`${API_BASE}/servers/${serverId}/crash-repair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to execute repair');
  }
  return res.json();
}

/**
 * WebSocket manager
 */
export class ServerWebSocket {
  constructor(serverId, onMessage) {
    this.serverId = serverId;
    this.onMessage = onMessage;
    this.ws = null;
    this.reconnectTimer = null;
    this.connect();
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({ action: 'subscribe', serverId: this.serverId }));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(data);
      } catch (_) {}
    };

    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(), 2000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  close() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }
  }
}
