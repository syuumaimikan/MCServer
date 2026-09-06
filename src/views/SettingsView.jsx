import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  HardDrive,
  Gamepad2,
  Cpu,
  Globe,
  Palette,
  Sparkles
} from 'lucide-react';
import AppleButton from '../components/common/AppleButton';
import AppleToggle from '../components/common/AppleToggle';
import AppleCard from '../components/common/AppleCard';
import {
  fetchServerProperties,
  saveServerProperties,
  fetchCraftosConfig,
  saveCraftosConfig
} from '../services/api';

export default function SettingsView({
  activeServer,
  onNotify = () => {},
  onServerUpdated = () => {}
}) {
  const [properties, setProperties] = useState({});
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const mcColors = [
    { label: 'Green', code: '§a', color: '#55FF55' },
    { label: 'Aqua', code: '§b', color: '#55FFFF' },
    { label: 'Red', code: '§c', color: '#FF5555' },
    { label: 'Pink', code: '§d', color: '#FF55FF' },
    { label: 'Yellow', code: '§e', color: '#FFFF55' },
    { label: 'White', code: '§f', color: '#FFFFFF' },
    { label: 'Gold', code: '§6', color: '#FFAA00' },
    { label: 'Blue', code: '§9', color: '#5555FF' },
    { label: 'Bold', code: '§l', color: '#FFFFFF' }
  ];

  const loadSettings = async () => {
    if (!activeServer) return;
    setLoading(true);
    try {
      const [props, cfg] = await Promise.all([
        fetchServerProperties(activeServer.id),
        fetchCraftosConfig(activeServer.id)
      ]);
      setProperties(props);
      setConfig(cfg);
    } catch (err) {
      onNotify('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [activeServer?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveServerProperties(activeServer.id, properties),
        saveCraftosConfig(activeServer.id, config)
      ]);
      onNotify('success', 'Saved', 'Server settings updated. Restart server if running for changes to apply.');
      onServerUpdated({ ...activeServer, ...config, motd: properties.motd });
    } catch (err) {
      onNotify('error', 'Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateProp = (key, val) => {
    setProperties(prev => ({ ...prev, [key]: val }));
  };

  const updateCfg = (key, val) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  const insertColorCode = (code) => {
    updateProp('motd', (properties.motd || '') + code);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto min-h-0 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-apple-blue to-apple-indigo flex items-center justify-center text-white shadow-md">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Server Properties & JVM</h2>
            <p className="text-xs text-white/50">Fine-tune memory, network, gameplay, and performance</p>
          </div>
        </div>

        <AppleButton
          onClick={handleSave}
          variant="primary"
          icon={Save}
          loading={saving}
          size="md"
        >
          Save Changes
        </AppleButton>
      </div>

      {/* SECTION 1: SYSTEM & MEMORY (JVM) */}
      <AppleCard title="Memory & JVM Optimizations" subtitle="Configure Java arguments and hardware allocation" icon={Cpu}>
        <div className="flex flex-col gap-5 mt-2">
          {/* RAM Allocation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white/80">RAM Allocation</span>
              <span className="text-xs font-mono font-bold text-apple-purple px-2 py-0.5 rounded-lg bg-apple-purple/20 border border-apple-purple/30">
                {config.ram || 4} GB
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="16"
              step="1"
              value={config.ram || 4}
              onChange={(e) => updateCfg('ram', Number(e.target.value))}
              className="w-full accent-apple-purple cursor-pointer"
            />
          </div>

          {/* Aikar Flags Switch */}
          <div className="pt-2 border-t border-white/5">
            <AppleToggle
              checked={config.aikarFlags !== false}
              onChange={(val) => updateCfg('aikarFlags', val)}
              label="Aikar's Optimized G1GC JVM Flags"
              description="Eliminates Garbage Collection micro-stutters and maximizes multiplayer TPS performance"
            />
          </div>

          {/* Java Executable Path */}
          <div className="pt-2 border-t border-white/5">
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
              Java Path (Runtime)
            </label>
            <input
              type="text"
              value={config.javaPath || 'java'}
              onChange={(e) => updateCfg('javaPath', e.target.value)}
              className="w-full px-4 py-2 rounded-2xl glass-input text-xs text-white font-mono focus:outline-none"
              placeholder="e.g. java or C:\Program Files\Java\jdk-21\bin\java.exe"
            />
          </div>
        </div>
      </AppleCard>

      {/* SECTION 2: GENERAL & MOTD */}
      <AppleCard title="General & Presentation" subtitle="Server description and network ports" icon={Globe}>
        <div className="flex flex-col gap-4 mt-2">
          {/* MOTD with Color Code Bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Server MOTD (Message of the Day)
              </label>
              <div className="flex items-center gap-1">
                {mcColors.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => insertColorCode(c.code)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-white/10 hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${c.color}22`, color: c.color }}
                    title={`Insert ${c.label} code (${c.code})`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={properties.motd || ''}
              onChange={(e) => updateProp('motd', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl glass-input text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                Server Port
              </label>
              <input
                type="number"
                value={properties['server-port'] || 25565}
                onChange={(e) => updateProp('server-port', Number(e.target.value))}
                className="w-full px-4 py-2 rounded-2xl glass-input text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                Max Players
              </label>
              <input
                type="number"
                value={properties['max-players'] || 20}
                onChange={(e) => updateProp('max-players', Number(e.target.value))}
                className="w-full px-4 py-2 rounded-2xl glass-input text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                Online Mode
              </label>
              <select
                value={String(properties['online-mode'] !== false)}
                onChange={(e) => updateProp('online-mode', e.target.value === 'true')}
                className="w-full px-4 py-2 rounded-2xl glass-input text-xs text-white bg-[#1a1d26] focus:outline-none"
              >
                <option value="true">Enabled (Official Accounts)</option>
                <option value="false">Disabled (Offline/LAN Mode)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <AppleToggle
              checked={properties['white-list'] === true}
              onChange={(val) => updateProp('white-list', val)}
              label="Enforce Whitelist"
              description="Only allow players in the whitelist to connect"
            />
          </div>
        </div>
      </AppleCard>

      {/* SECTION 3: GAMEPLAY RULES */}
      <AppleCard title="Gameplay & Rules" subtitle="Difficulty, gamemode, PVP, and flight permissions" icon={Gamepad2}>
        <div className="flex flex-col gap-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                Default Gamemode
              </label>
              <select
                value={properties.gamemode || 'survival'}
                onChange={(e) => updateProp('gamemode', e.target.value)}
                className="w-full px-4 py-2 rounded-2xl glass-input text-xs text-white bg-[#1a1d26] focus:outline-none capitalize"
              >
                <option value="survival">Survival</option>
                <option value="creative">Creative</option>
                <option value="adventure">Adventure</option>
                <option value="spectator">Spectator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                Difficulty
              </label>
              <select
                value={properties.difficulty || 'easy'}
                onChange={(e) => updateProp('difficulty', e.target.value)}
                className="w-full px-4 py-2 rounded-2xl glass-input text-xs text-white bg-[#1a1d26] focus:outline-none capitalize"
              >
                <option value="peaceful">Peaceful</option>
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <AppleToggle
              checked={properties.pvp !== false}
              onChange={(val) => updateProp('pvp', val)}
              label="Player vs Player (PvP)"
              description="Allow players to damage each other"
            />
            <AppleToggle
              checked={properties['allow-flight'] === true}
              onChange={(val) => updateProp('allow-flight', val)}
              label="Allow Flight"
              description="Permit survival flight (modded jetpacks / elytra checks)"
            />
            <AppleToggle
              checked={properties['spawn-monsters'] !== false}
              onChange={(val) => updateProp('spawn-monsters', val)}
              label="Spawn Monsters"
              description="Zombies, Skeletons, Creepers, etc."
            />
            <AppleToggle
              checked={properties['spawn-animals'] !== false}
              onChange={(val) => updateProp('spawn-animals', val)}
              label="Spawn Animals"
              description="Cows, Pigs, Sheep, Chickens, etc."
            />
          </div>
        </div>
      </AppleCard>

      {/* SECTION 4: PERFORMANCE & VIEW DISTANCE */}
      <AppleCard title="Performance & Render Distance" subtitle="Tune server tick load and chunk transmission" icon={HardDrive}>
        <div className="flex flex-col gap-4 mt-2">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white/80">View Distance</span>
              <span className="text-xs font-mono font-bold text-apple-blue">{properties['view-distance'] || 10} chunks</span>
            </div>
            <input
              type="range"
              min="4"
              max="32"
              step="1"
              value={properties['view-distance'] || 10}
              onChange={(e) => updateProp('view-distance', Number(e.target.value))}
              className="w-full accent-apple-blue cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white/80">Simulation Distance</span>
              <span className="text-xs font-mono font-bold text-apple-teal">{properties['simulation-distance'] || 8} chunks</span>
            </div>
            <input
              type="range"
              min="4"
              max="24"
              step="1"
              value={properties['simulation-distance'] || 8}
              onChange={(e) => updateProp('simulation-distance', Number(e.target.value))}
              className="w-full accent-apple-teal cursor-pointer"
            />
          </div>
        </div>
      </AppleCard>
    </div>
  );
}
