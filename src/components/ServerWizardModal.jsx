import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Scroll,
  Feather,
  Box,
  Wrench,
  Flame,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  HardDrive,
  DownloadCloud,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import AppleButton from './common/AppleButton';
import AppleToggle from './common/AppleToggle';
import { fetchVersions, createNewServer } from '../services/api';

export default function ServerWizardModal({
  isOpen = false,
  onClose = () => {},
  onServerCreated = () => {}
}) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('fabric');
  const [availableVersions, setAvailableVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Form State
  const [serverName, setServerName] = useState('My Minecraft Server');
  const [selectedVersion, setSelectedVersion] = useState('1.21.1');
  const [ramGB, setRamGB] = useState(4);
  const [serverPort, setServerPort] = useState(25565);
  const [motd, setMotd] = useState('§bWelcome to §aCraftOS §fMinecraft Server!');
  const [autoEula, setAutoEula] = useState(true);

  // Progress State
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState({ percent: 0, message: '', stage: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const serverEngines = [
    {
      id: 'fabric',
      name: 'Fabric',
      badge: 'Recommended',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Super fast, lightweight, and modern modding ecosystem (Sodium, Iris, Voice Chat).',
      icon: Zap,
      gradient: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/30 text-cyan-400'
    },
    {
      id: 'paper',
      name: 'Paper',
      badge: 'High Performance',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      description: 'The standard for multiplayer plugin servers (Spigot/Bukkit plugins) with extreme TPS optimization.',
      icon: Scroll,
      gradient: 'from-blue-500/20 to-indigo-600/20 border-blue-500/30 text-blue-400'
    },
    {
      id: 'purpur',
      name: 'Purpur',
      badge: 'Enhanced Paper',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'Drop-in Paper replacement designed for high customizability, creature rideability, and gameplay tweaks.',
      icon: Feather,
      gradient: 'from-purple-500/20 to-pink-600/20 border-purple-500/30 text-purple-400'
    },
    {
      id: 'vanilla',
      name: 'Vanilla',
      badge: 'Official Mojang',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Official Mojang server for pure, unaltered vanilla gameplay and Redstone accuracy.',
      icon: Box,
      gradient: 'from-amber-500/20 to-orange-600/20 border-amber-500/30 text-amber-400'
    },
    {
      id: 'neoforge',
      name: 'NeoForge',
      badge: 'Next-Gen Mods',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      description: 'Modern fork of Forge built for 1.20.4+ modpacks and cutting-edge mod loaders.',
      icon: Flame,
      gradient: 'from-rose-500/20 to-red-600/20 border-rose-500/30 text-rose-400'
    },
    {
      id: 'forge',
      name: 'Forge',
      badge: 'Classic Modpacks',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      description: 'Legacy modding giant compatible with thousands of existing CurseForge modpacks.',
      icon: Wrench,
      gradient: 'from-yellow-500/20 to-amber-600/20 border-yellow-500/30 text-yellow-400'
    }
  ];

  // Fetch available versions when engine changes
  useEffect(() => {
    if (!isOpen) return;
    setLoadingVersions(true);
    fetchVersions(selectedType)
      .then((versions) => {
        setAvailableVersions(versions);
        if (versions.length > 0) {
          // Default to latest or 1.21.1
          const preferred = versions.find(v => v.version === '1.21.1') || versions[0];
          setSelectedVersion(preferred.version);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingVersions(false));
  }, [selectedType, isOpen]);

  const handleStartCreation = async () => {
    setIsInstalling(true);
    setErrorMessage('');
    setInstallProgress({ percent: 15, message: 'Initiating server download...', stage: 'starting' });

    try {
      const result = await createNewServer({
        name: serverName,
        type: selectedType,
        version: selectedVersion,
        ram: ramGB,
        port: Number(serverPort) || 25565,
        motd,
        autoEula
      });

      setInstallProgress({ percent: 100, message: 'Server ready!', stage: 'done' });
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        setIsInstalling(false);
        onServerCreated(result.server);
        onClose();
        // Reset state
        setStep(1);
      }, 1200);

    } catch (err) {
      setErrorMessage(err.message || 'Failed to create server');
      setIsInstalling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-[#1a1d26] border border-white/15 rounded-3xl shadow-apple-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-apple-blue/20 border border-apple-blue/30 flex items-center justify-center text-apple-blue">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Create Minecraft Server</h2>
              <p className="text-xs text-white/50">Fast, optimized, and ready in 3 simple steps</p>
            </div>
          </div>
          {!isInstalling && (
            <button
              onClick={onClose}
              className="p-1.5 text-white/40 hover:text-white/80 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
          {[
            { num: 1, title: 'Engine' },
            { num: 2, title: 'Configuration' },
            { num: 3, title: 'Install & Launch' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.num
                    ? 'bg-apple-blue text-white shadow-apple-glow'
                    : step > s.num
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className={`text-xs font-medium ${step === s.num ? 'text-white' : 'text-white/40'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <X className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Engine Selection */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Select Server Software
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serverEngines.map((engine) => {
                  const Icon = engine.icon;
                  const isSelected = selectedType === engine.id;

                  return (
                    <div
                      key={engine.id}
                      onClick={() => setSelectedType(engine.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-apple-blue/15 border-apple-blue shadow-apple-glow scale-[1.01]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${engine.gradient}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${engine.badgeColor}`}>
                          {engine.badge}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white mb-1 flex items-center justify-between">
                        {engine.name}
                        {isSelected && <Check className="w-4 h-4 text-apple-blue" />}
                      </h3>
                      <p className="text-xs text-white/50 leading-relaxed">{engine.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Configuration */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              {/* Server Name */}
              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                  Server Name
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="e.g. Survival SMP with Friends"
                  className="w-full px-4 py-2.5 rounded-2xl glass-input text-sm text-white focus:outline-none"
                />
              </div>

              {/* Version Picker */}
              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                  Minecraft Version ({selectedType.toUpperCase()})
                </label>
                {loadingVersions ? (
                  <div className="text-xs text-white/50 py-2">Fetching versions...</div>
                ) : (
                  <select
                    value={selectedVersion}
                    onChange={(e) => setSelectedVersion(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl glass-input text-sm text-white bg-[#1a1d26] focus:outline-none"
                  >
                    {availableVersions.map((v) => (
                      <option key={v.version} value={v.version} className="bg-[#1a1d26] text-white">
                        Minecraft {v.version} {v.stable ? '(Stable)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* RAM Slider */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-apple-purple" />
                    <span className="text-xs font-semibold text-white">RAM Allocation</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-apple-purple px-2 py-0.5 rounded-lg bg-apple-purple/20 border border-apple-purple/30">
                    {ramGB} GB
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="1"
                  value={ramGB}
                  onChange={(e) => setRamGB(Number(e.target.value))}
                  className="w-full accent-apple-purple cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-white/40 mt-1">
                  <span>2 GB (Minimal)</span>
                  <span>4 GB (Recommended)</span>
                  <span>8 GB (Modpack)</span>
                  <span>16 GB (Heavy)</span>
                </div>
              </div>

              {/* Server Port & MOTD */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                    Port
                  </label>
                  <input
                    type="number"
                    value={serverPort}
                    onChange={(e) => setServerPort(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl glass-input text-sm text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                    MOTD (Server Description)
                  </label>
                  <input
                    type="text"
                    value={motd}
                    onChange={(e) => setMotd(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl glass-input text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Summary & EULA */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">Configuration Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-white/50">Software:</div>
                  <div className="font-semibold text-white capitalize">{selectedType}</div>
                  <div className="text-white/50">Version:</div>
                  <div className="font-semibold text-white">Minecraft {selectedVersion}</div>
                  <div className="text-white/50">Memory:</div>
                  <div className="font-semibold text-white">{ramGB} GB RAM (Aikar Optimized)</div>
                  <div className="text-white/50">Port:</div>
                  <div className="font-semibold text-white font-mono">{serverPort}</div>
                </div>
              </div>

              {/* Auto EULA Agreement */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <AppleToggle
                  checked={autoEula}
                  onChange={setAutoEula}
                  label="Agree to Minecraft EULA automatically"
                  description="Required to run Minecraft Java Edition server (https://aka.ms/MinecraftEULA)"
                />
              </div>

              {isInstalling && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/80 font-medium flex items-center gap-2">
                      <DownloadCloud className="w-4 h-4 text-apple-blue animate-bounce" />
                      {installProgress.message || 'Preparing installation...'}
                    </span>
                    <span className="font-mono text-apple-blue font-bold">{installProgress.percent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-apple-blue to-apple-indigo rounded-full"
                      animate={{ width: `${installProgress.percent}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-[#141720]/80">
          {step > 1 && !isInstalling ? (
            <AppleButton
              onClick={() => setStep(step - 1)}
              variant="secondary"
              icon={ChevronLeft}
            >
              Back
            </AppleButton>
          ) : <div />}

          <div className="flex items-center gap-2">
            {!isInstalling && (
              <AppleButton onClick={onClose} variant="ghost">
                Cancel
              </AppleButton>
            )}

            {step < 3 ? (
              <AppleButton
                onClick={() => setStep(step + 1)}
                variant="primary"
                icon={ChevronRight}
              >
                Continue
              </AppleButton>
            ) : (
              <AppleButton
                onClick={handleStartCreation}
                variant="primary"
                loading={isInstalling}
                icon={Sparkles}
              >
                Create & Setup Server
              </AppleButton>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
