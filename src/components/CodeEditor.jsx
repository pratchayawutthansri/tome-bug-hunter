import React, { useState, useEffect, useRef } from 'react';
import { Play, ShieldAlert, CheckCircle, Shield, AlertTriangle, Upload, Search } from 'lucide-react';
import { vulnerabilityPresets } from '../data/vulnDatabase';
import { scanCode } from '../scanner/sastEngine';

export default function CodeEditor({ 
  currentScenario, 
  setCurrentScenario, 
  code, 
  setCode, 
  findings, 
  setFindings, 
  onRunSimulation,
  isSimulating,
  editorTab,
  setEditorTab,
  testCode,
  setTestCode,
  onRunTDDTests,
  onInjectFuzz,
  uploadedFile,
  onFileUpload,
  onFileClear,
  isFullEditor,
  setIsFullEditor
}) {
  const [codeType, setCodeType] = useState('vulnerable'); // 'vulnerable' | 'secure'
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const scrollLineIntoView = (lineNum) => {
    if (!textareaRef.current) return;
    
    // Switch to code tab if we are in test tab
    if (editorTab !== 'code') {
      setEditorTab('code');
    }
    
    const activeText = code;
    const lines = activeText.split('\n');
    
    // Calculate character indices for the start and end of target line
    let startPos = 0;
    for (let i = 0; i < lineNum - 1; i++) {
      if (lines[i] !== undefined) {
        startPos += lines[i].length + 1; // +1 for the newline character
      }
    }
    const targetLine = lines[lineNum - 1] || '';
    const endPos = startPos + targetLine.length;
    
    // Set visual line number highlight state
    setHighlightedLine(lineNum);
    
    // Clear flash highlight after 1.5 seconds
    setTimeout(() => {
      setHighlightedLine(null);
    }, 1500);

    // Calculate vertical scroll position using scrollHeight / totalLines
    const totalLines = lines.length;
    if (totalLines > 0) {
      const scrollHeight = textareaRef.current.scrollHeight;
      const clientHeight = textareaRef.current.clientHeight;
      const lineHeight = scrollHeight / totalLines;
      
      // Scroll to position where the target line is centered in the viewport
      const scrollTop = Math.max(0, lineHeight * (lineNum - 1) - clientHeight / 2 + lineHeight / 2);
      
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(startPos, endPos);
      
      textareaRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
      
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }

      // Scroll the editor workspace itself into view if it's off-screen
      textareaRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  };

  // Update code when scenario or toggle changes
  useEffect(() => {
    if (uploadedFile) return;
    const preset = vulnerabilityPresets[currentScenario.id];
    if (preset) {
      setCode(codeType === 'vulnerable' ? preset.vulnerableCode : preset.secureCode);
      setTestCode(preset.unitTests || '');
    }
  }, [currentScenario, codeType, setCode, setTestCode, uploadedFile]);

  // Run real-time SAST scan when code changes on a debounced delay
  useEffect(() => {
    const timer = setTimeout(() => {
      const scanResults = scanCode(code);
      setFindings(scanResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [code, setFindings]);

  const handleScenarioChange = (e) => {
    const id = e.target.value;
    const preset = vulnerabilityPresets[id];
    if (preset) {
      onFileClear();
      setCurrentScenario({ id: preset.id, name: preset.name, endpoint: preset.endpoint });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleZoneClick = () => {
    fileInputRef.current.click();
  };

  const processFile = (file) => {
    if (!file) return;
    const name = file.name;
    const extension = '.' + name.split('.').pop().toLowerCase();
    const allowed = ['.js', '.jsx', '.ts', '.tsx', '.py'];
    if (!allowed.includes(extension)) {
      alert(`Invalid file type. Allowed types: ${allowed.join(', ')}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      onFileUpload(name, file.size, text);
    };
    reader.readAsText(file);
  };

  const handleLineNumbersWheel = (e) => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      const prevScrollTop = el.scrollTop;
      el.scrollTop += e.deltaY;
      
      if (el.scrollTop !== prevScrollTop) {
        e.preventDefault();
      }
    }
  };

  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const getLineNumbers = () => {
    const activeText = editorTab === 'code' ? code : testCode;
    if (!activeText) return null;
    const lines = activeText.split('\n');
    return lines.map((_, i) => {
      const lineNum = i + 1;
      const hasFinding = editorTab === 'code' && findings.some(f => f.line === lineNum);
      const isHighlighted = editorTab === 'code' && lineNum === highlightedLine;
      
      let className = 'line-number-span';
      if (hasFinding) className += ' has-finding';
      if (isHighlighted) className += ' flash-active-line';
      
      return (
        <span key={lineNum} className={className}>
          {lineNum}
        </span>
      );
    });
  };

  return (
    <>
      <div 
        className={`upload-zone ${isDragging ? 'drag-over' : ''} ${uploadedFile ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleZoneClick}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept=".js,.jsx,.ts,.tsx,.py" 
          style={{ display: 'none' }}
        />
        {uploadedFile ? (
          <div className="upload-zone-file-info">
            <div className="upload-filename-wrapper">
              <span className="upload-filename" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                📑 uploaded: <strong>{uploadedFile.name}</strong> ({uploadedFile.size})
              </span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onFileClear(); }} 
              className="upload-clear-btn"
            >
              ✕ Clear/Reset
            </button>
          </div>
        ) : (
          <div className="upload-zone-prompt">
            <Upload className="icon-md text-emerald-500" />
            <span>Drag & drop code file here or <span className="upload-browse-link">browse</span> to upload (.js, .jsx, .ts, .tsx, .py)</span>
          </div>
        )}
      </div>

      <div className="glass-panel editor-panel">
      {/* Selector & Actions Top Header */}
      <div className="editor-header">
        {/* Dropdown presets */}
        <div className="selector-block">
          <label className="selector-label">Select Target Scenario</label>
          <select
            value={currentScenario.id}
            onChange={handleScenarioChange}
            className="glass-input"
            style={{ cursor: 'pointer', padding: '8px 12px', fontSize: '12px' }}
          >
            {Object.values(vulnerabilityPresets).map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {/* Template Select Switch */}
        <div className="template-switch-block">
          <label className="template-switch-label">Code Template State</label>
          <div className="template-switch-group">
            <button
              onClick={() => {
                onFileClear();
                setCodeType('vulnerable');
              }}
              className={`template-switch-btn ${codeType === 'vulnerable' ? 'active-vulnerable' : ''}`}
            >
              Vulnerable Code
            </button>
            <button
              onClick={() => {
                onFileClear();
                setCodeType('secure');
              }}
              className={`template-switch-btn ${codeType === 'secure' ? 'active-secure' : ''}`}
            >
              Secure Fix
            </button>
          </div>
        </div>
      </div>

      {/* Editor Tab Bar */}
      <div className="editor-tab-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setEditorTab('code')}
            className="template-switch-btn"
            style={{
              backgroundColor: editorTab === 'code' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              borderColor: editorTab === 'code' ? 'var(--primary)' : 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid',
              color: editorTab === 'code' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            💻 Source Code
          </button>
          <button
            onClick={() => setEditorTab('tests')}
            className="template-switch-btn"
            style={{
              backgroundColor: editorTab === 'tests' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              borderColor: editorTab === 'tests' ? 'var(--primary)' : 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid',
              color: editorTab === 'tests' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            🧪 Unit Tests
          </button>
        </div>

        <button
          onClick={() => setIsFullEditor(!isFullEditor)}
          className="template-switch-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: isFullEditor ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: isFullEditor ? 'var(--primary)' : 'var(--border-glass)',
            borderWidth: '1px',
            borderStyle: 'solid',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '6px 12px'
          }}
        >
          {isFullEditor ? '🗗 Split View' : '🗖 Full Width Code'}
        </button>
      </div>

      {/* Editor Workspace Body */}
      <div className="editor-workspace">
        {/* Scanner Glowing Lines overlay (only when showing code and findings exist) */}
        {findings.length > 0 && editorTab === 'code' && <div className="scanner-overlay" />}

        {/* Line Numbers Column */}
        <pre 
          ref={lineNumbersRef} 
          className="line-numbers-col"
          onWheel={handleLineNumbersWheel}
        >
          {getLineNumbers()}
        </pre>

        {/* Raw Code Editor Textarea */}
        <textarea
          ref={textareaRef}
          value={editorTab === 'code' ? code : testCode}
          onScroll={handleScroll}
          onChange={(e) => {
            if (editorTab === 'code') {
              setCode(e.target.value);
            } else {
              setTestCode(e.target.value);
            }
          }}
          spellCheck="false"
          className="code-textarea-field"
        />
      </div>

      {/* Trigger Actions Block */}
      <div className="endpoint-action-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <span className="endpoint-label">Endpoint Target:</span>
          <code className="endpoint-code-tag">
            POST /api/v1/{currentScenario.endpoint}
          </code>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onInjectFuzz}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '8px 12px' }}
          >
            💥 Inject Fuzzing Data
          </button>
          
          {editorTab === 'code' ? (
            <button
              onClick={onRunSimulation}
              disabled={isSimulating}
              className={`btn-primary ${isSimulating ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ fontSize: '12px', padding: '8px 12px' }}
            >
              <Play className="icon-sm" style={{ fill: 'currentColor' }} />
              {isSimulating ? 'Simulating...' : 'Run Chaos Simulation'}
            </button>
          ) : (
            <button
              onClick={onRunTDDTests}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '8px 12px', background: 'var(--info)', color: 'white' }}
            >
              <CheckCircle className="icon-sm" />
              Run TDD Tests
            </button>
          )}
        </div>
      </div>

      {/* SAST Warnings Section (only shown when Source Code tab is active) */}
      {editorTab === 'code' && (
        <div className="sast-engine-section">
          <h4 className="sast-title">
            <Shield className="icon-sm" style={{ color: '#10b981' }} />
            Static Code Analysis (SAST Engine)
          </h4>

          {findings.length === 0 ? (
            <div className="sast-healthy-card">
              <CheckCircle className="icon-md" style={{ color: '#10b981' }} />
              <div>
                <div className="sast-card-title">0 Security Vulnerabilities Found</div>
                <div className="sast-card-subtitle">Your code follows current security patterns for parameterization and sanitization.</div>
              </div>
            </div>
          ) : (
            <div className="sast-findings-scroll">
              {findings.map((finding, idx) => (
                <div
                  key={idx}
                  onClick={() => scrollLineIntoView(finding.line)}
                  className={`sast-finding-card clickable ${finding.severity === 'critical' ? 'critical' : 'warning'}`}
                >
                  <div className="finding-card-content-compact">
                    <div className="finding-header-row-compact">
                      <div className="finding-badges-group">
                        {finding.severity === 'critical' ? (
                          <span className="badge-critical">[CRITICAL]</span>
                        ) : (
                          <span className="badge-warning">[WARNING]</span>
                        )}
                        <span className="badge-line">[LINE {finding.line}]</span>
                        <span className="finding-type-compact">{finding.type}</span>
                      </div>
                      <span className="finding-click-indicator">
                        <Search className="icon-xs" />
                      </span>
                    </div>
                    <div className="finding-snippet-box-compact">
                      <span className="finding-snippet-vulnerable">{finding.snippet}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
