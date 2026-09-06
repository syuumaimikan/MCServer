import React from 'react';
import { Cpu, HardDrive, Wifi, Sparkles } from 'lucide-react';
import AppleBadge from './common/AppleBadge';

export default function TitleBar({ activeServer, serverState, systemInfo }) {
  return (
    <header className="h-11 w-full bg-[#14171f]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-40 select-none flex-shrink-0">
      {/* macOS Traffic Lights Accent */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 group cursor-pointer mr-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/60 flex items-center justify-center transition-all group-hover:opacity-90" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/60 flex items-center justify-center transition-all group-hover:opacity-90" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/60 flex items-center justify-center transition-all group-hover:opacity-90" />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-white/90 font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-apple-blue" />
            CraftOS
          </span>
          <span className="text-white/30">/</span>
          <span className="text-white/70 font-medium">{activeServer ? activeServer.name : 'Select a Server'}</span>
        </div>
      </div>

      {/* Middle: Active Server Quick Status */}
      {activeServer && (
        <div className="hidden md:flex items-center gap-2">
          <AppleBadge status={serverState?.status || 'OFFLINE'} size="sm" />
          {serverState?.status === 'RUNNING' && (
            <span className="text-xs text-white/50 font-mono">
              Port: {activeServer.port || 25565} • {serverState.playerCount || 0}/{serverState.maxPlayers || 20} Online
            </span>
          )}
        </div>
      )}

      {/* Right: Quick System Monitor & IP */}
      <div className="flex items-center gap-3 text-xs text-white/60">
        {systemInfo?.localIp && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-white/70 font-mono">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>{systemInfo.localIp}:{activeServer?.port || 25565}</span>
          </div>
        )}

        {serverState?.systemStats && (
          <div className="flex items-center gap-3 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5 font-mono text-[11px]">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-apple-blue" />
              <span>{serverState.systemStats.cpu || 0}%</span>
            </div>
            <div className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-apple-purple" />
              <span>{serverState.systemStats.memory?.percent || 0}%</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
