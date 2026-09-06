import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  Download,
  Trash2,
  UploadCloud,
  Check,
  AlertCircle,
  Sparkles,
  Layers,
  FolderOpen,
  Filter
} from 'lucide-react';
import AppleButton from '../components/common/AppleButton';
import AppleToggle from '../components/common/AppleToggle';
import AppleCard from '../components/common/AppleCard';
import {
  fetchInstalledMods,
  toggleModState,
  deleteModFile,
  searchModrinthMods,
  installModrinthMod,
  uploadModJar
} from '../services/api';

export default function ModsView({
  activeServer,
  onNotify = () => {}
}) {
  const [activeTab, setActiveTab] = useState('installed'); // 'installed' | 'store'
  const [installedMods, setInstalledMods] = useState([]);
  const [loadingInstalled, setLoadingInstalled] = useState(false);

  // Store state
  const [storeQuery, setStoreQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingStore, setLoadingStore] = useState(false);
  const [installingId, setInstallingId] = useState(null);

  // Popular Modrinth categories
  const popularCategories = [
    { label: 'All', query: '' },
    { label: 'Optimization', query: 'optimization' },
    { label: 'Fabric API', query: 'fabric-api' },
    { label: 'Voice Chat', query: 'voicechat' },
    { label: 'World Gen', query: 'worldgen' },
    { label: 'Technology', query: 'technology' },
    { label: 'Magic', query: 'magic' },
    { label: 'Adventure', query: 'adventure' }
  ];
  const [selectedCategory, setSelectedCategory] = useState('');

  // Load installed mods
  const loadMods = async () => {
    if (!activeServer) return;
    setLoadingInstalled(true);
    try {
      const data = await fetchInstalledMods(activeServer.id);
      setInstalledMods(data);
    } catch (err) {
      onNotify('error', 'Error', err.message);
    } finally {
      setLoadingInstalled(false);
    }
  };

  useEffect(() => {
    loadMods();
  }, [activeServer?.id]);

  // Search Modrinth store
  const handleSearchStore = async (q = storeQuery, cat = selectedCategory) => {
    if (!activeServer) return;
    setLoadingStore(true);
    try {
      const combinedQuery = [q, cat].filter(Boolean).join(' ');
      const res = await searchModrinthMods({
        query: combinedQuery,
        loader: activeServer.type === 'paper' || activeServer.type === 'purpur' ? 'paper' : activeServer.type,
        version: activeServer.version
      });
      setSearchResults(res.hits || []);
    } catch (err) {
      onNotify('error', 'Search Failed', err.message);
    } finally {
      setLoadingStore(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'store') {
      handleSearchStore(storeQuery, selectedCategory);
    }
  }, [activeTab, selectedCategory]);

  const handleToggle = async (mod) => {
    try {
      await toggleModState(activeServer.id, mod.fileName, mod.folder);
      await loadMods();
      onNotify('success', 'Mod Updated', `${mod.name} is now ${mod.enabled ? 'disabled' : 'enabled'}`);
    } catch (err) {
      onNotify('error', 'Error', err.message);
    }
  };

  const handleDelete = async (mod) => {
    if (!confirm(`Delete ${mod.name}?`)) return;
    try {
      await deleteModFile(activeServer.id, mod.fileName, mod.folder);
      await loadMods();
      onNotify('success', 'Mod Removed', `${mod.name} deleted`);
    } catch (err) {
      onNotify('error', 'Error', err.message);
    }
  };

  const handleInstallFromStore = async (hit) => {
    setInstallingId(hit.id);
    try {
      await installModrinthMod({
        serverId: activeServer.id,
        projectId: hit.id,
        loader: activeServer.type,
        folder: activeServer.type === 'paper' || activeServer.type === 'purpur' ? 'plugins' : 'mods'
      });
      onNotify('success', 'Installed!', `${hit.title} has been downloaded and installed.`);
      await loadMods();
    } catch (err) {
      onNotify('error', 'Install Error', err.message);
    } finally {
      setInstallingId(null);
    }
  };

  // Upload JAR handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        await uploadModJar(activeServer.id, file.name, base64);
        onNotify('success', 'Uploaded', `${file.name} successfully installed`);
        await loadMods();
      } catch (err) {
        onNotify('error', 'Upload Error', err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const enabledCount = installedMods.filter(m => m.enabled).length;

  return (
    <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-apple-indigo to-apple-purple flex items-center justify-center text-white shadow-md">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Mods & Plugins Manager</h2>
            <p className="text-xs text-white/50">
              {activeServer?.type.toUpperCase()} • {installedMods.length} packages ({enabledCount} active)
            </p>
          </div>
        </div>

        {/* Apple Segmented Control */}
        <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'installed'
                ? 'bg-apple-blue text-white shadow-apple-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Installed ({installedMods.length})
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-4 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'store'
                ? 'bg-apple-blue text-white shadow-apple-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Modrinth Store
          </button>
        </div>
      </div>

      {/* TAB 1: INSTALLED MODS */}
      {activeTab === 'installed' && (
        <div className="flex flex-col gap-4">
          {/* Top Actions: Upload JAR & Metrics */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 font-medium">
                Active: <strong className="text-emerald-400">{enabledCount}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 font-medium">
                Disabled: <strong className="text-white/40">{installedMods.length - enabledCount}</strong>
              </span>
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".jar"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="px-4 py-2 rounded-xl bg-apple-blue/20 hover:bg-apple-blue/30 text-apple-blue border border-apple-blue/30 text-xs font-semibold flex items-center gap-2 transition-colors">
                <UploadCloud className="w-4 h-4" />
                Upload .JAR Mod
              </div>
            </label>
          </div>

          {/* Installed Mod Cards List */}
          {installedMods.length === 0 ? (
            <div className="py-16 text-center text-white/40 glass-card rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-3">
              <Boxes className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No mods or plugins installed yet</p>
              <AppleButton onClick={() => setActiveTab('store')} variant="primary" size="sm" icon={Sparkles}>
                Browse Modrinth Store
              </AppleButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {installedMods.map((mod) => (
                <div
                  key={mod.fileName}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    mod.enabled
                      ? 'glass-card border-white/10'
                      : 'bg-white/[0.02] border-white/5 opacity-60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{mod.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 uppercase font-mono">
                        {mod.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5 font-mono">{mod.size}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <AppleToggle
                      checked={mod.enabled}
                      onChange={() => handleToggle(mod)}
                      size="sm"
                    />
                    <button
                      onClick={() => handleDelete(mod)}
                      className="p-1.5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete mod"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MODRINTH STORE */}
      {activeTab === 'store' && (
        <div className="flex flex-col gap-4">
          {/* Search & Categories */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-3 text-white/40" />
              <input
                type="text"
                value={storeQuery}
                onChange={(e) => {
                  setStoreQuery(e.target.value);
                  handleSearchStore(e.target.value, selectedCategory);
                }}
                placeholder="Search thousands of mods on Modrinth (e.g. Sodium, Voice Chat, Geyser)..."
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl glass-input text-sm text-white focus:outline-none"
              />
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {popularCategories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => {
                    setSelectedCategory(cat.query);
                    handleSearchStore(storeQuery, cat.query);
                  }}
                  className={`px-3 py-1 rounded-xl whitespace-nowrap transition-colors ${
                    selectedCategory === cat.query
                      ? 'bg-apple-blue text-white font-semibold shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 text-white/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          {loadingStore ? (
            <div className="py-20 text-center text-white/50 text-xs">Searching Modrinth repository...</div>
          ) : searchResults.length === 0 ? (
            <div className="py-20 text-center text-white/40 text-xs">No mods found matching your criteria.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((hit) => {
                const isInstalling = installingId === hit.id;

                return (
                  <div
                    key={hit.id}
                    className="p-4 rounded-2xl glass-card border border-white/10 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {hit.iconUrl ? (
                        <img
                          src={hit.iconUrl}
                          alt={hit.title}
                          className="w-11 h-11 rounded-xl bg-black/40 border border-white/10 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-apple-blue/20 border border-apple-blue/30 flex items-center justify-center text-apple-blue flex-shrink-0">
                          <Boxes className="w-6 h-6" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{hit.title}</h3>
                          <span className="text-[10px] text-white/40 font-mono flex-shrink-0">
                            {(hit.downloads || 0).toLocaleString()} DLs
                          </span>
                        </div>
                        <p className="text-xs text-white/50 line-clamp-2 mt-1 leading-relaxed">
                          {hit.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[10px] text-white/40">by {hit.author}</span>
                      <AppleButton
                        onClick={() => handleInstallFromStore(hit)}
                        variant="primary"
                        size="sm"
                        icon={Download}
                        loading={isInstalling}
                      >
                        1-Click Install
                      </AppleButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
