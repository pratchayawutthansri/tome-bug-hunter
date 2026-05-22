import React from 'react';
import { Network, Database, Cpu, RefreshCw, Activity } from 'lucide-react';

export default function ControlPanel({ config, setConfig, generateQAAuditReport }) {
  const handleLatencyChange = (e) => {
    setConfig((prev) => ({ ...prev, networkLatency: parseInt(e.target.value, 10) }));
  };

  const handleCpuChange = (e) => {
    setConfig((prev) => ({ ...prev, cpuLoad: parseInt(e.target.value, 10) }));
  };

  const handleRpsChange = (e) => {
    setConfig((prev) => ({ ...prev, rps: parseInt(e.target.value, 10) }));
  };

  const toggleDatabase = () => {
    setConfig((prev) => ({
      ...prev,
      databaseStatus: prev.databaseStatus === 'online' ? 'offline' : 'online'
    }));
  };

  const toggleMemoryLeak = () => {
    setConfig((prev) => ({
      ...prev,
      memoryLeak: !prev.memoryLeak
    }));
  };

  const resetEnvironment = () => {
    setConfig({
      networkLatency: 0,
      databaseStatus: 'online',
      cpuLoad: 20,
      rps: 10,
      memoryUsage: 25,
      memoryLeak: false,
      sessionExpired: false,
      sessionTimeout: false
    });
  };

  // Color classes helper
  const getLatencyColor = (val) => {
    if (val === 0) return 'text-emerald-500';
    if (val < 1500) return 'text-amber-400';
    return 'text-rose-400 font-bold';
  };

  const getCpuColor = (val) => {
    if (val < 45) return 'text-emerald-500';
    if (val < 80) return 'text-amber-400';
    return 'text-rose-400 font-bold';
  };

  const getRpsColor = (val) => {
    if (val < 100) return 'text-emerald-500';
    if (val < 150) return 'text-amber-400';
    return 'text-rose-400 font-bold';
  };

  return (
    <div className="glass-panel control-panel">
      <div className="panel-header">
        <h3 className="panel-title-area">
          <Network className="icon-md" style={{ color: '#10b981' }} />
          Environment Chaos Panel
        </h3>
        <button
          onClick={resetEnvironment}
          className="panel-reset-btn"
          title="Reset Environment to Healthy"
        >
          <RefreshCw className="icon-xs" />
        </button>
      </div>

      {/* Latency Control */}
      <div className="control-group">
        <div className="control-label-row">
          <span className="control-label-text">
            <Network className="icon-sm" />
            Network Latency
          </span>
          <span className={getLatencyColor(config.networkLatency)}>
            {config.networkLatency} ms
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="5000"
          step="100"
          value={config.networkLatency}
          onChange={handleLatencyChange}
          className="slider-input"
        />
        <div className="slider-scale">
          <span>0ms (Direct)</span>
          <span>2.5s (Laggy)</span>
          <span>5s (Critical)</span>
        </div>
      </div>

      {/* DB Switch */}
      <div className="db-toggle-card">
        <div className="db-card-left">
          <div className={`db-status-icon-box ${
            config.databaseStatus === 'online' ? 'online glow-emerald' : 'offline glow-red'
          }`}>
            <Database className="icon-sm" />
          </div>
          <div>
            <div className="db-status-title">PostgreSQL DB State</div>
            <div className="db-status-subtitle">
              {config.databaseStatus === 'online' ? 'Database online & healthy' : 'Database connection pool error'}
            </div>
          </div>
        </div>

        <button
          onClick={toggleDatabase}
          className={`switch-outer ${config.databaseStatus === 'online' ? 'checked' : 'unchecked'}`}
        >
          <span className="switch-inner" />
        </button>
      </div>

      {/* RPS Control */}
      <div className="control-group">
        <div className="control-label-row">
          <span className="control-label-text">
            <Activity className="icon-sm" />
            API Request Rate (RPS)
          </span>
          <span className={getRpsColor(config.rps || 10)}>
            {config.rps || 10} RPS
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="200"
          value={config.rps || 10}
          onChange={handleRpsChange}
          className="slider-input"
        />
        <div className="slider-scale">
          <span>Normal (1 RPS)</span>
          <span>Warning (100 RPS)</span>
          <span>DoS Flooding (200 RPS)</span>
        </div>
      </div>

      {/* Memory Leak Switch */}
      <div className="db-toggle-card">
        <div className="db-card-left">
          <div className={`db-status-icon-box ${
            config.memoryLeak ? 'offline glow-red' : 'online glow-emerald'
          }`}>
            <Cpu className="icon-sm" />
          </div>
          <div>
            <div className="db-status-title">Memory Leak Simulation</div>
            <div className="db-status-subtitle">
              {config.memoryLeak ? 'Active (Heap leak is growing)' : 'Inactive (GC cleans heap memory)'}
            </div>
          </div>
        </div>

        <button
          onClick={toggleMemoryLeak}
          className={`switch-outer ${config.memoryLeak ? 'checked' : 'unchecked'}`}
        >
          <span className="switch-inner" />
        </button>
      </div>

      {/* Session Expired Switch */}
      <div className="db-toggle-card">
        <div className="db-card-left">
          <div className={`db-status-icon-box ${
            config.sessionExpired ? 'offline glow-red' : 'online glow-emerald'
          }`}>
            <Network className="icon-sm" />
          </div>
          <div>
            <div className="db-status-title">Session Expired State</div>
            <div className="db-status-subtitle">
              {config.sessionExpired ? 'Session expired (HTTP 401)' : 'Session valid & authenticated'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setConfig(prev => ({ ...prev, sessionExpired: !prev.sessionExpired }))}
          className={`switch-outer ${config.sessionExpired ? 'checked' : 'unchecked'}`}
        >
          <span className="switch-inner" />
        </button>
      </div>

      {/* CPU Control */}
      <div className="control-group">
        <div className="control-label-row">
          <span className="control-label-text">
            <Cpu className="icon-sm" />
            CPU Host Load
          </span>
          <span className={getCpuColor(config.cpuLoad)}>
            {config.cpuLoad}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={config.cpuLoad}
          onChange={handleCpuChange}
          className="slider-input"
        />
        <div className="slider-scale">
          <span>Idle (0%)</span>
          <span>Load (50%)</span>
          <span>Throttled (100%)</span>
        </div>
      </div>

      {/* Generate QA Audit Report Button */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
        <button
          onClick={generateQAAuditReport}
          className="generate-report-btn"
        >
          📥 Generate QA Audit Report
        </button>
      </div>
    </div>
  );
}
