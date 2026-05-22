/**
 * SAST (Static Application Security Testing) Scanning Engine
 * Parses source code using regex patterns to identify common security flaws and resilience issues.
 */

export const scanCode = (codeText) => {
  const findings = [];
  if (!codeText) return findings;

  const lines = codeText.split('\n');

  // Rule definitions
  const rules = {
    sqli: {
      id: 'SEC-SQLI',
      type: 'SQL Injection',
      severity: 'critical',
      explanation: 'Detected direct concatenation or string interpolation in a database query. This allows an attacker to manipulate the query structure and bypass authentication, read unauthorized data, or destroy database records.',
      fix: 'Use parameterized queries / prepared statements (e.g., db.query("SELECT * FROM users WHERE id = ?", [userId])).',
      // Matches: SELECT ... + variable, or SELECT ... ${variable}
      patterns: [
        /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\+\s*\w+/i,
        /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*`.*\$\{.*\}/i,
        /db\.query\(\s*['"`]SELECT\s+.*WHERE\s+.*=\s*['"`]\s*\+\s*\w+/i,
        /db\.query\(\s*`SELECT\s+.*WHERE\s+.*=\s*\$\{.*\}`\s*\)/i
      ]
    },
    xss: {
      id: 'SEC-XSS',
      type: 'Cross-Site Scripting (XSS)',
      severity: 'critical',
      explanation: 'Detected unsafe DOM manipulation using innerHTML or dangerouslySetInnerHTML. If user input flows into these properties without sanitization, an attacker can inject malicious HTML/JS scripts that execute in user browsers.',
      fix: 'Use textContent, safe React elements, or pass input through a trusted sanitization library like DOMPurify.',
      patterns: [
        /\.innerHTML\s*=/i,
        /dangerouslySetInnerHTML\s*:/i,
        /document\.write\s*\(/i
      ]
    },
    secrets: {
      id: 'SEC-SECRET',
      type: 'Hardcoded Secret / API Key',
      severity: 'critical',
      explanation: 'A private credential, AWS token, ERP API endpoint key, or production database password appears to be hardcoded in the source files. If leaked, it could result in full enterprise system compromise.',
      fix: 'Store secrets in environment variables (e.g., process.env.AWS_ACCESS_KEY_ID) and load them at runtime.',
      patterns: [
        /(api_key|apikey|secret|private_key|token|auth_token|password|passwd|db_password)\s*[:=]\s*['"`][a-zA-Z0-9_\-\.\/=+]{16,}['"`]/i,
        /(?:AKIA|ASIA)[0-9A-Z]{16}/,
        /aws_secret_access_key\s*[:=]\s*['"`][a-zA-Z0-9_\-\.\/=+]{32,}['"`]/i,
        /(erp_api|erp_token|erp_key|erp_endpoint)\s*[:=]\s*['"`][a-zA-Z0-9_\-\.\/=+]{8,}['"`]/i,
        /(db_password|database_url|prod_db|db_conn)\s*[:=]\s*['"`][a-zA-Z0-9_\-\.\/=+]{8,}['"`]/i
      ]
    },
    idor: {
      id: 'SEC-IDOR',
      type: 'Insecure Direct Object Reference (IDOR/BOLA)',
      severity: 'critical',
      explanation: 'Detected database retrieval using user-controlled parameters (like orderId or req.params.id) directly without verifying if the authenticated user owns or is authorized to view the resource.',
      fix: 'Always check resource ownership by adding ownership checks to the query (e.g., SELECT * FROM orders WHERE id = $1 AND user_id = $2).',
      patterns: [
        /SELECT\s+.*\s+FROM\s+orders\s+WHERE\s+id\s*=\s*\$1\s*(?!.*\bAND\s+user_id\b)/i,
        /db\.query\(.*req\.params\.\w+/i,
        /db\.(query|execute|find|findOne)\(.*\breq\.params\.(id|orderId|userId|accountId)\b/i,
        /SELECT.*WHERE.*=\s*.*\+.*req\.params\.\w+/i,
        /SELECT.*WHERE.*=\s*\$\{req\.params\.\w+\}/i
      ]
    },
    priceManipulation: {
      id: 'SEC-PRICE-MANIPULATION',
      type: 'Unsafe Price/Financial Manipulation',
      severity: 'critical',
      explanation: 'Detected ingestion or processing of numerical body inputs (price, amount, quantity) without absolute mathematical validation (Math.abs) or boundary checking (e.g. value < 0). This allows attackers to input negative or extreme values to manipulate transaction calculations.',
      fix: 'Validate boundary conditions for financial inputs (e.g. amount <= 0) and enforce absolute positive ranges (Math.abs(amount)).',
      patterns: [
        /req\.(body|query)\.(price|amount|quantity)(?!\s*<\s*0|\s*>\s*0|Math\.abs|Math\.max)/i,
        /const\s*\{\s*[^}]*(price|amount|quantity)[^}]*\}\s*=\s*req\.(body|query)/i
      ]
    },
    ssrf: {
      id: 'SEC-SSRF',
      type: 'Server-Side Request Forgery (SSRF)',
      severity: 'critical',
      explanation: 'Detected fetching of user-supplied URL directly without validation or domain whitelist filters. An attacker can supply internal URLs (like http://localhost:8080/admin or http://169.254.169.254/) to scan network ports and access local resources.',
      fix: 'Enforce a strict whitelist of allowed domains, parse the URL using standard libraries, and reject requests mapping to internal or loopback IP ranges.',
      patterns: [
        /axios\.get\(\s*imageUrl\s*\)/i,
        /fetch\(\s*imageUrl\s*\)/i
      ]
    },
    deserialization: {
      id: 'SEC-DESERIALIZATION',
      type: 'Insecure Deserialization',
      severity: 'critical',
      explanation: 'Detected unsafe deserialization of raw input data using serialize.unserialize(). This can lead to arbitrary code execution if an attacker crafts a serialized object containing payload functions that execute during deserialization.',
      fix: 'Avoid native object serialization. Use standard, safe formats like JSON.parse() and validate schemas using libraries like Zod or Joi.',
      patterns: [
        /serialize\.unserialize\s*\(/i
      ]
    },
    emptyCatch: {
      id: 'RES-EMPTY-CATCH',
      type: 'Empty Catch Block',
      severity: 'warning',
      explanation: 'Detected an empty catch block. Swallowing exceptions without logging or handling them makes diagnosing production issues nearly impossible and can lead to silent data corruption.',
      fix: 'At minimum, log the exception (console.error(err)) or propagate/handle it appropriately.',
      patterns: [
        /catch\s*\(\w*\)\s*\{\s*\}/i,
        /catch\s*\{\s*\}/i
      ]
    }
  };

  // 1. Line-by-line checks
  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;

    // Check each rule
    for (const [key, rule] of Object.entries(rules)) {
      for (const pattern of rule.patterns) {
        if (pattern.test(lineText)) {
          // Avoid duplicate findings on the same line for the same rule
          const alreadyFound = findings.some(f => f.line === lineNum && f.type === rule.type);
          if (!alreadyFound) {
            findings.push({
              line: lineNum,
              id: rule.id,
              type: rule.type,
              severity: rule.severity,
              explanation: rule.explanation,
              fix: rule.fix,
              snippet: lineText.trim()
            });
          }
          break; // Move to next rule once matched
        }
      }
    }
  });

  // 2. Multiline check for missing catch blocks
  // Look for try block without catch (though parser-wise JS requires catch/finally, they might span multiple lines)
  // We can look for instances where a "try {" occurs, and see if we can find a matching catch block.
  // A simple heuristic check for JS text:
  let braceCount = 0;
  let inTry = false;
  let tryStartLine = -1;
  let hasCatchOrFinally = false;

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    
    // Check if line contains 'try {'
    if (/\btry\s*\{/.test(lineText)) {
      inTry = true;
      tryStartLine = lineNum;
      braceCount = 0;
    }

    if (inTry) {
      // Simple bracket counting
      const openBraces = (lineText.match(/\{/g) || []).length;
      const closeBraces = (lineText.match(/\}/g) || []).length;
      braceCount += openBraces - closeBraces;

      if (braceCount === 0 && idx > tryStartLine - 1) {
        // try block has ended. Let's see if the next few non-empty lines contain 'catch' or 'finally'
        inTry = false;
        let lookAheadIdx = idx + 1;
        let foundHandler = false;
        
        while (lookAheadIdx < lines.length && lookAheadIdx < idx + 5) {
          const aheadLine = lines[lookAheadIdx].trim();
          if (aheadLine.length > 0) {
            if (/\b(catch|finally)\b/.test(aheadLine)) {
              foundHandler = true;
            }
            break;
          }
          lookAheadIdx++;
        }

        if (!foundHandler) {
          findings.push({
            line: tryStartLine,
            id: 'RES-MISSING-HANDLER',
            type: 'Try Block Missing Catch/Finally',
            severity: 'warning',
            explanation: 'Detected a try block that does not appear to be followed immediately by a catch or finally block, which could lead to syntax errors or unhandled system crashes.',
            fix: 'Append a catch(error) or finally block directly after the closing brace of the try block.',
            snippet: lines[tryStartLine - 1].trim()
          });
        }
      }
    }
  });

  return findings.sort((a, b) => a.line - b.line);
};
