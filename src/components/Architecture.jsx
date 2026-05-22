import React from 'react';
import { Database, AlertTriangle, Wifi, Globe, HardDrive } from 'lucide-react';

export default function Architecture({ config }) {
  const { networkLatency, databaseStatus, cpuLoad, rps = 10, memoryUsage = 25, sessionExpired, sessionTimeout } = config;

  const isSessionTripped = sessionExpired || sessionTimeout;
  const isRateTripped = rps > 100;
  const isTripped = isSessionTripped || isRateTripped;

  // Determine flow speed and color based on latency
  const getLatencyFlowClass = () => {
    if (networkLatency === 0) return 'animate-flow-fast';
    if (networkLatency < 1500) return 'animate-flow-medium';
    return 'animate-flow-slow';
  };

  const getLatencyStrokeColor = () => {
    if (networkLatency === 0) return '#10b981'; // Emerald
    if (networkLatency < 1500) return '#f59e0b'; // Amber
    return '#f43f5e'; // Rose
  };

  const getGatewayStrokeColor = () => {
    if (rps > 150) return '#f43f5e'; // Rose (Critical DoS)
    if (rps > 100) return '#f59e0b'; // Amber (High Load Warning)
    return getLatencyStrokeColor();
  };

  const getAccountingStrokeColor = () => {
    if (isSessionTripped) return '#f43f5e'; // Rose/Red (Unauthorized)
    if (isRateTripped) return '#f59e0b'; // Amber (Rate limited)
    return '#10b981'; // Emerald (Healthy)
  };

  // Node Positions (Center-focused Layout)
  const nodes = {
    client: { x: 60, y: 150, name: 'Client Browser' },
    gateway: { x: 200, y: 150, name: 'API Gateway' },
    server: { x: 340, y: 150, name: 'Backend Node.js' },
    cache: { x: 480, y: 80, name: 'Redis Cache' },
    db: { x: 480, y: 200, name: 'PostgreSQL DB' },
    accounting: { x: 480, y: 280, name: 'Accounting Node' }
  };

  return (
    <div className="glass-panel architecture-panel" style={{ height: '410px' }}>
      <div className="arch-header">
        <h3 className="arch-header-title">
          <Globe className="icon-md" style={{ color: '#10b981' }} />
          System Infrastructure Map
        </h3>
        <div className="arch-legend">
          <span className="legend-item"><span className="legend-dot dot-green" /> Healthy</span>
          <span className="legend-item"><span className="legend-dot dot-amber" /> Lagging/Warn</span>
          <span className="legend-item"><span className="legend-dot dot-rose" /> Failure/DoS</span>
        </div>
      </div>

      <div className="arch-canvas-container">
        <svg className="w-full h-full" style={{ maxWidth: '560px', maxHeight: '330px' }} viewBox="0 0 560 330">
          <defs>
            {/* Glow Filter for Active Elements */}
            <filter id="glow-emerald-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-rose-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-amber-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Links (Paths) */}
          {/* Client -> Gateway */}
          <path
            d={`M ${nodes.client.x} ${nodes.client.y} L ${nodes.gateway.x} ${nodes.gateway.y}`}
            stroke={getGatewayStrokeColor()}
            strokeWidth="3"
            fill="none"
            strokeDasharray={rps > 150 ? '4, 4' : 'none'}
            className={rps > 100 ? 'animate-flow-fast' : getLatencyFlowClass()}
            style={{ filter: `drop-shadow(0 0 2px ${getGatewayStrokeColor()})` }}
          />

          {/* Gateway -> Server */}
          <path
            d={`M ${nodes.gateway.x} ${nodes.gateway.y} L ${nodes.server.x} ${nodes.server.y}`}
            stroke={cpuLoad > 75 || memoryUsage > 80 ? '#f59e0b' : '#10b981'}
            strokeWidth="3"
            fill="none"
            className={cpuLoad > 75 || memoryUsage > 80 ? 'animate-flow-slow' : 'animate-flow-fast'}
            style={{ filter: `drop-shadow(0 0 2px ${cpuLoad > 75 || memoryUsage > 80 ? '#f59e0b' : '#10b981'})` }}
          />

          {/* Server -> Cache */}
          <path
            d={`M ${nodes.server.x} ${nodes.server.y} Q 400 100, ${nodes.cache.x} ${nodes.cache.y}`}
            stroke={databaseStatus === 'offline' ? '#f59e0b' : '#10b981'}
            strokeWidth="2.5"
            fill="none"
            className="animate-flow-fast"
            style={{ filter: `drop-shadow(0 0 2px ${databaseStatus === 'offline' ? '#f59e0b' : '#10b981'})` }}
          />

          {/* Server -> PostgreSQL */}
          <path
            d={`M ${nodes.server.x} ${nodes.server.y} Q 400 180, ${nodes.db.x} ${nodes.db.y}`}
            stroke={databaseStatus === 'online' ? '#10b981' : '#f43f5e'}
            strokeWidth="2.5"
            fill="none"
            strokeDasharray={databaseStatus === 'online' ? 'none' : '6, 6'}
            className={databaseStatus === 'online' ? 'animate-flow-fast' : ''}
            style={{
              filter: `drop-shadow(0 0 2px ${databaseStatus === 'online' ? '#10b981' : '#f43f5e'})`,
              animation: databaseStatus === 'offline' ? 'none' : undefined
            }}
          />

          {/* Server -> Accounting Node */}
          <path
            d={`M ${nodes.server.x} ${nodes.server.y} Q 400 240, ${nodes.accounting.x} ${nodes.accounting.y}`}
            stroke={getAccountingStrokeColor()}
            strokeWidth="2.5"
            fill="none"
            strokeDasharray={isTripped ? '6, 6' : 'none'}
            className={isTripped ? '' : 'animate-flow-fast'}
            style={{
              filter: `drop-shadow(0 0 2px ${getAccountingStrokeColor()})`,
              animation: isTripped ? 'none' : undefined
            }}
          />

          {/* Nodes */}
          {/* 1. Client Browser Node */}
          <g transform={`translate(${nodes.client.x}, ${nodes.client.y})`}>
            <circle r="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
            <Globe className="text-slate-400" x="-10" y="-10" width="20" height="20" />
            <text y="38" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">Client (Web)</text>
          </g>

          {/* 2. API Gateway Node */}
          <g transform={`translate(${nodes.gateway.x}, ${nodes.gateway.y})`}>
            <circle
              r="24"
              fill="#1e293b"
              stroke={getGatewayStrokeColor()}
              strokeWidth="2"
              style={{
                filter: rps > 150 || networkLatency > 3000
                  ? 'url(#glow-rose-filter)'
                  : rps > 100 || networkLatency > 0
                  ? 'url(#glow-amber-filter)'
                  : undefined
              }}
            />
            <Wifi
              className={
                rps > 150 || networkLatency > 3000
                  ? 'text-rose-400'
                  : rps > 100 || networkLatency > 0
                  ? 'text-amber-400'
                  : 'text-emerald-500'
              }
              x="-10"
              y="-10"
              width="20"
              height="20"
            />
            <text y="38" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">API Gateway</text>
            <text y="-32" textAnchor="middle" fill={rps > 150 ? '#f43f5e' : rps > 100 ? '#f59e0b' : '#94a3b8'} fontSize="8" fontWeight="bold">
              Rate: {rps} RPS
            </text>
          </g>

          {/* 3. Backend Server Node */}
          <g transform={`translate(${nodes.server.x}, ${nodes.server.y})`}>
            <circle
              r="26"
              fill="#1e293b"
              stroke={memoryUsage >= 100 || cpuLoad > 80 ? '#f43f5e' : cpuLoad > 50 || memoryUsage > 75 ? '#f59e0b' : '#10b981'}
              strokeWidth="2"
              style={{ filter: cpuLoad > 80 || memoryUsage > 80 ? 'url(#glow-rose-filter)' : undefined }}
            />
            <HardDrive
              className={memoryUsage >= 100 || cpuLoad > 80 ? 'text-rose-400' : cpuLoad > 50 || memoryUsage > 75 ? 'text-amber-400' : 'text-emerald-500'}
              x="-12"
              y="-12"
              width="24"
              height="24"
            />
            <text y="40" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">App Node.js</text>
            
            {/* CPU Label */}
            <text y="-34" textAnchor="middle" fill={cpuLoad > 80 ? '#f43f5e' : '#94a3b8'} fontSize="8" fontWeight="bold">
              CPU: {cpuLoad}%
            </text>

            {/* Dynamic RAM Heap Bar */}
            <g transform="translate(-20, 48)">
              <rect width="40" height="4" rx="2" fill="#334155" />
              <rect
                width={40 * (memoryUsage / 100)}
                height="4"
                rx="2"
                fill={memoryUsage > 80 ? '#f43f5e' : memoryUsage > 50 ? '#f59e0b' : '#10b981'}
              />
            </g>
            <text y="62" textAnchor="middle" fill={memoryUsage > 80 ? '#f43f5e' : '#94a3b8'} fontSize="8" fontWeight="bold">
              RAM: {memoryUsage}%
            </text>
          </g>

          {/* 4. Redis Cache Node */}
          <g transform={`translate(${nodes.cache.x}, ${nodes.cache.y})`}>
            <circle r="22" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
            <HardDrive className="text-emerald-500" x="-10" y="-10" width="20" height="20" />
            <text y="38" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">Redis Cache</text>
          </g>

          {/* 5. PostgreSQL DB Node */}
          <g transform={`translate(${nodes.db.x}, ${nodes.db.y})`}>
            <circle
              r="24"
              fill="#1e293b"
              stroke={databaseStatus === 'online' ? '#10b981' : '#f43f5e'}
              strokeWidth="2.5"
              className={databaseStatus === 'offline' ? 'glow-red' : ''}
              style={{ filter: databaseStatus === 'offline' ? 'url(#glow-rose-filter)' : 'url(#glow-emerald-filter)' }}
            />
            <Database className={databaseStatus === 'online' ? 'text-emerald-500' : 'text-rose-400'} x="-10" y="-10" width="20" height="20" />
            <text y="38" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">PostgreSQL</text>
            
            {/* Alert Icon Overlay if Offline */}
            {databaseStatus === 'offline' && (
              <g transform="translate(14, -14)">
                <circle r="8" fill="#f43f5e" />
                <AlertTriangle className="text-white" x="-7" y="-7" width="14" height="14" />
              </g>
            )}
          </g>

          {/* 6. Accounting Node */}
          <g transform={`translate(${nodes.accounting.x}, ${nodes.accounting.y})`}>
            <circle
              r="22"
              fill="#1e293b"
              stroke={getAccountingStrokeColor()}
              strokeWidth="2.5"
              style={{
                filter: isSessionTripped
                  ? 'url(#glow-rose-filter)'
                  : isRateTripped
                  ? 'url(#glow-amber-filter)'
                  : 'url(#glow-emerald-filter)'
              }}
            />
            <Database className={isSessionTripped ? 'text-rose-400' : isRateTripped ? 'text-amber-400' : 'text-emerald-500'} x="-10" y="-10" width="20" height="20" />
            <text y="38" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">Accounting Node</text>

            {/* Alert Icon Overlay if Tripped */}
            {isTripped && (
              <g transform="translate(14, -14)">
                <circle r="8" fill={isSessionTripped ? '#f43f5e' : '#f59e0b'} />
                <AlertTriangle className="text-white" x="-7" y="-7" width="14" height="14" />
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}
