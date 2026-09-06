import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  RotateCw,
  Copy,
  Check,
  Cpu,
  HardDrive,
  Users,
  Clock,
  ExternalLink,
  ShieldAlert,
  Gamepad2,
  Swords,
  Globe,
  Sparkles
} from 'lucide-react';
import AppleCard from '../components/common/AppleCard';
import AppleButton from '../components/common/AppleButton';
import AppleBadge from '../components/common/AppleBadge';

function formatUptime(seconds = 0) {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function parseMotd(motd = '') {
  // Simple Minecraft color code parser
  const colors = {
    '§0': '#000000', '§1': '#0000AA', '§2': '#00AA00', '§3': '#00AAAA',
    '§4': '#AA0000', '§5': '#AA00AA', '§6': '#FFAA00', '§7': '#AAAAAA',
    '§8': '#555555', '§9': '#5555FF', '§a': '#55FF55', '§b': '#55FFFF',
    '§c': '#FF5555', '§d': '#FF55FF', '§e': '#FFFF55', '§f': '#FFFFFF'
  };

  const parts = [];
  let currentColor = '#FFFFFF';
  let buffer = '';

  for (let i = 0; i < motd.length; i++) {
    if (motd[i] === '§' && i + 1 < motd.length) {
      if (buffer) {
        parts.push({ text: buffer, color: currentColor });
        buffer = '';
      }
      const code = '§' + motd[i + 1];
      if (colors[code]) currentColor = colors[code];
      i++;
    } else {
      buffer += motd[i];
    }
  }
  if (buffer) parts.push({ text: buffer, color: currentColor });

  return parts.length > 0 ? parts : [{ text: motd || 'A Minecraft Server', color: '#FFFFFF' }];
}

export default function DashboardView({
  activeServer,
  serverState,
  systemInfo,
  onStartServer = () => {},
  onStopServer = () => {},
  onRestartServer = () => {},
  onTabChange = () => {},
  isActionLoading = false
}) {
  const [copied, setCopied] = useState(false);

  if (!activeServer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-4">
          <Globe className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">No Server Selected</h2>
        <p className="text-sm text-white/50 max-w-sm mb-4">
          Create or select a Minecraft server from the sidebar to get started.
        </p>
      </div>
    );
  }

  const isRunning = serverState?.status === 'RUNNING';
  const isStarting = serverState?.status === 'STARTING';
  const isStopping = serverState?.status === 'STOPPING';

  const fullAddress = `${systemInfo?.localIp || 'localhost'}:${activeServer.port || 25565}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const motdParts = parseMotd(activeServer.motd || 'A Minecraft Server managed by CraftOS');

  return (
    <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
      {/* Top Hero Banner */}
      <div className="relative rounded-3xl p-6 glass-panel border border-white/15 overflow-hidden shadow-apple-lg">
        {/* Ambient background glow */}
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-apple-blue/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-apple-purple/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <AppleBadge status={serverState?.status || 'OFFLINE'} size="md" />
              <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-white/10 text-white/80 border border-white/10 uppercase tracking-wider">
                {activeServer.type} {activeServer.version}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">{activeServer.name}</h1>

            {/* MOTD Color Box */}
            <div className="mt-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 inline-flex items-center gap-1 font-mono text-xs max-w-md shadow-inner">
              {motdParts.map((p, idx) => (
                <span key={idx} style={{ color: p.color }}>{p.text}</span>
              ))}
            </div>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex items-center gap-3 flex-wrap">
            {!isRunning && !isStarting ? (
              <AppleButton
                onClick={onStartServer}
                variant="primary"
                size="lg"
                icon={Play}
                loading={isActionLoading || isStarting}
                className="bg-apple-green hover:bg-emerald-600 text-white shadow-apple-glow"
              >
                Launch Server
              </AppleButton>
            ) : (
              <>
                <AppleButton
                  onClick={onStopServer}
                  variant="danger"
                  size="lg"
                  icon={Square}
                  loading={isActionLoading || isStopping}
                >
                  Stop Server
                </AppleButton>
                <AppleButton
                  onClick={onRestartServer}
                  variant="secondary"
                  size="lg"
                  icon={RotateCw}
                  loading={isActionLoading}
                >
                  Restart
                </AppleButton>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status / Uptime */}
        <AppleCard className="p-4">
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-xs font-medium">Uptime</span>
            <Clock className="w-4 h-4 text-apple-blue" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {isRunning ? formatUptime(serverState?.uptime) : 'Offline'}
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            {isRunning ? 'Server active & responsive' : 'Ready to start'}
          </p>
        </AppleCard>

        {/* Online Players */}
        <AppleCard className="p-4" onClick={() => onTabChange('players')} hoverable>
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-xs font-medium">Online Players</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono flex items-baseline gap-1">
            <span>{serverState?.playerCount || 0}</span>
            <span className="text-xs text-white/40 font-normal">/ {serverState?.maxPlayers || 20}</span>
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            Click to manage roster & permissions
          </p>
        </AppleCard>

        {/* CPU Load */}
        <AppleCard className="p-4">
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-xs font-medium">System CPU</span>
            <Cpu className="w-4 h-4 text-apple-yellow" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {serverState?.systemStats?.cpu || 0}%
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-apple-yellow h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, serverState?.systemStats?.cpu || 0)}%` }}
            />
          </div>
        </AppleCard>

        {/* RAM Allocation */}
        <AppleCard className="p-4">
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-xs font-medium">RAM Allocation</span>
            <HardDrive className="w-4 h-4 text-apple-purple" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {activeServer.ram || 4} GB
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            Aikar G1GC flags active
          </p>
        </AppleCard>
      </div>

      {/* Main Content Split: Server Address + Player Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Connection Card & Quick Stats */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Server Connection Card */}
          <AppleCard
            title="Direct Connection Details"
            subtitle="Share this IP address with your friends on your local network"
            icon={Globe}
          >
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
              <div className="flex-1 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 font-mono text-sm text-white flex items-center justify-between shadow-inner">
                <span className="text-emerald-400 font-semibold">{fullAddress}</span>
                <span className="text-xs text-white/40">Java Edition</span>
              </div>
              <AppleButton
                onClick={copyAddress}
                variant="primary"
                icon={copied ? Check : Copy}
                size="md"
                className="w-full sm:w-auto"
              >
                {copied ? 'Copied!' : 'Copy IP'}
              </AppleButton>
            </div>
          </AppleCard>

          {/* Quick Action Tiles: Turbo Optimization, Time Machine, Network Sharing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => onTabChange('optimization')}
              className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 hover:border-amber-400/40 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Performance</span>
                <h4 className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> 高速化 Turbo
                </h4>
                <p className="text-[11px] text-white/50 mt-1">推奨Mod一括導入 & GC設定</p>
              </div>
            </div>

            <div
              onClick={() => onTabChange('git')}
              className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-400/40 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Auto Git Vault</span>
                <h4 className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" /> Time Machine
                </h4>
                <p className="text-[11px] text-white/50 mt-1">全自動コミット履歴 & 復元</p>
              </div>
            </div>

            <div
              onClick={() => onTabChange('network')}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-400/40 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Multiplayer</span>
                <h4 className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" /> ネットワーク & 招待
                </h4>
                <p className="text-[11px] text-white/50 mt-1">IP確認 & 友達用招待URL</p>
              </div>
            </div>
          </div>

          {/* Quick Properties Snapshot */}
          <AppleCard
            title="Server Quick Settings"
            subtitle="Essential gameplay parameters"
            icon={Gamepad2}
            action={
              <AppleButton onClick={() => onTabChange('settings')} variant="ghost" size="sm">
                Edit All
              </AppleButton>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                <span className="text-[10px] text-white/40 uppercase">Software</span>
                <span className="text-xs font-semibold text-white capitalize mt-0.5">{activeServer.type}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                <span className="text-[10px] text-white/40 uppercase">Port</span>
                <span className="text-xs font-semibold text-white font-mono mt-0.5">{activeServer.port || 25565}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                <span className="text-[10px] text-white/40 uppercase">Optimization</span>
                <span className="text-xs font-semibold text-emerald-400 mt-0.5">Aikar / Turbo</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                <span className="text-[10px] text-white/40 uppercase">Git Vault</span>
                <span className="text-xs font-semibold text-indigo-400 mt-0.5">Auto Active</span>
              </div>
            </div>
          </AppleCard>
        </div>

        {/* Right 1 Col: Live Online Players Peek */}
        <div className="flex flex-col gap-4">
          <AppleCard
            title="Online Players"
            subtitle={`${serverState?.playerCount || 0} active in world`}
            icon={Users}
            action={
              <AppleButton onClick={() => onTabChange('players')} variant="ghost" size="sm">
                Manage
              </AppleButton>
            }
          >
            {serverState?.players && serverState.players.length > 0 ? (
              <div className="flex flex-col gap-2 mt-2 max-h-64 overflow-y-auto">
                {serverState.players.map((p) => (
                  <div
                    key={p}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={`https://crafthead.net/avatar/${p}/32`}
                        alt={p}
                        className="w-7 h-7 rounded-lg border border-white/10"
                        onError={(e) => { e.target.src = 'https://crafthead.net/avatar/Steve/32'; }}
                      />
                      <span className="text-xs font-semibold text-white">{p}</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-apple-glow" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-white/40 text-xs flex flex-col items-center gap-2">
                <Users className="w-6 h-6 opacity-40" />
                <span>{isRunning ? 'No players currently online' : 'Server is offline'}</span>
              </div>
            )}
          </AppleCard>
        </div>
      </div>
    </div>
  );
}
