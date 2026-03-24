# AGENTS.md

MCP server for Selenium WebDriver browser automation. JavaScript (ES Modules), Node.js, stdio transport (JSON-RPC 2.0).

This repository contains **two independent MCP servers**:

| Server | Runtime | Purpose |
|--------|---------|---------|
| `src/lib/server.js` | Node.js | Original JS Selenium MCP server (18 tools) |
| `src/GUIDO.Mcp.Engine/` | .NET 8 / C# | GUIDO Agentic Execution Engine (4 structured tools) |

---

## JS Server — File Map

```text
src/lib/server.js                ← ALL server logic: tool definitions, state, helpers, cleanup
src/lib/accessibility-snapshot.js ← Browser-side JS injected via executeScript to build accessibility tree
bin/mcp-selenium.js              ← CLI entry point, spawns server.js as child process
test/mcp-client.mjs              ← Reusable MCP test client (JSON-RPC over stdio)
test/*.test.mjs                  ← Tests grouped by feature
test/fixtures/*.html             ← HTML files loaded via file:// URLs in tests
```

## JS Server — Architecture

Server logic lives in `server.js`, with browser-injected scripts in separate files. 18 tools, 2 resources.

State is a module-level object:
```js
const state = {
    drivers: new Map(),    // sessionId → WebDriver instance
    currentSession: null,  // active session ID
    bidi: new Map()        // sessionId → { available, consoleLogs, pageErrors, networkLogs }
};
```

Related operations are consolidated into single tools with `action` enum parameters (`interact`, `window`, `frame`, `alert`, `diagnostics`). This is intentional — it reduces context window token cost for LLM consumers.

BiDi (WebDriver BiDi) is auto-enabled on `start_browser` for passive capture of console logs, JS errors, and network activity. Modules are dynamically imported — if unavailable, BiDi is silently skipped.

## JS Server — Conventions

- **ES Modules** — `import`/`export`, not `require`.
- **Zod schemas** — tool inputs defined with Zod, auto-converted to JSON Schema by MCP SDK.
- **Error pattern** — every handler: `try/catch`, return `{ content: [...], isError: true }` on failure.
- **No `console.log()`** — stdio transport. Use `console.error()` for debug output.
- **`send_keys` clears first** — calls `element.clear()` before typing. Intentional.
- **MCP compliance** — before modifying server behavior, read the [MCP spec](https://modelcontextprotocol.io/specification/2025-11-25). Don't violate it.

## JS Server — Adding a Tool

Before adding, ask: can this be a parameter on an existing tool? Would an LLM realistically call it? Can `execute_script` already do it?

Pattern:
```js
server.tool("tool_name", "description", {
    param: z.string().describe("short phrase")
}, async ({ param }) => {
    try {
        const driver = getDriver();
        // ... selenium work ...
        return { content: [{ type: 'text', text: 'result' }] };
    } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
    }
});
```

After adding: add tests, run `npm test`, update README.

## JS Server — Testing

```bash
npm test
```

Requires Chrome + chromedriver on PATH. Tests run headless. Uses Node's built-in `node:test` runner — no external test dependencies.

Tests talk to the real MCP server over stdio. No mocking. Each test file uses **one McpClient** (one server process) for the whole file — do not spin up multiple clients per file.

**Verify outcomes, not absence of errors.** If you click a button, check that the thing it did actually happened. If a test is failing, fix the code — never weaken the assertion.

| File | Covers |
|------|--------|
| `server.test.mjs` | Tool registration, schemas |
| `browser.test.mjs` | start_browser, close_session, take_screenshot, multi-session |
| `navigation.test.mjs` | navigate, locator strategies (id, css, xpath, name, tag, class) |
| `interactions.test.mjs` | interact, send_keys, get_element_text, press_key, upload_file |
| `tools.test.mjs` | get_element_attribute, execute_script, window, frame, alert |
| `cookies.test.mjs` | add_cookie, get_cookies, delete_cookie |
| `bidi.test.mjs` | diagnostics (console/errors/network), session isolation |
| `resources.test.mjs` | accessibility-snapshot resource (tree structure, filtering, no-session error) |

---

## GUIDO Engine — Architecture

```text
src/GUIDO.Mcp.Engine/
├── Commands/               ← MCP tool handlers (thin delegates)
│   ├── ScanDomCommand.cs
│   ├── ExecuteStepCommand.cs
│   ├── HealSelectorCommand.cs
│   └── TraceCommand.cs
├── Domain/                 ← Core domain types (no external deps)
│   ├── DomMap.cs           ← DOM scan result
│   ├── DomElement.cs       ← Element + ranked SelectorCandidates
│   ├── ExecutionStep.cs    ← Intent-based step (action + selector + intent)
│   ├── ExecutionResult.cs  ← Step outcome
│   ├── HealingResult.cs    ← Healing proposals
│   └── ExecutionTrace.cs   ← SPECTRA-TRACE entry
├── Infrastructure/         ← Selenium driver management
│   ├── SessionManager.cs
│   ├── DriverFactory.cs
│   └── LocatorResolver.cs
├── Services/               ← Core logic
│   ├── IGuidoMcpEngine.cs  ← Core interface
│   ├── GuidoMcpEngine.cs   ← Primary implementation
│   ├── DomScanService.cs
│   ├── SelectorStabilityService.cs
│   └── SelfHealingService.cs
├── Tracing/                ← SPECTRA-TRACE observability
│   ├── ExecutionTraceService.cs
│   ├── TraceEntry.cs
│   └── SpectraTraceWriter.cs
├── Program.cs              ← MCP server entry point (stdio)
└── GUIDO.Mcp.Engine.csproj
```

## GUIDO Engine — Tools

| Tool | Description |
|------|-------------|
| `scan_dom` | Navigate to URL; return DOM map with ranked selector candidates |
| `execute_step` | Execute one intent-based step (click/type/assert/navigate/etc.) |
| `heal_selector` | Propose alternatives for a broken selector (controlled, not silent) |
| `emit_trace` | Push an orchestrator-level event into GUIDO-TRACE.md |

## GUIDO Engine — Design Principles

- **No orchestration** — executes instructions; never sequences them autonomously
- **No business logic** — does not know what "login" means; the orchestrator does
- **Intent-based steps** — every `ExecutionStep` carries human-readable `intent` alongside the technical `action`
- **Controlled healing** — proposes alternatives; the orchestrator decides; no silent selector substitution
- **SPECTRA-TRACE hooks** — every operation emits a typed `ExecutionTrace` appended to `GUIDO-TRACE.md`
- **Stability ranking** — selectors ranked id=100 > data-testid=90 > aria-label=80 > name=70 > css=60 > xpath=40

## GUIDO Engine — Setup

```bash
# 1. Generate all C# project files (first-time only)
npm run guido:setup

# 2. Build and run
cd src/GUIDO.Mcp.Engine
dotnet restore
dotnet build
dotnet run
```

## GUIDO Engine — MCP Client Config

```json
{
  "mcpServers": {
    "selenium-js": {
      "command": "node",
      "args": ["bin/mcp-selenium.js"]
    },
    "guido-engine": {
      "command": "dotnet",
      "args": ["run", "--project", "src/GUIDO.Mcp.Engine"]
    }
  }
}
```

