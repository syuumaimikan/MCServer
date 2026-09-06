import {
  LayoutDashboard,
  Terminal,
  Boxes,
  Globe2,
  Users,
  Settings,
  Plus,
  Play,
  Square,
  RotateCw,
  Server as ServerIcon,
  ChevronDown,
  Trash2,
  Zap,
  History,
  Globe,
  BookOpen,
  Stethoscope
} from 'lucide-react';
import clsx from 'clsx';
import AppleButton from './common/AppleButton';
import AppleBadge from './common/AppleBadge';

export default function Sidebar({
  servers = [],
  activeServer = null,
  onSelectServer = () => {},
  onOpenCreateWizard = () => {},
  onDeleteServer = () => {},
  activeTab = 'dashboard',
  onTabChange = () => {},
  serverState = null,
  onStartServer = () => {},
  onStopServer = () => {},
  onRestartServer = () => {},
  onOpenDocs = () => {},
  isActionLoading = false
}) {
  const [showServerMenu, setShowServerMenu] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: '概要 (Overview)', icon: LayoutDashboard, badge: null },
    { id: 'console', label: 'コンソール (Logs)', icon: Terminal, badge: serverState?.status === 'RUNNING' ? 'LIVE' : null },
    { id: 'optimization', label: '⚡ 高速化 (Optimization)', icon: Zap, badge: 'Turbo' },
    { id: 'crash_doctor', label: '🩺 クラッシュ診断 (Doctor)', icon: Stethoscope, badge: null },
    { id: 'mods', label: 'Mod & プラグイン', icon: Boxes, badge: null },
    { id: 'worlds', label: 'ワールド & バックアップ', icon: Globe2, badge: null },
    { id: 'git', label: '⏳ Time Machine (Git)', icon: History, badge: null },
    { id: 'players', label: 'プレイヤー管理', icon: Users, badge: serverState?.playerCount > 0 ? String(serverState.playerCount) : null },
    { id: 'network', label: '🌐 ネットワーク (IP/Port)', icon: Globe, badge: null },
    { id: 'settings', label: 'サーバー設定', icon: Settings, badge: null }
  ];

  const isRunning = serverState?.status === 'RUNNING';
  const isStarting = serverState?.status === 'STARTING';
  const isStopping = serverState?.status === 'STOPPING';

  return (
    <aside className="w-64 bg-[#151821]/80 backdrop-blur-2xl border-r border-white/10 flex flex-col justify-between select-none flex-shrink-0 relative z-30">
      {/* Top: Server Selector */}
      <div className="p-3 border-b border-white/5 relative">
        <div
          onClick={() => setShowServerMenu(!showServerMenu)}
          className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-apple-blue to-apple-indigo flex items-center justify-center text-white shadow-md flex-shrink-0">
              <ServerIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-white/95 truncate">
                {activeServer ? activeServer.name : 'Select Server'}
              </h4>
              <p className="text-[10px] text-white/50 capitalize truncate">
                {activeServer ? `${activeServer.type} • ${activeServer.version}` : 'No active server'}
              </p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
        </div>

        {/* Server Switcher Dropdown */}
        {showServerMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowServerMenu(false)}
            />
            <div className="absolute top-16 left-3 right-3 bg-[#1e222e] border border-white/15 rounded-2xl p-2 shadow-apple-lg z-50 flex flex-col gap-1 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                My Servers ({servers.length})
              </div>

              <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                {servers.map((srv) => (
                  <div
                    key={srv.id}
                    onClick={() => {
                      onSelectServer(srv);
                      setShowServerMenu(false);
                    }}
                    className={clsx(
                      'flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer group',
                      activeServer?.id === srv.id
                        ? 'bg-apple-blue text-white font-medium'
                        : 'text-white/80 hover:bg-white/10'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{srv.name}</div>
                      <div className={clsx('text-[10px]', activeServer?.id === srv.id ? 'text-white/80' : 'text-white/40')}>
                        {srv.type} {srv.version}
                      </div>
                    </div>
                    {servers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete server "${srv.name}"? This cannot be undone.`)) {
                            onDeleteServer(srv.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-opacity"
                        title="Delete server"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10 mt-1">
                <button
                  onClick={() => {
                    setShowServerMenu(false);
                    onOpenCreateWizard();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs text-apple-blue hover:bg-apple-blue/15 font-medium transition-colors border border-apple-blue/30"
                >
                  <Plus className="w-4 h-4" />
                  Create New Server
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Middle: Navigation Items */}
      <div className="px-2.5 py-4 flex flex-col gap-1 overflow-y-auto flex-1">
        <div className="px-3 pb-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
          Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={clsx(
                'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group',
                isActive
                  ? 'bg-apple-blue text-white shadow-apple-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={clsx('w-4 h-4 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-white/50')} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={clsx(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-2 border-t border-white/5 mt-2">
          <button
            onClick={onOpenDocs}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-amber-300/80 hover:text-amber-200 hover:bg-amber-400/10 border border-amber-400/20 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>📚 総合ガイド・解説</span>
            </div>
            <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">HELP</span>
          </button>
        </div>
      </div>

      {/* Bottom: Quick Server Controls */}
      <div className="p-3 border-t border-white/10 bg-[#12141c]/50 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-white/50">Status</span>
          <AppleBadge status={serverState?.status || 'OFFLINE'} size="sm" />
        </div>

        <div className="flex items-center gap-2">
          {!isRunning && !isStarting ? (
            <AppleButton
              onClick={onStartServer}
              variant="success"
              className="flex-1"
              icon={Play}
              loading={isActionLoading || isStarting}
              disabled={!activeServer}
            >
              Start Server
            </AppleButton>
          ) : (
            <>
              <AppleButton
                onClick={onStopServer}
                variant="danger"
                className="flex-1"
                icon={Square}
                loading={isActionLoading || isStopping}
              >
                Stop
              </AppleButton>
              <AppleButton
                onClick={onRestartServer}
                variant="secondary"
                size="md"
                icon={RotateCw}
                loading={isActionLoading}
                title="Restart"
              />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
