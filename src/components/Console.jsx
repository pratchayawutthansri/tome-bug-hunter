import React, { useEffect, useRef } from 'react';
import { Terminal, Trash2 } from 'lucide-react';

export default function Console({ logs, setLogs }) {
  const terminalEndRef = useRef(null);

  // Automatically scroll terminal to bottom on new logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const clearLogs = () => {
    setLogs([{ text: `[${new Date().toTimeString().split(' ')[0]}] [SYS] Terminal console cleared. Ready for execution...`, type: 'sys' }]);
  };

  const getLogClass = (type) => {
    switch (type) {
      case 'sys': return 'terminal-sys';
      case 'info': return 'terminal-info';
      case 'warn': return 'terminal-warn';
      case 'err': return 'terminal-err';
      default: return '';
    }
  };

  return (
    <div className="console-panel">
      {/* Header bar */}
      <div className="console-header">
        <div className="console-header-title">
          <Terminal className="icon-sm" style={{ color: '#10b981' }} />
          <span>Live Simulated Terminal</span>
        </div>
        <button
          onClick={clearLogs}
          className="console-clear-btn"
          title="Clear Console"
        >
          <Trash2 className="icon-xs" />
        </button>
      </div>

      {/* Lines display */}
      <div className="console-body">
        {logs.map((log, index) => (
          <div key={index} className={`terminal-line ${getLogClass(log.type)}`}>
            {log.text}
          </div>
        ))}
        {/* Blinking shell cursor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', marginTop: '4px' }}>
          <span>$</span>
          <span style={{ width: '6px', height: '14px', backgroundColor: '#10b981', display: 'inline-block', animation: 'scan-animation 1s infinite' }} />
        </div>
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
