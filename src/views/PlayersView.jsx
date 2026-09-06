import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Crown,
  Sparkles,
  Gamepad,
  Gift,
  Navigation,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import AppleButton from '../components/common/AppleButton';
import AppleCard from '../components/common/AppleCard';
import {
  fetchPlayerLists,
  executePlayerCommand
} from '../services/api';

export default function PlayersView({
  activeServer,
  serverState,
  onNotify = () => {}
}) {
  const [activeTab, setActiveTab] = useState('online'); // 'online' | 'whitelist' | 'ops' | 'banned'
  const [playerData, setPlayerData] = useState({
    onlinePlayers: [],
    ops: [],
    whitelist: [],
    bannedPlayers: []
  });
  const [loading, setLoading] = useState(false);

  // Modal / action state
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [actionType, setActionType] = useState(null); // 'give' | 'gamemode' | 'teleport'
  const [actionInput, setActionInput] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');

  const loadPlayers = async () => {
    if (!activeServer) return;
    setLoading(true);
    try {
      const data = await fetchPlayerLists(activeServer.id);
      setPlayerData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, [activeServer?.id, serverState?.playerCount]);

  const handleAction = async (action, player, payload = {}) => {
    try {
      await executePlayerCommand(activeServer.id, action, { player, ...payload });
      onNotify('success', 'Executed', `Action ${action} performed on ${player}`);
      setSelectedPlayer(null);
      setActionType(null);
      await loadPlayers();
    } catch (err) {
      onNotify('error', 'Action Failed', err.message);
    }
  };

  const handleAddWhitelist = async () => {
    if (!newPlayerName.trim()) return;
    await handleAction('whitelist_add', newPlayerName.trim());
    setNewPlayerName('');
  };

  const isRunning = serverState?.status === 'RUNNING';

  return (
    <div className="flex-1 p-6 overflow-y-auto min-h-0 flex flex-col gap-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-apple-green to-emerald-600 flex items-center justify-center text-white shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Player Management</h2>
            <p className="text-xs text-white/50">
              {serverState?.playerCount || 0} online • Manage roles, whitelist, and in-game controls
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 text-xs">
          {[
            { id: 'online', label: `Online (${serverState?.playerCount || 0})` },
            { id: 'ops', label: `Operators (${playerData.ops?.length || 0})` },
            { id: 'whitelist', label: `Whitelist (${playerData.whitelist?.length || 0})` },
            { id: 'banned', label: `Bans (${playerData.bannedPlayers?.length || 0})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-apple-blue text-white shadow-apple-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: ONLINE PLAYERS */}
      {activeTab === 'online' && (
        <div className="flex flex-col gap-4">
          {(!serverState?.players || serverState.players.length === 0) ? (
            <div className="py-16 text-center text-white/40 glass-card rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-3">
              <Users className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">
                {isRunning ? 'No players currently joined' : 'Server is currently offline'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serverState.players.map((player) => (
                <div
                  key={player}
                  className="p-4 rounded-2xl glass-card border border-white/10 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://crafthead.net/avatar/${player}/48`}
                        alt={player}
                        className="w-10 h-10 rounded-xl border border-white/10 shadow-sm"
                        onError={(e) => { e.target.src = 'https://crafthead.net/avatar/Steve/48'; }}
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          {player}
                          {playerData.ops?.some(o => o.name === player) && (
                            <Crown className="w-3.5 h-3.5 text-amber-400" title="Server Operator" />
                          )}
                        </h4>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t border-white/5 text-xs">
                    <button
                      onClick={() => handleAction('gamemode', player, { gamemode: 'creative' })}
                      className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium transition-colors text-[11px]"
                    >
                      Creative
                    </button>
                    <button
                      onClick={() => handleAction('gamemode', player, { gamemode: 'survival' })}
                      className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium transition-colors text-[11px]"
                    >
                      Survival
                    </button>
                    <button
                      onClick={() => handleAction('give', player, { item: 'minecraft:diamond', amount: 64 })}
                      className="px-2 py-1.5 rounded-xl bg-apple-blue/15 hover:bg-apple-blue/25 text-apple-blue font-medium transition-colors text-[11px]"
                    >
                      Give 64 💎
                    </button>
                    <button
                      onClick={() => handleAction('op', player)}
                      className="px-2 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium transition-colors text-[11px]"
                    >
                      Make OP
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <AppleButton
                      onClick={() => handleAction('kick', player)}
                      variant="danger"
                      size="sm"
                      className="flex-1"
                    >
                      Kick
                    </AppleButton>
                    <AppleButton
                      onClick={() => handleAction('ban', player)}
                      variant="danger"
                      size="sm"
                      className="flex-1"
                    >
                      Ban
                    </AppleButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OPERATORS (OPS) */}
      {activeTab === 'ops' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Minecraft username to promote..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-2xl glass-input text-xs text-white focus:outline-none"
            />
            <AppleButton
              onClick={() => {
                if (newPlayerName.trim()) {
                  handleAction('op', newPlayerName.trim());
                  setNewPlayerName('');
                }
              }}
              variant="primary"
              size="md"
              icon={Crown}
            >
              Add OP
            </AppleButton>
          </div>

          <div className="flex flex-col gap-2">
            {playerData.ops?.length === 0 ? (
              <div className="py-8 text-center text-white/40 text-xs">No operators assigned yet.</div>
            ) : (
              playerData.ops?.map((op) => {
                const name = op.name || op;
                return (
                  <div key={name} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">{name}</span>
                    </div>
                    <AppleButton
                      onClick={() => handleAction('deop', name)}
                      variant="danger"
                      size="sm"
                    >
                      Remove OP
                    </AppleButton>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: WHITELIST */}
      {activeTab === 'whitelist' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Username to add to whitelist..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-2xl glass-input text-xs text-white focus:outline-none"
            />
            <AppleButton
              onClick={handleAddWhitelist}
              variant="primary"
              size="md"
              icon={Plus}
            >
              Add to Whitelist
            </AppleButton>
          </div>

          <div className="flex flex-col gap-2">
            {playerData.whitelist?.length === 0 ? (
              <div className="py-8 text-center text-white/40 text-xs">Whitelist is empty.</div>
            ) : (
              playerData.whitelist?.map((w) => {
                const name = w.name || w;
                return (
                  <div key={name} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-xs font-bold text-white">{name}</span>
                    <AppleButton
                      onClick={() => handleAction('whitelist_remove', name)}
                      variant="danger"
                      size="sm"
                    >
                      Remove
                    </AppleButton>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BANNED PLAYERS */}
      {activeTab === 'banned' && (
        <div className="flex flex-col gap-2">
          {playerData.bannedPlayers?.length === 0 ? (
            <div className="py-8 text-center text-white/40 text-xs">No banned players.</div>
          ) : (
            playerData.bannedPlayers?.map((b) => {
              const name = b.name || b;
              return (
                <div key={name} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-xs font-bold text-rose-400">{name}</span>
                  <AppleButton
                    onClick={() => handleAction('unban', name)}
                    variant="secondary"
                    size="sm"
                  >
                    Unban (Pardon)
                  </AppleButton>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
