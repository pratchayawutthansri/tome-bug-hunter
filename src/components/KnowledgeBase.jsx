import React, { useState } from 'react';
import { BookOpen, Shield, Code, Settings, Search } from 'lucide-react';
import { vulnerabilityPresets } from '../data/vulnDatabase';

export default function KnowledgeBase({ docScenarioId, setDocScenarioId }) {
  // Tabs: 'overview' | 'exploit' | 'code' | 'mitigation'
  const [docTab, setDocTab] = useState('overview');

  const activePreset = vulnerabilityPresets[docScenarioId] || vulnerabilityPresets.sqli;

  // Extract sections from theory text
  const getDescription = () => {
    if (!activePreset.theory) return '';
    return activePreset.theory
      .split('### How the Exploit Works:')[0]
      .replace('### What is ', '')
      .replace('?', '');
  };

  const getExploitFlow = () => {
    if (!activePreset.theory) return 'No exploit vectors documented.';
    if (activePreset.theory.includes('### How the Exploit Works:')) {
      return activePreset.theory
        .split('### How the Exploit Works:')[1]
        .split('### Mitigation Strategies:')[0]
        .trim();
    }
    return 'No exploit vectors documented.';
  };

  const getMitigation = () => {
    if (!activePreset.theory) return 'Parameterization, sanitization, and output escaping are required.';
    return (
      activePreset.theory.split('### Mitigation Strategies:')[1] ||
      'Parameterization, sanitization, and output escaping are required.'
    ).trim();
  };

  return (
    <div className="docs-layout">
      {/* Docs Sidebar Nav */}
      <div className="docs-sidebar">
        <h3 className="team-section-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen className="icon-sm" style={{ color: '#10b981' }} />
          Vulnerability Index
        </h3>
        {Object.values(vulnerabilityPresets).map((preset) => {
          const isCritical = preset.severity === 'critical';
          const isHighOrMedium = preset.severity === 'high' || preset.severity === 'medium';
          
          return (
            <button
              key={preset.id}
              onClick={() => setDocScenarioId(preset.id)}
              className={`docs-nav-card ${docScenarioId === preset.id ? 'active' : 'inactive'}`}
            >
              <div className="docs-nav-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`dot ${isCritical ? 'dot-rose' : 'dot-amber'}`} />
                  {preset.name.split(' (')[0]}
                </span>
                <span className={`kb-severity-badge ${preset.severity}`}>
                  {preset.severity.toUpperCase()}
                </span>
              </div>
              <span className="docs-nav-endpoint">
                Target: /api/v1/{preset.endpoint}
              </span>
            </button>
          );
        })}
      </div>

      {/* Docs Content Detail Container */}
      <div className="docs-content-area">
        {/* Header */}
        <div className="docs-content-header-container" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="text-xl font-bold text-white">
              {activePreset.name}
            </h2>
            <span className="text-xs text-slate-400 font-mono" style={{ marginTop: '4px', display: 'block' }}>
              Category ID: {activePreset.id.toUpperCase()} • /api/v1/{activePreset.endpoint}
            </span>
          </div>
          <span className={`docs-category-badge ${activePreset.id === 'resilience' ? 'category-rel' : 'category-sec'}`}>
            {activePreset.id === 'resilience' ? 'Reliability Vulnerability' : 'Security Vulnerability'}
          </span>
        </div>

        {/* Tab Selection Navigation Bar */}
        <div className="docs-tab-bar">
          <button
            onClick={() => setDocTab('overview')}
            className={`docs-tab-btn ${docTab === 'overview' ? 'active' : ''}`}
          >
            <Shield className="icon-xs" /> Overview
          </button>
          <button
            onClick={() => setDocTab('exploit')}
            className={`docs-tab-btn ${docTab === 'exploit' ? 'active' : ''}`}
          >
            <Search className="icon-xs" /> Exploit Flow
          </button>
          <button
            onClick={() => setDocTab('code')}
            className={`docs-tab-btn ${docTab === 'code' ? 'active' : ''}`}
          >
            <Code className="icon-xs" /> Code Comparison
          </button>
          <button
            onClick={() => setDocTab('mitigation')}
            className={`docs-tab-btn ${docTab === 'mitigation' ? 'active' : ''}`}
          >
            <Settings className="icon-xs" /> Mitigation Summary
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="docs-tab-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {docTab === 'overview' && (
            <div className="docs-prose-container">
              <div>
                <h4 className="docs-section-title">
                  <Shield className="icon-sm" />
                  Description & Vulnerability Mechanics
                </h4>
                <p className="docs-text-block" style={{ whiteSpace: 'pre-wrap' }}>
                  {getDescription()}
                </p>
              </div>
            </div>
          )}

          {docTab === 'exploit' && (
            <div className="docs-prose-container">
              <div>
                <h4 className="docs-section-title danger-title">
                  <Shield className="icon-sm" />
                  Exploit Execution Flow
                </h4>
                <pre className="docs-text-block font-mono" style={{ fontSize: '11.5px', whiteSpace: 'pre-wrap', overflowX: 'auto', borderLeft: '3px solid var(--danger)' }}>
                  {getExploitFlow()}
                </pre>
              </div>
            </div>
          )}

          {docTab === 'code' && (
            <div className="docs-prose-container" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h4 className="docs-section-title">
                <Code className="icon-sm" />
                Code Comparisons (Vulnerable vs Secure)
              </h4>
              <div className="docs-code-compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', flex: 1 }}>
                <div>
                  <div className="code-compare-title">
                    <span className="dot dot-rose" style={{ marginRight: '6px' }} /> Vulnerable Implementation
                  </div>
                  <pre className="compare-pre vulnerable-pre">
                    {activePreset.vulnerableCode}
                  </pre>
                </div>
                <div>
                  <div className="code-compare-title">
                    <span className="dot dot-green" style={{ marginRight: '6px' }} /> Secure Implementation (Remediation)
                  </div>
                  <pre className="compare-pre secure-pre">
                    {activePreset.secureCode}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {docTab === 'mitigation' && (
            <div className="docs-prose-container">
              <div>
                <h4 className="docs-section-title info-title">
                  <Settings className="icon-sm" />
                  Mitigation Summary
                </h4>
                <pre className="docs-text-block" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 'inherit', borderLeft: '3px solid var(--info)' }}>
                  {getMitigation()}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
