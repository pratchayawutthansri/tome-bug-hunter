import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ControlPanel from './components/ControlPanel';
import Architecture from './components/Architecture';
import Console from './components/Console';
import CodeEditor from './components/CodeEditor';
import KnowledgeBase from './components/KnowledgeBase';
import { runSimulation } from './simulator/chaosEngine';
import { vulnerabilityPresets } from './data/vulnDatabase';
import { scanCode } from './scanner/sastEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFullEditor, setIsFullEditor] = useState(false);
  
  // Environment Configurations (Chaos Parameters)
  const [config, setConfig] = useState({
    networkLatency: 0,
    databaseStatus: 'online',
    cpuLoad: 20,
    rps: 10,
    memoryUsage: 25,
    memoryLeak: false,
    sessionExpired: false,
    sessionTimeout: false
  });

  // Editor and Scenario States
  const [currentScenario, setCurrentScenario] = useState({
    id: 'sqli',
    name: 'SQL Injection (SQLi) Login Form',
    endpoint: 'auth/login'
  });
  
  const [code, setCode] = useState('');
  const [findings, setFindings] = useState([]);
  const [editorTab, setEditorTab] = useState('code');
  const [testCode, setTestCode] = useState('');
  
  // Terminal logs state
  const [logs, setLogs] = useState([
    { text: `[${new Date().toTimeString().split(' ')[0]}] [SYS] Tome Bug Hunter & Environment Simulator initialized.`, type: 'sys' },
    { text: `[${new Date().toTimeString().split(' ')[0]}] [SYS] All scanning modules loaded successfully. Ready for code input.`, type: 'sys' }
  ]);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [docScenarioId, setDocScenarioId] = useState('sqli');
  const [uploadedFile, setUploadedFile] = useState(null);

  const addLog = (text, type = 'info') => {
    setLogs((prev) => [...prev, { text, type }]);
  };

  const handleFileUpload = (name, size, content) => {
    const sizeKB = (size / 1024).toFixed(1);
    setUploadedFile({ name, size: `${sizeKB} KB` });
    setCode(content);

    const time1 = new Date().toTimeString().split(' ')[0];
    addLog(`[${time1}] [SYS] Custom file detected: '${name}' (Size: ${sizeKB} KB) loaded into Client Sandbox.`, 'sys');

    setTimeout(() => {
      const time2 = new Date().toTimeString().split(' ')[0];
      addLog(`[${time2}] [SAST] Scanning codebase against OWASP Top 10 vulnerability patterns...`, 'sys');

      setTimeout(() => {
        const findingsList = scanCode(content);
        const time3 = new Date().toTimeString().split(' ')[0];
        addLog(`[${time3}] [SAST] Found ${findingsList.length} security alerts. Review the static analysis report below.`, findingsList.length > 0 ? 'warn' : 'sys');
      }, 300);
    }, 200);
  };

  const handleFileClear = () => {
    if (!uploadedFile) return;
    const timestamp = new Date().toTimeString().split(' ')[0];
    addLog(`[${timestamp}] [SYS] Custom file unloaded. Restoring scenario defaults.`, 'sys');
    setUploadedFile(null);
  };

  const handleRunSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    try {
      const scenarioOverride = uploadedFile 
        ? { ...currentScenario, id: 'custom', name: `Custom Code (${uploadedFile.name})`, isCustom: true }
        : currentScenario;
      
      const result = await runSimulation(scenarioOverride, code, config, addLog);
      
      if (result.metrics && typeof result.metrics.memoryUsage === 'number') {
        setConfig((prev) => ({ ...prev, memoryUsage: result.metrics.memoryUsage }));
      }
      
      const t = new Date().toTimeString().split(' ')[0];
      if (result.status === 'exploited') {
        addLog(`[${t}] [EXPLOIT_ALERT] Vulnerability exploited successfully! System compromised.`, 'err');
      } else if (result.status === 'crashed') {
        addLog(`[${t}] [CRASH] Environment crashed. Process exited.`, 'err');
      } else if (result.status === 'rate_limited') {
        addLog(`[${t}] [429] [RATE_LIMIT] Too Many Requests. API Gateway rate limit exceeded.`, 'warn');
      } else if (result.status === 'unauthorized') {
        addLog(`[${t}] [ERR] [401] Unauthorized. Session has expired or token is invalid.`, 'err');
      } else if (result.status === 'warning') {
        addLog(`[${t}] [WARN] Query execution recovered through fallbacks. System degraded but functional.`, 'warn');
      } else {
        addLog(`[${t}] [SECURE] Query executed cleanly. Defense mechanisms validated.`, 'info');
      }
    } catch (err) {
      addLog(`[ERROR] Simulation runner execution failed: ${err.message}`, 'err');
    } finally {
      setIsSimulating(false);
    }
  };

  const onRunTDDTests = async () => {
    const t = new Date().toTimeString().split(' ')[0];
    addLog(`[${t}] [SYS] Running Jest Unit Test Suite for: ${currentScenario.name}...`, 'sys');
    await new Promise(r => setTimeout(r, 600));
    
    const currentTimestamp = () => new Date().toTimeString().split(' ')[0];
    const hasVuln = findings.length > 0;
    
    if (uploadedFile) {
      // 3-step Jest-style runner outputting status blocks for Input Validation, Exception Handling, and Secrets Audit
      const hasInputVuln = findings.some(f => ['SEC-SQLI', 'SEC-XSS', 'SEC-PRICE-MANIPULATION', 'SEC-IDOR', 'SEC-SSRF'].includes(f.id));
      const hasExceptionVuln = findings.some(f => ['RES-EMPTY-CATCH', 'RES-MISSING-HANDLER'].includes(f.id));
      const hasSecretsVuln = findings.some(f => f.id === 'SEC-SECRET');

      let failed = 0;
      let passed = 0;

      // 1. Input Validation
      if (hasInputVuln) {
        failed++;
        addLog(`[${currentTimestamp()}] [ERR] FAIL  Input Validation › should validate input parameters and reject malicious inputs`, 'err');
        findings.filter(f => ['SEC-SQLI', 'SEC-XSS', 'SEC-PRICE-MANIPULATION', 'SEC-IDOR', 'SEC-SSRF'].includes(f.id)).forEach(f => {
          addLog(`[${currentTimestamp()}] [ERR]   ● Input Validation › ${f.type} check failed on line ${f.line}`, 'err');
          addLog(`[${currentTimestamp()}] [ERR]     Snippet: ${f.snippet}`, 'err');
        });
      } else {
        passed++;
        addLog(`[${currentTimestamp()}] [INFO] PASS  Input Validation › should validate input parameters and reject malicious inputs`, 'info');
      }

      // 2. Exception Handling
      if (hasExceptionVuln) {
        failed++;
        addLog(`[${currentTimestamp()}] [ERR] FAIL  Exception Handling › should catch and handle exceptions safely without swallowing them`, 'err');
        findings.filter(f => ['RES-EMPTY-CATCH', 'RES-MISSING-HANDLER'].includes(f.id)).forEach(f => {
          addLog(`[${currentTimestamp()}] [ERR]   ● Exception Handling › ${f.type} check failed on line ${f.line}`, 'err');
          addLog(`[${currentTimestamp()}] [ERR]     Snippet: ${f.snippet}`, 'err');
        });
      } else {
        passed++;
        addLog(`[${currentTimestamp()}] [INFO] PASS  Exception Handling › should catch and handle exceptions safely without swallowing them`, 'info');
      }

      // 3. Secrets Audit
      if (hasSecretsVuln) {
        failed++;
        addLog(`[${currentTimestamp()}] [ERR] FAIL  Secrets Audit › should not contain hardcoded sensitive credentials or private keys`, 'err');
        findings.filter(f => f.id === 'SEC-SECRET').forEach(f => {
          addLog(`[${currentTimestamp()}] [ERR]   ● Secrets Audit › ${f.type} check failed on line ${f.line}`, 'err');
          addLog(`[${currentTimestamp()}] [ERR]     Snippet: ${f.snippet}`, 'err');
        });
      } else {
        passed++;
        addLog(`[${currentTimestamp()}] [INFO] PASS  Secrets Audit › should not contain hardcoded sensitive credentials or private keys`, 'info');
      }

      const total = passed + failed;
      if (failed > 0) {
        addLog(`[${currentTimestamp()}] [ERR] Tests:       ${failed} failed, ${passed} passed, ${total} total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Snapshots:   0 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Time:        0.85s`, 'err');
      } else {
        addLog(`[${currentTimestamp()}] [INFO] Tests:       ${passed} passed, ${total} total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Snapshots:   0 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Time:        0.72s`, 'info');
      }
    } else if (currentScenario.id === 'sqli') {
      addLog(`[${currentTimestamp()}] [INFO] PASS  describe('POST /api/v1/auth/login') -> should authenticate user with valid credentials`, 'info');
      if (hasVuln) {
        addLog(`[${currentTimestamp()}] [ERR] FAIL  describe('POST /api/v1/auth/login') -> should reject SQL Injection input in username field`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]   ● POST /api/v1/auth/login › should reject SQL Injection input in username field`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     expect(received).toBe(expected) // Object.is equality`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Expected: 401`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Received: 200`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]       at Object.<anonymous> (auth.test.js:14:21)`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Tests:       1 failed, 1 passed, 2 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Snapshots:   0 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Time:        0.84s, estimated 1s`, 'err');
      } else {
        addLog(`[${currentTimestamp()}] [INFO] PASS  describe('POST /api/v1/auth/login') -> should reject SQL Injection input in username field`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Tests:       2 passed, 2 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Snapshots:   0 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Time:        0.72s`, 'info');
      }
    } else if (currentScenario.id === 'xss') {
      addLog(`[${currentTimestamp()}] [INFO] PASS  describe('CommentWidget Component') -> should render standard plain text comments safely`, 'info');
      if (hasVuln) {
        addLog(`[${currentTimestamp()}] [ERR] FAIL  describe('CommentWidget Component') -> should sanitize script tags in comments to prevent script execution`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]   ● CommentWidget Component › should sanitize script tags in comments to prevent script execution`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     expect(received).toBeNull()`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Expected: null`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Received: <script>tag</script>`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]       at Object.<anonymous> (xss.test.js:15:24)`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Tests:       1 failed, 1 passed, 2 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Snapshots:   0 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Time:        0.78s, estimated 1s`, 'err');
      } else {
        addLog(`[${currentTimestamp()}] [INFO] PASS  describe('CommentWidget Component') -> should sanitize script tags in comments to prevent script execution`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Tests:       2 passed, 2 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Snapshots:   0 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Time:        0.65s`, 'info');
      }
    } else if (currentScenario.id === 'race') {
      addLog(`[${currentTimestamp()}] [INFO] PASS  describe('POST /api/v1/account/withdraw') -> should allow a single withdrawal if balance is sufficient`, 'info');
      if (hasVuln) {
        addLog(`[${currentTimestamp()}] [ERR] FAIL  describe('POST /api/v1/account/withdraw') -> should prevent double-spending under concurrent requests`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]   ● POST /api/v1/account/withdraw › should prevent double-spending under concurrent requests`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     expect(received).toBe(expected) // Object.is equality`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Expected: 1`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Received: 2`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]       at Object.<anonymous> (race.test.js:18:32)`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Tests:       1 failed, 1 passed, 2 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Snapshots:   0 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Time:        0.95s, estimated 1s`, 'err');
      } else {
        addLog(`[${currentTimestamp()}] [INFO] PASS  describe('POST /api/v1/account/withdraw') -> should prevent double-spending under concurrent requests`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Tests:       2 passed, 2 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Snapshots:   0 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Time:        0.81s`, 'info');
      }
    } else if (currentScenario.id === 'resilience') {
      addLog(`[${currentTimestamp()}] [INFO] PASS  describe('GET /api/v1/items/list') -> should fetch item lists when PostgreSQL is online`, 'info');
      if (hasVuln) {
        addLog(`[${currentTimestamp()}] [ERR] FAIL  describe('GET /api/v1/items/list') -> should fall back to Redis cache if PostgreSQL connection fails`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]   ● GET /api/v1/items/list › should fall back to Redis cache if PostgreSQL connection fails`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     expect(received).toBe(expected) // Object.is equality`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Expected: 200`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Received: 500`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]       at Object.<anonymous> (resilience.test.js:16:21)`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Tests:       1 failed, 1 passed, 2 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Snapshots:   0 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Time:        0.89s, estimated 1s`, 'err');
      } else {
        addLog(`[${currentTimestamp()}] [INFO] PASS  describe('GET /api/v1/items/list') -> should fall back to Redis cache if PostgreSQL connection fails`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Tests:       2 passed, 2 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Snapshots:   0 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Time:        0.75s`, 'info');
      }
    } else if (currentScenario.id === 'idor') {
      addLog(`[${currentTimestamp()}] [INFO] PASS  describe('GET /api/v1/orders/:id') -> should fetch order details for the owner of the order`, 'info');
      if (hasVuln) {
        addLog(`[${currentTimestamp()}] [ERR] FAIL  describe('GET /api/v1/orders/:id') -> should block requests to fetch orders owned by other users`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]   ● GET /api/v1/orders/:id › should block requests to fetch orders owned by other users`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     expect(received).toBe(expected) // Object.is equality`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Expected: 404`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Received: 200`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]       at Object.<anonymous> (idor.test.js:15:21)`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Tests:       1 failed, 1 passed, 2 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Snapshots:   0 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Time:        0.79s, estimated 1s`, 'err');
      } else {
        addLog(`[${currentTimestamp()}] [INFO] PASS  describe('GET /api/v1/orders/:id') -> should block requests to fetch orders owned by other users`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Tests:       2 passed, 2 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Snapshots:   0 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Time:        0.66s`, 'info');
      }
    } else if (currentScenario.id === 'ssrf') {
      addLog(`[${currentTimestamp()}] [INFO] PASS  describe('POST /api/v1/posts/proxy') -> should proxy requests to allowed domains`, 'info');
      if (hasVuln) {
        addLog(`[${currentTimestamp()}] [ERR] FAIL  describe('POST /api/v1/posts/proxy') -> should block requests to internal loopback / localhost addresses`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]   ● POST /api/v1/posts/proxy › should block requests to internal loopback / localhost addresses`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     expect(received).toBe(expected) // Object.is equality`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Expected: 400`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Received: 200`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]       at Object.<anonymous> (ssrf.test.js:14:21)`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Tests:       1 failed, 1 passed, 2 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Snapshots:   0 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Time:        0.82s, estimated 1s`, 'err');
      } else {
        addLog(`[${currentTimestamp()}] [INFO] PASS  describe('POST /api/v1/posts/proxy') -> should block requests to internal loopback / localhost addresses`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Tests:       2 passed, 2 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Snapshots:   0 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Time:        0.69s`, 'info');
      }
    } else if (currentScenario.id === 'deserialization') {
      addLog(`[${currentTimestamp()}] [INFO] PASS  describe('GET /api/v1/auth/session') -> should authenticate user with normal session cookies`, 'info');
      if (hasVuln) {
        addLog(`[${currentTimestamp()}] [ERR] FAIL  describe('GET /api/v1/auth/session') -> should ignore serialized function callbacks in session cookies`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]   ● GET /api/v1/auth/session › should ignore serialized function callbacks in session cookies`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     expect(received).toBeUndefined()`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Expected: undefined`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]     Received: 123`, 'err');
        addLog(`[${currentTimestamp()}] [ERR]       at Object.<anonymous> (deserialization.test.js:15:26)`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Tests:       1 failed, 1 passed, 2 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Snapshots:   0 total`, 'err');
        addLog(`[${currentTimestamp()}] [ERR] Time:        0.86s, estimated 1s`, 'err');
      } else {
        addLog(`[${currentTimestamp()}] [INFO] PASS  describe('GET /api/v1/auth/session') -> should ignore serialized function callbacks in session cookies`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Tests:       2 passed, 2 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Snapshots:   0 total`, 'info');
        addLog(`[${currentTimestamp()}] [INFO] Time:        0.71s`, 'info');
      }
    } else {
      addLog(`[${currentTimestamp()}] [INFO] PASS  describe('General Scenario Tests') -> should execute clean run`, 'info');
      addLog(`[${currentTimestamp()}] [INFO] Tests:       1 passed, 1 total`, 'info');
      addLog(`[${currentTimestamp()}] [INFO] Time:        0.12s`, 'info');
    }
  };

  const generateQAAuditReport = () => {
    const t = new Date().toLocaleString();
    
    const targetName = uploadedFile 
      ? `Custom Uploaded File: ${uploadedFile.name} (${uploadedFile.size})` 
      : `${currentScenario.name} (/api/v1/${currentScenario.endpoint})`;
    
    const logEntries = logs.slice(-10).map(l => `- [${l.type.toUpperCase()}] ${l.text}`).join('\n');
    
    let findingsSection = '';
    if (findings.length === 0) {
      findingsSection = '*No static analysis (SAST) vulnerabilities detected.*';
    } else {
      findingsSection = `| Line | ID | Vulnerability Type | Severity | Snippet |\n| :--- | :--- | :--- | :--- | :--- |\n` +
        findings.map(f => `| ${f.line} | ${f.id} | ${f.type} | ${f.severity.toUpperCase()} | \`${f.snippet}\` |`).join('\n');
    }
    
    let remediationSection = '';
    if (findings.length === 0) {
      remediationSection = 'No remediation required. The codebase follows secure programming patterns.';
    } else {
      remediationSection = findings.map((f, i) => `### ${i + 1}. [${f.id}] ${f.type} (Line ${f.line})\n- **Severity**: ${f.severity.toUpperCase()}\n- **Vulnerable Code**: \`${f.snippet}\`\n- **Engineering Remediation**: ${f.fix}`).join('\n\n');
    }
    
    const markdownContent = `# Tome Bug Hunter & Environment Simulator (TBH-ES)
# QA Security & Chaos Audit Report

**Report Generated**: ${t}

---

## 1. System Environment & Runtime Statistics
- **Target Code / Source**: ${targetName}
- **Database Status**: PostgreSQL Connection Pool is **${config.databaseStatus.toUpperCase()}**
- **Simulated Network Latency**: ${config.networkLatency} ms
- **Simulated Host CPU Load**: ${config.cpuLoad}%
- **API Request Rate (RPS)**: ${config.rps || 10} RPS
- **Simulated Memory Heap**: ${config.memoryUsage}%
- **Memory Leak Emulation**: ${config.memoryLeak ? 'ACTIVE' : 'INACTIVE'}
- **Session Expiration State**: ${config.sessionExpired ? 'EXPIRED (HTTP 401)' : 'VALID'}

---

## 2. Target Source Code
\`\`\`javascript
${code}
\`\`\`

---

## 3. Static Application Security Testing (SAST) Findings
${findingsSection}

---

## 4. Engineering Remediation Steps
${remediationSection}

---

## 5. Live Simulator Terminal Output (Last 10 Events)
\`\`\`text
${logEntries}
\`\`\`
`;
    
    // Trigger file download
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'qa-audit-report.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addLog(`[${new Date().toTimeString().split(' ')[0]}] [SYS] QA Audit Report generated and downloaded as 'qa-audit-report.md'.`, 'sys');
  };

  const onInjectFuzz = async () => {
    if (isSimulating) return;
    
    const fuzzPayloads = {
      sqli: [
        "admin' OR '1'='1",
        "admin' --",
        "UNION SELECT username, password FROM users --",
        "'; DROP TABLE users; --",
        "' OR 1=1 --",
        "admin' AND 1=1 --"
      ],
      xss: [
        "<script>alert(1)</script>",
        "<img src=x onerror=alert('xss')>",
        "<svg/onload=alert(1)>",
        "javascript:alert(1)",
        "<body onload=alert('xss')>",
        "<iframe src=\"javascript:alert(1)\">"
      ],
      race: [
        "concurrent-withdraw-request",
        "race-condition-exploit",
        "double-spend-payload",
        "withdraw-limit-bypass"
      ],
      resilience: [
        "simulate-db-offline",
        "force-db-timeout",
        "network-latency-spike",
        "db-pool-exhaustion"
      ],
      idor: [
        "orderId_0001",
        "orderId_9999",
        "orderId_admin",
        "../orders/1002",
        "orderId_9981"
      ],
      ssrf: [
        "http://127.0.0.1:8080/admin",
        "http://169.254.169.254/latest/meta-data/",
        "http://localhost:22",
        "http://internal.db.local/backup.sql",
        "http://localhost:8080/admin"
      ],
      deserialization: [
        '{"username":"admin"}',
        '{"rce":"_$$ND_FUNC$$_function(){ return 123; }()"}',
        '{"rce":"_$$ND_FUNC$$_function(){ require(\\"child_process\\").exec(\\"whoami\\"); }()"}',
        '{"rce":"_$$ND_FUNC$$_function(){ console.log(\\"Hacked!\\") }()"}',
        '{"username":"admin","role":"superuser"}'
      ],
      generic: [
        "untrusted-input-data",
        "undefined-object-injection",
        "invalid-type-fuzz",
        "overflow_boundary_value_test_string_extremely_long_999999999999999999999999999999999999",
        "null_byte_fuzz\u0000",
        "特殊字符_#_$_%_^_&_*_(_)_fuzz"
      ]
    };
    
    let activeFuzzCategory = currentScenario.id;
    if (uploadedFile) {
      if (/select|query|where|db\.|sql/i.test(code)) {
        activeFuzzCategory = 'sqli';
      } else if (/html|innerhtml|script|dangerouslyset|svg|onload|document\.write/i.test(code)) {
        activeFuzzCategory = 'xss';
      } else if (/withdraw|balance|transaction|lock|race|concurrent/i.test(code)) {
        activeFuzzCategory = 'race';
      } else if (/url|http|fetch|axios|request/i.test(code)) {
        activeFuzzCategory = 'ssrf';
      } else if (/serialize|unserialize|cookie|eval/i.test(code)) {
        activeFuzzCategory = 'deserialization';
      } else {
        activeFuzzCategory = 'generic';
      }
    }

    const list = fuzzPayloads[activeFuzzCategory] || ["fuzz-payload"];
    const randomPayload = list[Math.floor(Math.random() * list.length)];
    
    const t = new Date().toTimeString().split(' ')[0];
    addLog(`[${t}] [FUZZ] Injecting randomized mutation payload: "${randomPayload}"`, 'warn');
    
    setIsSimulating(true);
    try {
      const scenarioOverride = {
        ...currentScenario,
        id: uploadedFile ? 'custom' : currentScenario.id,
        name: uploadedFile ? `Custom Code (${uploadedFile.name})` : currentScenario.name,
        isCustom: uploadedFile ? true : undefined,
        payload: randomPayload
      };
      
      const result = await runSimulation(scenarioOverride, code, config, addLog);
      
      if (result.metrics && typeof result.metrics.memoryUsage === 'number') {
        setConfig((prev) => ({ ...prev, memoryUsage: result.metrics.memoryUsage }));
      }
      
      const ts = new Date().toTimeString().split(' ')[0];
      if (result.status === 'exploited') {
        addLog(`[${ts}] [EXPLOIT_ALERT] Vulnerability exploited successfully! System compromised.`, 'err');
      } else if (result.status === 'crashed') {
        addLog(`[${ts}] [CRASH] Environment crashed. Process exited.`, 'err');
      } else if (result.status === 'warning') {
        addLog(`[${ts}] [WARN] Query execution recovered through fallbacks. System degraded but functional.`, 'warn');
      } else {
        addLog(`[${ts}] [SECURE] Query executed cleanly. Defense mechanisms validated.`, 'info');
      }
    } catch (err) {
      addLog(`[ERROR] Simulation runner execution failed: ${err.message}`, 'err');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Frame */}
      <main className="workspace">
        {/* Top bar header */}
        <header className="workspace-header">
          <div className="header-title-area">
            <h2 className="text-md font-bold text-white tracking-wide">
              {activeTab === 'dashboard' ? 'Simulator Environment' : 'Vulnerability Knowledge Base'}
            </h2>
            <div style={{ height: '16px', width: '1px', backgroundColor: '#334155' }} />
            <span className="header-badge">
              VITE + REACT ACTIVE
            </span>
          </div>
          <div className="header-status-area">
            <span>Env State:</span>
            <div className="status-indicator">
              <span className={`dot ${config.databaseStatus === 'online' ? 'dot-green' : 'dot-rose'}`} />
              <span>DB {config.databaseStatus.toUpperCase()}</span>
            </div>
            <div className="status-indicator">
              <span className={`dot ${config.networkLatency > 2000 ? 'dot-rose' : config.networkLatency > 0 ? 'dot-amber' : 'dot-green'}`} />
              <span>Net: {config.networkLatency}ms</span>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Workspace Content */}
        <div className="workspace-body">
          {activeTab === 'dashboard' ? (
            /* Simulator / Dashboard Grid Layout */
            <div className={`dashboard-layout ${isFullEditor ? 'full-editor-view' : ''}`}>
              {/* Left Column: Code Editor & SAST scan details (3/5 grid width) */}
              <div className="editor-column">
                <CodeEditor
                  currentScenario={currentScenario}
                  setCurrentScenario={setCurrentScenario}
                  code={code}
                  setCode={setCode}
                  findings={findings}
                  setFindings={setFindings}
                  onRunSimulation={handleRunSimulation}
                  isSimulating={isSimulating}
                  editorTab={editorTab}
                  setEditorTab={setEditorTab}
                  testCode={testCode}
                  setTestCode={setTestCode}
                  onRunTDDTests={onRunTDDTests}
                  onInjectFuzz={onInjectFuzz}
                  uploadedFile={uploadedFile}
                  onFileUpload={handleFileUpload}
                  onFileClear={handleFileClear}
                  isFullEditor={isFullEditor}
                  setIsFullEditor={setIsFullEditor}
                />
              </div>

              {/* Right Column: Infrastructure Map, Dials, & Terminal Output (2/5 grid width) */}
              {!isFullEditor && (
                <div className="simulation-column">
                  <ControlPanel config={config} setConfig={setConfig} generateQAAuditReport={generateQAAuditReport} />
                  <Architecture config={config} />
                  <Console logs={logs} setLogs={setLogs} />
                </div>
              )}
            </div>
          ) : (
            /* Docs / Knowledge Base Tab Layout */
            <KnowledgeBase docScenarioId={docScenarioId} setDocScenarioId={setDocScenarioId} />
          )}
        </div>
      </main>
    </div>
  );
}
