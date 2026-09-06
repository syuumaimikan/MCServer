import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Send,
  Trash2,
  Download,
  Filter,
  ArrowDown,
  Sparkles,
  Search,
  Check
} from 'lucide-react';
import AppleButton from '../components/common/AppleButton';
import AppleCard from '../components/common/AppleCard';
import { sendServerCommand } from '../services/api';

export default function ConsoleView({
  activeServer,
  serverState,
  logs = [],
  onClearLogs = () => {}
}) {
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [filterLevel, setFilterLevel] = useState('ALL'); // ALL, INFO, WARN, ERROR, COMMAND
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const logsEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleSendCommand = async (cmdToSend) => {
    const cmd = cmdToSend || commandInput;
    if (!cmd.trim() || !activeServer) return;

    setIsSending(true);
    try {
      await sendServerCommand(activeServer.id, cmd);
      setCommandHistory((prev) => [cmd, ...prev.filter(c => c !== cmd)].slice(0, 50));
      setHistoryIndex(-1);
      setCommandInput('');
    } catch (err) {
      console.error('Failed to send command:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommandInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommandInput(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput('');
      }
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const quickCommands = [
    'help',
    'list',
    'time set day',
    'weather clear',
    'save-all',
    'toggledownfall',
    'gamerule keepInventory true'
  ];

  return (
    <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-apple-blue/20 border border-apple-blue/30 flex items-center justify-center text-apple-blue">
            <TerminalIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Server Terminal & Logs
              {serverState?.status === 'RUNNING' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-apple-glow animate-pulse" />
              )}
            </h2>
            <p className="text-xs text-white/50">Live interactive Minecraft server console</p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/40" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs text-white placeholder-white/40 focus:outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            {['ALL', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
                  filterLevel === lvl
                    ? 'bg-apple-blue text-white shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-xl border transition-colors ${
              autoScroll
                ? 'bg-apple-blue/20 text-apple-blue border-apple-blue/30'
                : 'bg-white/5 text-white/40 border-white/10'
            }`}
            title="Toggle Auto Scroll"
          >
            <ArrowDown className="w-4 h-4" />
          </button>

          {/* Clear Logs */}
          <button
            onClick={onClearLogs}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/10 transition-colors"
            title="Clear logs view"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="flex-1 bg-[#0d0f14]/90 border border-white/10 rounded-2xl p-4 overflow-y-auto font-mono text-xs shadow-inner flex flex-col gap-1.5 relative select-text">
        {filteredLogs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-xs py-12">
            <TerminalIcon className="w-8 h-8 opacity-30 mb-2" />
            <span>No log messages to display</span>
          </div>
        ) : (
          filteredLogs.map((log) => {
            let textColor = 'text-white/80';
            if (log.level === 'WARN') textColor = 'text-amber-300';
            else if (log.level === 'ERROR') textColor = 'text-rose-400 font-semibold';
            else if (log.level === 'COMMAND') textColor = 'text-emerald-400 font-bold';

            return (
              <div key={log.id} className="flex items-start gap-2.5 leading-relaxed hover:bg-white/[0.02] px-1 py-0.5 rounded">
                <span className="text-white/30 text-[10px] select-none flex-shrink-0">{log.timestamp}</span>
                <span className={`break-all ${textColor}`}>{log.message}</span>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] text-white/40 uppercase font-semibold mr-1 flex-shrink-0">Quick Commands:</span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleSendCommand(cmd)}
            disabled={serverState?.status !== 'RUNNING'}
            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white text-[11px] font-mono whitespace-nowrap transition-colors disabled:opacity-40"
          >
            /{cmd}
          </button>
        ))}
      </div>

      {/* Command Input Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-3 text-apple-blue font-bold font-mono text-sm">&gt;</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              serverState?.status === 'RUNNING'
                ? 'Type server command (e.g. say Hello, op Steve, gamemode creative)...'
                : 'Server must be running to execute commands'
            }
            disabled={serverState?.status !== 'RUNNING'}
            className="w-full pl-8 pr-4 py-2.5 rounded-2xl glass-input text-sm text-white font-mono placeholder-white/30 focus:outline-none disabled:opacity-40"
          />
        </div>
        <AppleButton
          onClick={() => handleSendCommand()}
          variant="primary"
          icon={Send}
          disabled={!commandInput.trim() || serverState?.status !== 'RUNNING'}
          loading={isSending}
          size="md"
        >
          Send
        </AppleButton>
      </div>
    </div>
  );
}
