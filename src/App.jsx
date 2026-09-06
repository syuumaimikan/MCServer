import React, { useState, useEffect, useRef } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import ServerWizardModal from './components/ServerWizardModal';
import NotificationToast from './components/common/NotificationToast';

import DashboardView from './views/DashboardView';
import ConsoleView from './views/ConsoleView';
import ModsView from './views/ModsView';
import WorldsView from './views/WorldsView';
import PlayersView from './views/PlayersView';
import SettingsView from './views/SettingsView';
import OptimizationView from './views/OptimizationView';
import GitHistoryView from './views/GitHistoryView';
import NetworkView from './views/NetworkView';
import CrashDoctorView from './views/CrashDoctorView';
import DocViewerModal from './components/DocViewerModal';

import {
  fetchServers,
  fetchSystemInfo,
  fetchServerState,
  startServer,
  stopServer,
  restartServer,
  deleteServerById,
  ServerWebSocket
} from './services/api';

export default function App() {
  const [servers, setServers] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [serverState, setServerState] = useState(null);
  const [logs, setLogs] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const wsRef = useRef(null);

  const notify = (type, title, message) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setNotifications((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Initial Load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [sys, srvs] = await Promise.all([
        fetchSystemInfo().catch(() => null),
        fetchServers().catch(() => [])
      ]);

      if (sys) setSystemInfo(sys);
      setServers(srvs);

      if (srvs.length > 0) {
        setActiveServer(srvs[0]);
      } else {
        // Auto open wizard if no servers exist
        setIsWizardOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Manage WebSocket connection whenever active server changes
  useEffect(() => {
    if (!activeServer) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    // Connect WS
    wsRef.current = new ServerWebSocket(activeServer.id, (event) => {
      if (event.type === 'init') {
        if (event.state) setServerState(event.state);
        if (event.logs) setLogs(event.logs);
      } else if (event.type === 'status') {
        setServerState(event.data);
      } else if (event.type === 'log') {
        setLogs((prev) => [...prev, event.data].slice(-1500));
      } else if (event.type === 'player_joined') {
        notify('info', 'Player Joined', `${event.data.player} joined the game`);
      } else if (event.type === 'player_left') {
        notify('info', 'Player Left', `${event.data.player} left the game`);
      }
    });

    // Also fetch initial REST state
    fetchServerState(activeServer.id)
      .then(setServerState)
      .catch(() => {});

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [activeServer?.id]);

  const handleStart = async () => {
    if (!activeServer) return;
    setIsActionLoading(true);
    try {
      const res = await startServer(activeServer.id);
      setServerState(res.state);
      notify('success', 'Server Starting', `Launching ${activeServer.name}...`);
    } catch (err) {
      notify('error', 'Start Failed', err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeServer) return;
    setIsActionLoading(true);
    try {
      await stopServer(activeServer.id);
      notify('info', 'Server Stopping', 'Sending graceful stop signal...');
    } catch (err) {
      notify('error', 'Stop Failed', err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!activeServer) return;
    setIsActionLoading(true);
    try {
      await restartServer(activeServer.id);
      notify('info', 'Restarting Server', 'Server will restart shortly...');
    } catch (err) {
      notify('error', 'Restart Failed', err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteServer = async (serverId) => {
    try {
      await deleteServerById(serverId);
      notify('info', 'Deleted', 'Server has been removed');
      const updated = await fetchServers();
      setServers(updated);
      if (activeServer?.id === serverId) {
        setActiveServer(updated.length > 0 ? updated[0] : null);
      }
    } catch (err) {
      notify('error', 'Delete Failed', err.message);
    }
  };

  const handleServerCreated = async (newServer) => {
    notify('success', 'Created!', `${newServer.name} is ready to launch.`);
    const srvs = await fetchServers();
    setServers(srvs);
    const found = srvs.find((s) => s.id === newServer.id) || newServer;
    setActiveServer(found);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d0f14] text-white overflow-hidden select-none font-sans">
      {/* Dynamic Toast Notifications */}
      <NotificationToast
        notifications={notifications}
        onClose={removeNotification}
      />

      {/* Top macOS Style Titlebar */}
      <TitleBar
        activeServer={activeServer}
        serverState={serverState}
        systemInfo={systemInfo}
      />

      {/* Main Container: Sidebar + Active View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          servers={servers}
          activeServer={activeServer}
          onSelectServer={setActiveServer}
          onOpenCreateWizard={() => setIsWizardOpen(true)}
          onDeleteServer={handleDeleteServer}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          serverState={serverState}
          onStartServer={handleStart}
          onStopServer={handleStop}
          onRestartServer={handleRestart}
          onOpenDocs={() => setIsDocsOpen(true)}
          isActionLoading={isActionLoading}
        />

        <main className="flex-1 flex flex-col bg-gradient-to-br from-[#12141c] to-[#0c0e13] overflow-hidden relative">
          {activeTab === 'dashboard' && (
            <DashboardView
              activeServer={activeServer}
              serverState={serverState}
              systemInfo={systemInfo}
              onStartServer={handleStart}
              onStopServer={handleStop}
              onRestartServer={handleRestart}
              onTabChange={setActiveTab}
              isActionLoading={isActionLoading}
            />
          )}

          {activeTab === 'console' && (
            <ConsoleView
              activeServer={activeServer}
              serverState={serverState}
              logs={logs}
              onClearLogs={() => setLogs([])}
            />
          )}

          {activeTab === 'optimization' && (
            <OptimizationView
              activeServer={activeServer}
              onToast={(t) => notify(t.type || 'info', t.title, t.message)}
            />
          )}

          {activeTab === 'crash_doctor' && (
            <CrashDoctorView
              activeServer={activeServer}
              onNotify={notify}
              onTabChange={setActiveTab}
            />
          )}

          {activeTab === 'mods' && (
            <ModsView
              activeServer={activeServer}
              onNotify={notify}
            />
          )}

          {activeTab === 'worlds' && (
            <WorldsView
              activeServer={activeServer}
              onNotify={notify}
            />
          )}

          {activeTab === 'git' && (
            <GitHistoryView
              activeServer={activeServer}
              onToast={(t) => notify(t.type || 'info', t.title, t.message)}
            />
          )}

          {activeTab === 'players' && (
            <PlayersView
              activeServer={activeServer}
              serverState={serverState}
              onNotify={notify}
            />
          )}

          {activeTab === 'network' && (
            <NetworkView
              activeServer={activeServer}
              onToast={(t) => notify(t.type || 'info', t.title, t.message)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              activeServer={activeServer}
              onNotify={notify}
              onServerUpdated={(updated) => {
                setActiveServer(updated);
                fetchServers().then(setServers);
              }}
            />
          )}
        </main>
      </div>

      {/* 3-Step Creation Wizard Modal */}
      <ServerWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onServerCreated={handleServerCreated}
      />

      {/* Documentation & Manual Modal */}
      <DocViewerModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
