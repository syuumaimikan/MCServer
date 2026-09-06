import React, { useState, useEffect } from 'react';
import {
  Globe2,
  HardDrive,
  RotateCcw,
  Trash2,
  Archive,
  Flame,
  Moon,
  Sparkles,
  ShieldCheck,
  Plus
} from 'lucide-react';
import AppleButton from '../components/common/AppleButton';
import AppleCard from '../components/common/AppleCard';
import {
  fetchWorldInfo,
  fetchBackups,
  createBackupNow,
  restoreBackupFile,
  deleteBackupFile,
  resetWorldDimension
} from '../services/api';

export default function WorldsView({
  activeServer,
  onNotify = () => {}
}) {
  const [worldInfo, setWorldInfo] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backupLabel, setBackupLabel] = useState('');
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringFile, setRestoringFile] = useState(null);

  const loadData = async () => {
    if (!activeServer) return;
    setLoading(true);
    try {
      const [wInfo, bList] = await Promise.all([
        fetchWorldInfo(activeServer.id),
        fetchBackups(activeServer.id)
      ]);
      setWorldInfo(wInfo);
      setBackups(bList);
    } catch (err) {
      onNotify('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeServer?.id]);

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const label = backupLabel.trim() || 'snapshot';
      await createBackupNow(activeServer.id, label);
      setBackupLabel('');
      onNotify('success', 'Backup Complete', 'ZIP snapshot created successfully');
      await loadData();
    } catch (err) {
      onNotify('error', 'Backup Failed', err.message);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestore = async (backup) => {
    if (!confirm(`Restore backup "${backup.fileName}"? This will overwrite the current world state.`)) return;
    setRestoringFile(backup.fileName);
    try {
      await restoreBackupFile(activeServer.id, backup.fileName);
      onNotify('success', 'Restored', 'World restored from backup point.');
      await loadData();
    } catch (err) {
      onNotify('error', 'Restore Failed', err.message);
    } finally {
      setRestoringFile(null);
    }
  };

  const handleDeleteBackup = async (backup) => {
    if (!confirm(`Delete backup "${backup.fileName}"?`)) return;
    try {
      await deleteBackupFile(activeServer.id, backup.fileName);
      onNotify('success', 'Deleted', 'Backup removed.');
      await loadData();
    } catch (err) {
      onNotify('error', 'Error', err.message);
    }
  };

  const handleResetDimension = async (dim) => {
    if (!confirm(`Are you sure you want to completely RESET the ${dim.toUpperCase()} dimension? All structures and items in that dimension will be regenerated.`)) return;
    try {
      await resetWorldDimension(activeServer.id, dim);
      onNotify('success', 'Dimension Reset', `${dim.toUpperCase()} has been reset.`);
      await loadData();
    } catch (err) {
      onNotify('error', 'Reset Failed', err.message);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Worlds & Backup Vault</h2>
            <p className="text-xs text-white/50">Manage dimensions and 1-click snapshot restore points</p>
          </div>
        </div>
      </div>

      {/* World Dimensions Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overworld */}
        <AppleCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Overworld</span>
            </div>
            <span className="text-[10px] text-white/40 font-mono">
              {worldInfo?.dimensions?.overworld?.size || '0 B'}
            </span>
          </div>
          <p className="text-xs text-white/50 mb-3">
            Primary surface world containing spawn, builds, and standard biomes.
          </p>
          <div className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 inline-block">
            Active Dimension
          </div>
        </AppleCard>

        {/* Nether */}
        <AppleCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-white">The Nether</span>
            </div>
            <span className="text-[10px] text-white/40 font-mono">
              {worldInfo?.dimensions?.nether?.size || '0 B'}
            </span>
          </div>
          <p className="text-xs text-white/50 mb-3">
            Hellish underworld dimension with fortresses, bastions, and lava seas.
          </p>
          <AppleButton
            onClick={() => handleResetDimension('nether')}
            variant="danger"
            size="sm"
            icon={RotateCcw}
          >
            Reset Nether
          </AppleButton>
        </AppleCard>

        {/* The End */}
        <AppleCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white">The End</span>
            </div>
            <span className="text-[10px] text-white/40 font-mono">
              {worldInfo?.dimensions?.end?.size || '0 B'}
            </span>
          </div>
          <p className="text-xs text-white/50 mb-3">
            Outer void islands, Ender Dragon arena, and End Cities.
          </p>
          <AppleButton
            onClick={() => handleResetDimension('end')}
            variant="secondary"
            size="sm"
            icon={RotateCcw}
          >
            Reset The End
          </AppleButton>
        </AppleCard>
      </div>

      {/* 1-Click Backup Vault Section */}
      <AppleCard
        title="Backup Vault & Snapshots"
        subtitle="Create automatic timestamped ZIP backups before doing major changes"
        icon={Archive}
      >
        {/* Create Backup Input */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2 mb-6">
          <input
            type="text"
            placeholder="Backup description (e.g. before-updating-mods, pre-dragon-fight)..."
            value={backupLabel}
            onChange={(e) => setBackupLabel(e.target.value)}
            className="flex-1 w-full px-4 py-2.5 rounded-2xl glass-input text-xs text-white placeholder-white/40 focus:outline-none"
          />
          <AppleButton
            onClick={handleCreateBackup}
            variant="primary"
            icon={Plus}
            loading={creatingBackup}
            size="md"
            className="w-full sm:w-auto"
          >
            Create Backup Now
          </AppleButton>
        </div>

        {/* Backups List */}
        <div className="flex flex-col gap-2">
          {backups.length === 0 ? (
            <div className="py-10 text-center text-white/40 text-xs">
              No backups created yet. Click &quot;Create Backup Now&quot; to make your first snapshot.
            </div>
          ) : (
            backups.map((b) => (
              <div
                key={b.fileName}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-apple-blue/15 border border-apple-blue/30 flex items-center justify-center text-apple-blue">
                    <Archive className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{b.fileName}</h4>
                    <p className="text-[10px] text-white/40 font-mono">
                      {new Date(b.createdAt).toLocaleString()} • {b.size}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AppleButton
                    onClick={() => handleRestore(b)}
                    variant="secondary"
                    size="sm"
                    icon={RotateCcw}
                    loading={restoringFile === b.fileName}
                  >
                    Restore
                  </AppleButton>
                  <button
                    onClick={() => handleDeleteBackup(b)}
                    className="p-1.5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete backup"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </AppleCard>
    </div>
  );
}
