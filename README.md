# Tome Bug Hunter & Environment Simulator (TBH-ES) v2.4 🛡️⚡

**Tome Bug Hunter & Environment Simulator (TBH-ES) v2.4** is a state-of-the-art, fully client-side educational sandbox and utility tool designed to bridge the gap between static application security testing (SAST), runtime infrastructure resilience (Chaos Engineering), and Test-Driven Development (TDD) validation. Built as a high-fidelity Single Page Application (SPA) using React, Vite, and custom Vanilla CSS, it enables developers to analyze source code vulnerabilities, trigger simulated infrastructure failure states, write and execute unit tests, and observe system health in real-time.

With version 2.4, the system introduces a **Full-Width Code Workspace Toggle** to hide the environment panel for focused coding, layout scrolling fixes that resolve nested scrolling deadlocks, custom local file uploading, interactive SAST engine alignment, and an automated QA Audit Report generator.

---

## 🚀 Key Features

### 1. Real-Time SAST Engine
*   **Static Application Security Testing:** Scans the active code in the editor using advanced regex patterns to locate potential exploits and bugs before compilation or execution.
*   **Expanded Ruleset:**
    *   **SQL Injection (SQLi):** Catches raw string interpolations/concatenations inside database queries.
    *   **Cross-Site Scripting (XSS):** Flags dangerous DOM injections (`.innerHTML`, `dangerouslySetInnerHTML`).
    *   **Hardcoded Secret Validation:** Checks for passwords, tokens, API keys, and private credentials.
    *   **Broken Object Level Authorization (IDOR/BOLA):** Scans database requests for direct ID references (`req.params.id` / `req.query.id`) missing matching owner/session token validation clauses.
    *   **Price / Financial Boundary Manipulation:** Detects arithmetic computations involving prices, amounts, or quantities that lack lower-boundary checks (e.g. processing negatives).
    *   **Server-Side Request Forgery (SSRF):** Identifies fetch/axios commands taking user-supplied parameters without domain whitelist filters.
    *   **Insecure Deserialization:** Discovers dangerous usage of `serialize.unserialize()`.
    *   **Resilience Warnings:** Flags missing try-catch block handlers or empty catch statements.

### 2. Client-Side Custom File Upload Scanning
*   **Drag-and-Drop / Browse Interface:** Includes a dashed-border dropzone on top of the code editor. Supports dragging or browsing files with extensions: `.js`, `.jsx`, `.ts`, `.tsx`, `.py`.
*   **FileReader Parsing:** Uses the browser's HTML5 `FileReader` API (`readAsText`) to load and parse code completely client-side. The SAST engine instantly analyzes user-submitted files without transmitting code to external servers.
*   **Clear & Reset Actions:** Provides a quick button to unload custom files and return the sandbox to preset scenario templates.

### 3. Upgraded Infrastructure Chaos Controller
Simulates real-world backend and network degradation dynamically using responsive controls:
*   **Network Latency Control (0 - 5000ms):** Delays simulated request-response cycles to test application timeouts and UX behavior.
*   **CPU Host Load Slider (0 - 100%):** Throttles the application thread pool, introducing execution delays once utilization exceeds 60%.
*   **PostgreSQL Status Switch:** Toggles database connection pool states. If the code is resilient, it triggers stale caching fallbacks; if not, it throws an unhandled promise rejection and crashes the process.
*   **API Request Rate Slider (1 - 200 RPS):** Controls traffic volume. High rates (>100 RPS) trigger high-load warnings. High traffic rates above 100 RPS automatically trip an **HTTP 429 Too Many Requests** throttle, simulating rate limiting protection.
*   **Memory Leak Simulator Toggle:** Simulates visual heap allocation. Running vulnerable code blocks accumulates memory usage by 25% on each execution, culminating in an Out of Memory (OOM) process crash at 100%. Secure code blocks trigger visual garbage collection, reducing memory usage by 25% down to a healthy 25% baseline.

### 4. Dynamic System Architecture Map
*   Visualizes live communication paths: `Client Browser ➔ API Gateway ➔ App Node.js ➔ Redis Cache / PostgreSQL DB`.
*   **Real-time Animations:**
    *   *High Latency:* Slices flow speeds and highlights gateway borders in Amber/Rose.
    *   *Database Outages:* Severs the DB connection line with a flashing warning alarm overlay.
    *   *High Request Rate (RPS):* Controls flow speeds and particle frequencies, turning flow lines to dashed patterns (packet loss representation) above 150 RPS.
    *   *Dynamic Node States:* App Node changes color based on CPU load and features a dynamic RAM heap progress bar reflecting current memory accumulation.

### 5. Interactive Vulnerability Index (Knowledge Base)
Includes side-by-side comparisons of **Vulnerable vs. Secure** implementations for seven preset developer challenges:
1.  **SQL Injection (SQLi) Login Form**
2.  **Unprotected DOM-XSS Comment Box**
3.  **Race Condition (Double-Spend Withdrawal)**
4.  **DB Connection Resilience & Failures**
5.  **Broken Object Level Authorization (IDOR/BOLA)**
6.  **Server-Side Request Forgery (SSRF)**
7.  **Insecure Deserialization (Object Injection)**

*   **Top Tab Navigation Bar:** Sleek glassmorphic tab selector allowing users to instantly switch views between:
    1.  **Overview:** General description & vulnerability mechanics.
    2.  **Exploit Flow:** Code-block layout detailing how exploit vectors operate.
    3.  **Code Comparison:** Side-by-side comparative views of vulnerable and secure code blocks.
    4.  **Mitigation Summary:** Outlined parameterization, sanitization, and architectural mitigations.
*   **Sidebar Severity Badges:** Displays color-coded risk levels next to presets in the sidebar (e.g., `[CRITICAL]` in red, `[HIGH]` or `[MEDIUM]` in orange/yellow).

### 6. Interactive SAST Editor Linkage & Scroll UX (v2.4 Layout & Scroll Fixes)
*   **Full Width Code View Toggle:** Users can click the **🗖 Full Width Code** button inside the editor tab bar to expand the code editor to cover the entire screen width, hiding the chaos simulator environment panel for a cleaner, wider workspace. Clicking it again instantly restores the split-screen layout.
*   **Elimination of Nested Scroll Locks:** The editor panel has been completely refactored from a nested scroll layout into a modern viewport-fitted flexbox container. The main editor column does not scroll anymore; instead, the code textarea and the SAST warnings section scroll independently, ensuring smooth page navigation and removing scroll hijacks.
*   **Auto-Scroll & Line Highlighting:** Clicking any Static Code Analysis (SAST) finding card at the bottom of the editor automatically scrolls the textarea viewport smoothly to focus on the target code line.
*   **Text Selection Range:** Focuses the editor textarea and selects the exact code text of the vulnerable line using HTML5 `setSelectionRange()`.
*   **Line Number Flashing:** Temporarily flashes the corresponding line number inside the gutter with a glowing emerald background animation (`@keyframes flash-line-highlight`) for 1.5 seconds.
*   **Editor Panel Auto-Scroll:** Triggers a smooth `scrollIntoView` on the editor workspace if the parent scroll container is scrolled away, keeping focus centered.

### 7. TDD Testing & QA Sandbox
*   **Source vs. Test View Tabs:** Allows developers to inspect the source code template side-by-side with its Jest-like unit test suite.
*   **Jest TDD Assertion Runner:** Executes simulated unit tests. If SAST rules discover security warnings in the active code editor, the runner fails, writing a structured red stack traceback showing test cases and expected vs received metrics to the simulator terminal. Otherwise, it logs all clean passing checkmarks.
*   **Random Mutation Fuzzing:** The "Inject Fuzzing Data" button selects a random mutation payload tailored to the scenario, logging a `[FUZZ]` payload injection alert to the terminal and testing it against the active environment rules.

### 8. Automated QA Audit Reporting
*   **Live Report Generator:** Generates a downloadable markdown report summarizing the current security compliance state of the code and mock environment parameters (CPU loads, active vulnerabilities, database connection stability, network latency, TDD execution statuses).

---

## 🛡️ Technology Stack

*   **Framework:** React 19 (Functional Components, Hooks)
*   **Build Tool:** Vite 8 (Hot Module Replacement)
*   **Styling:** Modern Vanilla CSS (CSS Custom Properties, Glassmorphism, CSS Animations, Independent Scrolling Columns, Flexbox Layouts)
*   **Icon Library:** Lucide React
*   **Application State:** Single unified react state flowing unidirectional from Controls ➔ Architecture SVG & Logs Console

---

## 📁 Repository Directory Structure

```text
d:\tome\
├── index.html            # Main entry template with Google Fonts (Outfit, JetBrains Mono)
├── package.json          # Dependency scripts and metadata
├── vite.config.js        # Vite bundling and React plugin configuration
└── src/
    ├── main.jsx          # Mounts the React application
    ├── App.jsx           # Main coordinator (tab routing, main state, simulation triggers)
    ├── App.css           # Purged for full integration in index.css
    ├── index.css         # Styling stylesheet (Custom CSS design variables, glass design, keyframes)
    ├── components/
    │   ├── Sidebar.jsx       # Left nav bar & credits containing easter-egg team configurations
    │   ├── CodeEditor.jsx    # Textarea container, line numbering, SAST scan notifications
    │   ├── ControlPanel.jsx  # Control interface (Network delay, DB toggle, CPU slider)
    │   ├── Architecture.jsx  # Interactive SVG representation of system communication flow
    │   ├── Console.jsx       # Simulated command line terminal printing raw logs
    │   └── KnowledgeBase.jsx # Modularized tabs & sidebar directory for security rulesets
    ├── scanner/
    │   └── sastEngine.js     # Code parser using regex patterns for vulnerability scanning
    ├── simulator/
    │   └── chaosEngine.js    # Async simulation executor implementing mock timeouts and catch failures
    └── data/
        └── vulnDatabase.js   # Preloaded code patterns and documentation markdown database
```

---

## 👥 Project Team Credits

*   **Senior Manager (Product Lead):** Designed the workflow integration requirements, ensuring runtime resilience matches static analysis targets.
*   **Senior Software Developer (Tech Lead):** Engineered the SAST Regex Parser, main state logic, and CSS styling layouts.
*   **Senior Software Engineer (Architecture):** Created the dynamic SVG nodes and set up the active flow-line animation keyframes.
*   **Full Stack Developer (Integration):** Configured Vite bundling, structured presets databases, and connected terminal logging pipes.
*   **QA Engineer (Validation):** Tested ruleset thresholds and verified retry/fallback logic under simulated PostgreSQL database outages.
