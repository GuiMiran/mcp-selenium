#!/usr/bin/env node
/**
 * GUIDO MCP Engine Bootstrap Script
 * Creates the full C# .NET project structure under src/GUIDO.Mcp.Engine/
 * Run with: node guido-engine-bootstrap.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE = path.join(__dirname, 'src', 'GUIDO.Mcp.Engine');

const FILES = {

// ─── Project File ─────────────────────────────────────────────────────────────

'GUIDO.Mcp.Engine.csproj': `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <AssemblyName>GUIDO.Mcp.Engine</AssemblyName>
    <RootNamespace>GUIDO.Mcp.Engine</RootNamespace>
    <Description>GUIDO-compliant Agentic Execution Engine — MCP server for intent-based browser automation with DOM discovery, stable selectors, self-healing, and SPECTRA-TRACE observability.</Description>
  </PropertyGroup>

  <ItemGroup>
    <!-- MCP stdio server SDK -->
    <PackageReference Include="ModelContextProtocol" Version="0.2.0-preview.3" />
    <!-- Selenium WebDriver -->
    <PackageReference Include="Selenium.WebDriver" Version="4.27.0" />
    <PackageReference Include="Selenium.WebDriver.ChromeDriver" Version="131.0.6778.8500" />
    <!-- DI + Logging + Hosting -->
    <PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="8.0.1" />
    <PackageReference Include="Microsoft.Extensions.Logging" Version="8.0.1" />
    <PackageReference Include="Microsoft.Extensions.Logging.Console" Version="8.0.1" />
    <PackageReference Include="Microsoft.Extensions.Hosting" Version="8.0.1" />
  </ItemGroup>

</Project>
`,

// ─── Domain ───────────────────────────────────────────────────────────────────

'Domain/DomElement.cs': `namespace GUIDO.Mcp.Engine.Domain;

/// <summary>
/// Represents a single DOM element with multiple selector candidates ranked by stability.
/// </summary>
public sealed class DomElement
{
    public string TagName { get; init; } = string.Empty;
    public string? Id { get; init; }
    public string? Name { get; init; }
    public string? TextContent { get; init; }
    public string? AriaLabel { get; init; }
    public string? DataTestId { get; init; }
    public string? Role { get; init; }
    public string? Placeholder { get; init; }
    public IReadOnlyList<SelectorCandidate> Selectors { get; init; } = [];
    public IReadOnlyDictionary<string, string> Attributes { get; init; } = new Dictionary<string, string>();
    public bool IsInteractable { get; init; }
    public bool IsVisible { get; init; }
    public string XPath { get; init; } = string.Empty;
}

/// <summary>
/// A selector candidate with a stability score (0–100).
/// Higher scores = more stable across DOM changes.
/// id=100, data-testid=90, aria-label=80, name=70, css=60, xpath=40
/// </summary>
public sealed class SelectorCandidate
{
    public SelectorStrategy Strategy { get; init; }
    public string Value { get; init; } = string.Empty;
    public int StabilityScore { get; init; }
}

public enum SelectorStrategy
{
    Id,
    DataTestId,
    AriaLabel,
    Name,
    CssSelector,
    XPath,
    LinkText,
    PartialLinkText
}
`,

'Domain/DomMap.cs': `namespace GUIDO.Mcp.Engine.Domain;

/// <summary>
/// A structured map of the DOM for a scanned URL.
/// Returned by ScanDomAsync as the foundation for stable selector selection.
/// </summary>
public sealed class DomMap
{
    public string Url { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public DateTime ScannedAt { get; init; } = DateTime.UtcNow;
    public IReadOnlyList<DomElement> Elements { get; init; } = [];
    public string? SessionId { get; init; }
}
`,

'Domain/ExecutionStep.cs': `namespace GUIDO.Mcp.Engine.Domain;

/// <summary>
/// An intent-based execution step sent by the orchestrator.
/// Carries human-readable intent alongside the technical action.
/// The engine executes — it does not invent behavior.
/// </summary>
public sealed class ExecutionStep
{
    /// <summary>Human-readable description of what this step achieves (e.g. "Click the login button").</summary>
    public string Intent { get; init; } = string.Empty;

    public StepAction Action { get; init; }

    /// <summary>Primary selector strategy for locating the target element.</summary>
    public SelectorStrategy SelectorStrategy { get; init; }

    /// <summary>Selector value (e.g. "#login-btn", "//button[@type='submit']").</summary>
    public string SelectorValue { get; init; } = string.Empty;

    /// <summary>Input value for SendKeys/Select/AssertText actions.</summary>
    public string? InputValue { get; init; }

    /// <summary>Target URL for Navigate action.</summary>
    public string? Url { get; init; }

    /// <summary>Timeout in milliseconds. Defaults to 10000.</summary>
    public int TimeoutMs { get; init; } = 10_000;

    /// <summary>Correlation ID from the orchestrator for traceability.</summary>
    public string? TraceId { get; init; }
}

public enum StepAction
{
    Navigate,
    Click,
    DoubleClick,
    RightClick,
    SendKeys,
    Clear,
    Hover,
    Select,
    GetText,
    GetAttribute,
    TakeScreenshot,
    WaitForElement,
    ScrollIntoView,
    AssertText,
    AssertVisible,
    AssertEnabled
}
`,

'Domain/ExecutionResult.cs': `namespace GUIDO.Mcp.Engine.Domain;

/// <summary>The result of executing an ExecutionStep.</summary>
public sealed class ExecutionResult
{
    public bool Success { get; init; }
    public string? OutputValue { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ScreenshotPath { get; init; }
    public string? ResolvedSelector { get; init; }
    public SelectorStrategy? ResolvedStrategy { get; init; }
    public long DurationMs { get; init; }
    public string? TraceId { get; init; }

    public static ExecutionResult Ok(
        string? output = null, long durationMs = 0, string? traceId = null,
        string? resolvedSelector = null, SelectorStrategy? strategy = null) =>
        new() { Success = true, OutputValue = output, DurationMs = durationMs,
                TraceId = traceId, ResolvedSelector = resolvedSelector, ResolvedStrategy = strategy };

    public static ExecutionResult Fail(string error, long durationMs = 0, string? traceId = null) =>
        new() { Success = false, ErrorMessage = error, DurationMs = durationMs, TraceId = traceId };
}
`,

'Domain/HealingResult.cs': `namespace GUIDO.Mcp.Engine.Domain;

/// <summary>
/// The result of attempting to self-heal a broken selector.
/// The engine PROPOSES alternatives — the orchestrator DECIDES whether to apply them.
/// Controlled healing: no silent substitution.
/// </summary>
public sealed class HealingResult
{
    public bool Healed { get; init; }
    public string OriginalSelector { get; init; } = string.Empty;
    public IReadOnlyList<SelectorCandidate> Candidates { get; init; } = [];
    public string? RecommendedSelector { get; init; }
    public SelectorStrategy? RecommendedStrategy { get; init; }
    public string? Reason { get; init; }

    public static HealingResult Success(
        string original, IReadOnlyList<SelectorCandidate> candidates,
        string recommended, SelectorStrategy strategy, string reason) =>
        new() { Healed = true, OriginalSelector = original, Candidates = candidates,
                RecommendedSelector = recommended, RecommendedStrategy = strategy, Reason = reason };

    public static HealingResult NotFound(string original) =>
        new() { Healed = false, OriginalSelector = original,
                Reason = "No viable alternatives found in current DOM state." };
}
`,

'Domain/ExecutionTrace.cs': `namespace GUIDO.Mcp.Engine.Domain;

/// <summary>
/// A typed execution trace entry compatible with SPECTRA-TRACE observability format.
/// Emitted after every ScanDom, ExecuteStep, and HealSelector operation.
/// </summary>
public sealed class ExecutionTrace
{
    public string TraceId { get; init; } = Guid.NewGuid().ToString("N")[..8];
    public string? CorrelationId { get; init; }
    public TraceEventType EventType { get; init; }
    public string Intent { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    public long DurationMs { get; init; }
    public TraceOutcome Outcome { get; init; }
    public string? Details { get; init; }
    public string? Url { get; init; }
    public string? SelectorUsed { get; init; }
    public string? ScreenshotPath { get; init; }
    public string? ErrorMessage { get; init; }
    public string IterationId { get; init; } = "iter-1";
}

public enum TraceEventType
{
    DomScan,
    StepExecution,
    SelectorHealing,
    SessionStart,
    SessionEnd
}

public enum TraceOutcome
{
    Success,
    Failure,
    Partial,
    Healed
}
`,

// ─── Infrastructure ───────────────────────────────────────────────────────────

'Infrastructure/SessionManager.cs': `using OpenQA.Selenium;

namespace GUIDO.Mcp.Engine.Infrastructure;

/// <summary>
/// Manages WebDriver sessions. Mirrors the JS server's state.drivers Map pattern.
/// </summary>
public sealed class SessionManager : IDisposable
{
    private readonly Dictionary<string, IWebDriver> _drivers = new();
    private string? _currentSessionId;
    private bool _disposed;

    public string? CurrentSessionId => _currentSessionId;

    public IWebDriver CreateSession(string sessionId, IWebDriver driver)
    {
        _drivers[sessionId] = driver;
        _currentSessionId = sessionId;
        return driver;
    }

    public IWebDriver GetCurrent()
    {
        if (_currentSessionId is null || !_drivers.TryGetValue(_currentSessionId, out var driver))
            throw new InvalidOperationException("No active browser session. Call start_browser first.");
        return driver;
    }

    public bool TryGetSession(string sessionId, out IWebDriver? driver)
        => _drivers.TryGetValue(sessionId, out driver);

    public void CloseSession(string sessionId)
    {
        if (_drivers.TryGetValue(sessionId, out var driver))
        {
            driver.Quit();
            _drivers.Remove(sessionId);
        }
        if (_currentSessionId == sessionId)
            _currentSessionId = _drivers.Keys.LastOrDefault();
    }

    public IEnumerable<string> GetSessionIds() => _drivers.Keys;

    public void Dispose()
    {
        if (_disposed) return;
        foreach (var driver in _drivers.Values)
            try { driver.Quit(); } catch { /* best effort */ }
        _drivers.Clear();
        _disposed = true;
    }
}
`,

'Infrastructure/DriverFactory.cs': `using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Edge;

namespace GUIDO.Mcp.Engine.Infrastructure;

public enum BrowserType { Chrome, Firefox, Edge }

public sealed class BrowserOptions
{
    public bool Headless { get; init; } = true;
    public IReadOnlyList<string> Arguments { get; init; } = [];
}

/// <summary>Creates WebDriver instances for supported browsers.</summary>
public static class DriverFactory
{
    public static IWebDriver Create(BrowserType browser, BrowserOptions? options = null)
    {
        options ??= new BrowserOptions();
        return browser switch
        {
            BrowserType.Chrome  => CreateChrome(options),
            BrowserType.Firefox => CreateFirefox(options),
            BrowserType.Edge    => CreateEdge(options),
            _ => throw new NotSupportedException($"Browser '{browser}' is not supported.")
        };
    }

    private static IWebDriver CreateChrome(BrowserOptions opts)
    {
        var options = new ChromeOptions();
        if (opts.Headless) options.AddArgument("--headless=new");
        options.AddArgument("--no-sandbox");
        options.AddArgument("--disable-dev-shm-usage");
        foreach (var arg in opts.Arguments) options.AddArgument(arg);
        return new ChromeDriver(options);
    }

    private static IWebDriver CreateFirefox(BrowserOptions opts)
    {
        var options = new FirefoxOptions();
        if (opts.Headless) options.AddArgument("--headless");
        foreach (var arg in opts.Arguments) options.AddArgument(arg);
        return new FirefoxDriver(options);
    }

    private static IWebDriver CreateEdge(BrowserOptions opts)
    {
        var options = new EdgeOptions();
        if (opts.Headless) options.AddArgument("--headless=new");
        foreach (var arg in opts.Arguments) options.AddArgument(arg);
        return new EdgeDriver(options);
    }
}
`,

'Infrastructure/LocatorResolver.cs': `using OpenQA.Selenium;
using GUIDO.Mcp.Engine.Domain;

namespace GUIDO.Mcp.Engine.Infrastructure;

/// <summary>Resolves SelectorStrategy + value to a Selenium By locator.</summary>
public static class LocatorResolver
{
    public static By Resolve(SelectorStrategy strategy, string value) => strategy switch
    {
        SelectorStrategy.Id               => By.Id(value),
        SelectorStrategy.DataTestId      => By.CssSelector($"[data-testid='{value}']"),
        SelectorStrategy.AriaLabel       => By.CssSelector($"[aria-label='{value}']"),
        SelectorStrategy.Name            => By.Name(value),
        SelectorStrategy.CssSelector     => By.CssSelector(value),
        SelectorStrategy.XPath           => By.XPath(value),
        SelectorStrategy.LinkText        => By.LinkText(value),
        SelectorStrategy.PartialLinkText => By.PartialLinkText(value),
        _ => throw new NotSupportedException($"Selector strategy '{strategy}' is not supported.")
    };

    public static By Resolve(SelectorCandidate candidate) =>
        Resolve(candidate.Strategy, candidate.Value);
}
`,

// ─── Services ─────────────────────────────────────────────────────────────────

'Services/IGuidoMcpEngine.cs': `using GUIDO.Mcp.Engine.Domain;

namespace GUIDO.Mcp.Engine.Services;

/// <summary>
/// Core GUIDO Execution Engine interface.
/// This layer is ONLY execution + low-level intelligence.
/// No orchestration. No business logic.
/// </summary>
public interface IGuidoMcpEngine
{
    /// <summary>Navigate to a URL and build a structured DOM map with stable selectors.</summary>
    Task<DomMap> ScanDomAsync(string url);

    /// <summary>Execute a single intent-based step (click, type, navigate, assert, etc.).</summary>
    Task<ExecutionResult> ExecuteStepAsync(ExecutionStep step);

    /// <summary>
    /// Attempt to self-heal a broken selector by finding alternatives in the current DOM.
    /// Returns proposals — the orchestrator decides whether to apply them.
    /// </summary>
    Task<HealingResult> HealSelectorAsync(string brokenSelector);

    /// <summary>Emit a trace entry for SPECTRA-TRACE observability.</summary>
    Task TraceAsync(ExecutionTrace trace);
}
`,

'Services/DomScanService.cs': `using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using GUIDO.Mcp.Engine.Domain;
using GUIDO.Mcp.Engine.Infrastructure;

namespace GUIDO.Mcp.Engine.Services;

/// <summary>
/// Scans the DOM and extracts interactable elements with ranked selector candidates.
/// Stability ranking: id=100, data-testid=90, aria-label=80, name=70, css=60, xpath=40
/// </summary>
public sealed class DomScanService
{
    private readonly SessionManager _sessions;

    public DomScanService(SessionManager sessions) => _sessions = sessions;

    public async Task<DomMap> ScanAsync(string url)
    {
        var driver = _sessions.GetCurrent();

        if (!string.IsNullOrWhiteSpace(url))
        {
            driver.Navigate().GoToUrl(url);
            await WaitForDomStableAsync(driver);
        }

        var elements = ExtractElements(driver);

        return new DomMap
        {
            Url       = driver.Url,
            Title     = driver.Title,
            ScannedAt = DateTime.UtcNow,
            Elements  = elements
        };
    }

    private static async Task WaitForDomStableAsync(IWebDriver driver)
    {
        var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(10));
        await Task.Run(() => wait.Until(d =>
            ((IJavaScriptExecutor)d).ExecuteScript("return document.readyState")?.ToString() == "complete"));
    }

    private static IReadOnlyList<DomElement> ExtractElements(IWebDriver driver)
    {
        var js = (IJavaScriptExecutor)driver;
        var rawElements = js.ExecuteScript(DomExtractionScript) as IList<object>;
        if (rawElements is null) return [];

        return rawElements
            .OfType<IDictionary<string, object>>()
            .Select(MapToDomElement)
            .ToList();
    }

    private static DomElement MapToDomElement(IDictionary<string, object> raw)
    {
        return new DomElement
        {
            TagName        = raw.GetStr("tagName"),
            Id             = raw.GetStrOrNull("id"),
            Name           = raw.GetStrOrNull("name"),
            TextContent    = raw.GetStrOrNull("textContent"),
            AriaLabel      = raw.GetStrOrNull("ariaLabel"),
            DataTestId     = raw.GetStrOrNull("dataTestId"),
            Role           = raw.GetStrOrNull("role"),
            Placeholder    = raw.GetStrOrNull("placeholder"),
            XPath          = raw.GetStr("xpath"),
            IsInteractable = raw.GetBool("isInteractable"),
            IsVisible      = raw.GetBool("isVisible"),
            Selectors      = BuildSelectorCandidates(raw),
            Attributes     = new Dictionary<string, string>()
        };
    }

    private static IReadOnlyList<SelectorCandidate> BuildSelectorCandidates(IDictionary<string, object> raw)
    {
        var candidates = new List<SelectorCandidate>();

        void Add(SelectorStrategy s, string? v, int score)
        {
            if (!string.IsNullOrWhiteSpace(v))
                candidates.Add(new() { Strategy = s, Value = v!, StabilityScore = score });
        }

        Add(SelectorStrategy.Id,          raw.GetStrOrNull("id"),          100);
        Add(SelectorStrategy.DataTestId,  raw.GetStrOrNull("dataTestId"),  90);
        Add(SelectorStrategy.AriaLabel,   raw.GetStrOrNull("ariaLabel"),   80);
        Add(SelectorStrategy.Name,        raw.GetStrOrNull("name"),        70);
        Add(SelectorStrategy.CssSelector, raw.GetStrOrNull("cssSelector"), 60);
        Add(SelectorStrategy.XPath,       raw.GetStrOrNull("xpath"),       40);

        return candidates.OrderByDescending(c => c.StabilityScore).ToList();
    }

    // Injected into the browser to extract element metadata
    private const string DomExtractionScript = """
        const interactiveTags = new Set(['a','button','input','select','textarea','label']);
        const results = [];

        function getXPath(el) {
            if (el.id) return '//*[@id="' + el.id + '"]';
            const parts = [];
            while (el && el.nodeType === Node.ELEMENT_NODE) {
                let idx = 1;
                let sib = el.previousElementSibling;
                while (sib) { if (sib.tagName === el.tagName) idx++; sib = sib.previousElementSibling; }
                parts.unshift(el.tagName.toLowerCase() + '[' + idx + ']');
                el = el.parentElement;
            }
            return '/' + parts.join('/');
        }

        function getCssSelector(el) {
            if (el.id) return '#' + CSS.escape(el.id);
            if (el.dataset.testid) return '[data-testid="' + el.dataset.testid + '"]';
            const classes = Array.from(el.classList).slice(0,2).map(c => '.' + CSS.escape(c)).join('');
            return el.tagName.toLowerCase() + (classes || '');
        }

        function isVisible(el) {
            const r = el.getBoundingClientRect(), s = window.getComputedStyle(el);
            return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
        }

        let count = 0;
        for (const el of document.querySelectorAll('*')) {
            if (count >= 200) break;
            const tag = el.tagName.toLowerCase();
            const isInteractable = interactiveTags.has(tag) || el.getAttribute('role') !== null || el.tabIndex >= 0;
            if (!isInteractable && !el.getAttribute('aria-label') && !el.dataset.testid) continue;
            results.push({
                tagName: tag,
                id: el.id || null,
                name: el.getAttribute('name'),
                textContent: (el.textContent || '').trim().substring(0, 100) || null,
                ariaLabel: el.getAttribute('aria-label'),
                dataTestId: el.dataset.testid || null,
                role: el.getAttribute('role'),
                placeholder: el.getAttribute('placeholder'),
                cssSelector: getCssSelector(el),
                xpath: getXPath(el),
                isInteractable,
                isVisible: isVisible(el)
            });
            count++;
        }
        return results;
        """;
}

internal static class DictExtensions
{
    public static string GetStr(this IDictionary<string, object> d, string k)
        => d.TryGetValue(k, out var v) ? v?.ToString() ?? string.Empty : string.Empty;

    public static string? GetStrOrNull(this IDictionary<string, object> d, string k)
        => d.TryGetValue(k, out var v) ? v?.ToString() : null;

    public static bool GetBool(this IDictionary<string, object> d, string k)
        => d.TryGetValue(k, out var v) && v is true || v?.ToString() == "true";
}
`,

'Services/SelectorStabilityService.cs': `using OpenQA.Selenium;
using GUIDO.Mcp.Engine.Domain;
using GUIDO.Mcp.Engine.Infrastructure;

namespace GUIDO.Mcp.Engine.Services;

/// <summary>
/// Attempts to resolve a selector, trying candidates in descending stability order.
/// Returns the first candidate that successfully locates an element in the live DOM.
/// </summary>
public sealed class SelectorStabilityService
{
    private readonly SessionManager _sessions;

    public SelectorStabilityService(SessionManager sessions) => _sessions = sessions;

    public (IWebElement? element, SelectorCandidate? used) TryResolve(IReadOnlyList<SelectorCandidate> candidates)
    {
        var driver = _sessions.GetCurrent();
        foreach (var candidate in candidates.OrderByDescending(c => c.StabilityScore))
        {
            try
            {
                var elements = driver.FindElements(LocatorResolver.Resolve(candidate));
                if (elements.Count > 0) return (elements[0], candidate);
            }
            catch { /* try next */ }
        }
        return (null, null);
    }

    public IWebElement? TryFind(SelectorStrategy strategy, string value)
    {
        var driver = _sessions.GetCurrent();
        try
        {
            var elements = driver.FindElements(LocatorResolver.Resolve(strategy, value));
            return elements.Count > 0 ? elements[0] : null;
        }
        catch { return null; }
    }
}
`,

'Services/SelfHealingService.cs': `using OpenQA.Selenium;
using GUIDO.Mcp.Engine.Domain;
using GUIDO.Mcp.Engine.Infrastructure;

namespace GUIDO.Mcp.Engine.Services;

/// <summary>
/// Controlled self-healing: when a selector breaks, search the live DOM for alternatives
/// based on text fragments, aria attributes, and data-testid patterns extracted from the
/// broken selector string. NEVER silently applies a new selector — returns proposals only.
/// </summary>
public sealed class SelfHealingService
{
    private readonly SessionManager _sessions;

    public SelfHealingService(SessionManager sessions) => _sessions = sessions;

    public Task<HealingResult> HealAsync(string brokenSelector)
    {
        var driver = _sessions.GetCurrent();
        var tokens = TokenizeSelector(brokenSelector);
        var candidates = FindAlternatives(driver, tokens);

        if (candidates.Count == 0)
            return Task.FromResult(HealingResult.NotFound(brokenSelector));

        var best = candidates[0];
        return Task.FromResult(HealingResult.Success(
            brokenSelector, candidates, best.Value, best.Strategy,
            $"Found {candidates.Count} alternative(s). Best: {best.Strategy}='{best.Value}' (score:{best.StabilityScore})."));
    }

    private static IReadOnlyList<string> TokenizeSelector(string selector) =>
        selector
            .Replace("//", " ").Replace("[@", " ").Replace("']", " ")
            .Replace("#", " ").Replace(".", " ").Replace("[", " ").Replace("]", " ")
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length > 2)
            .Distinct()
            .Take(4)
            .ToList();

    private static IReadOnlyList<SelectorCandidate> FindAlternatives(IWebDriver driver, IReadOnlyList<string> tokens)
    {
        var candidates = new List<SelectorCandidate>();

        foreach (var token in tokens)
        {
            TryAdd(driver, candidates, By.CssSelector($"[data-testid*='{token}']"), SelectorStrategy.DataTestId, token, 90);
            TryAdd(driver, candidates, By.CssSelector($"[aria-label*='{token}']"), SelectorStrategy.AriaLabel, token, 80);
            TryAdd(driver, candidates, By.CssSelector($"[id*='{token}']"),         SelectorStrategy.CssSelector, $"[id*='{token}']", 70);
            TryAdd(driver, candidates, By.XPath($"//*[contains(text(),'{token}')]"), SelectorStrategy.XPath, $"//*[contains(text(),'{token}')]", 45);
        }

        return candidates
            .DistinctBy(c => c.Value)
            .OrderByDescending(c => c.StabilityScore)
            .Take(5)
            .ToList();
    }

    private static void TryAdd(IWebDriver driver, List<SelectorCandidate> list,
        By by, SelectorStrategy strategy, string value, int score)
    {
        try
        {
            if (driver.FindElements(by).Count > 0)
                list.Add(new() { Strategy = strategy, Value = value, StabilityScore = score });
        }
        catch { /* not found */ }
    }
}
`,

'Services/GuidoMcpEngine.cs': `using GUIDO.Mcp.Engine.Domain;
using GUIDO.Mcp.Engine.Infrastructure;
using GUIDO.Mcp.Engine.Tracing;
using Microsoft.Extensions.Logging;
using OpenQA.Selenium;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Support.UI;

namespace GUIDO.Mcp.Engine.Services;

/// <summary>
/// Primary implementation of IGuidoMcpEngine.
/// Coordinates DomScanService, SelfHealingService, and ExecutionTraceService.
/// </summary>
public sealed class GuidoMcpEngine : IGuidoMcpEngine
{
    private readonly SessionManager _sessions;
    private readonly DomScanService _domScan;
    private readonly SelfHealingService _healing;
    private readonly ExecutionTraceService _tracing;
    private readonly ILogger<GuidoMcpEngine> _logger;

    public GuidoMcpEngine(
        SessionManager sessions, DomScanService domScan,
        SelfHealingService healing, ExecutionTraceService tracing,
        ILogger<GuidoMcpEngine> logger)
    {
        _sessions = sessions;
        _domScan  = domScan;
        _healing  = healing;
        _tracing  = tracing;
        _logger   = logger;
    }

    public async Task<DomMap> ScanDomAsync(string url)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            var map = await _domScan.ScanAsync(url);
            sw.Stop();
            await _tracing.EmitAsync(new ExecutionTrace
            {
                EventType = TraceEventType.DomScan,
                Intent    = $"Scan DOM at {url}",
                Url       = map.Url,
                DurationMs = sw.ElapsedMilliseconds,
                Outcome   = TraceOutcome.Success,
                Details   = $"Found {map.Elements.Count} elements"
            });
            return map;
        }
        catch (Exception ex)
        {
            sw.Stop();
            await _tracing.EmitAsync(new ExecutionTrace
            {
                EventType    = TraceEventType.DomScan,
                Intent       = $"Scan DOM at {url}",
                Url          = url,
                DurationMs   = sw.ElapsedMilliseconds,
                Outcome      = TraceOutcome.Failure,
                ErrorMessage = ex.Message
            });
            throw;
        }
    }

    public async Task<ExecutionResult> ExecuteStepAsync(ExecutionStep step)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        ExecutionResult result;
        try { result = await DispatchAsync(step); }
        catch (Exception ex) { result = ExecutionResult.Fail(ex.Message, 0, step.TraceId); }
        sw.Stop();

        await _tracing.EmitAsync(new ExecutionTrace
        {
            CorrelationId = step.TraceId,
            EventType     = TraceEventType.StepExecution,
            Intent        = step.Intent,
            DurationMs    = sw.ElapsedMilliseconds,
            Outcome       = result.Success ? TraceOutcome.Success : TraceOutcome.Failure,
            SelectorUsed  = result.ResolvedSelector,
            ErrorMessage  = result.ErrorMessage,
            Details       = result.OutputValue
        });

        return result with { DurationMs = sw.ElapsedMilliseconds };
    }

    public async Task<HealingResult> HealSelectorAsync(string brokenSelector)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var result = await _healing.HealAsync(brokenSelector);
        sw.Stop();

        await _tracing.EmitAsync(new ExecutionTrace
        {
            EventType    = TraceEventType.SelectorHealing,
            Intent       = $"Heal selector: {brokenSelector}",
            DurationMs   = sw.ElapsedMilliseconds,
            Outcome      = result.Healed ? TraceOutcome.Healed : TraceOutcome.Failure,
            SelectorUsed = result.RecommendedSelector,
            Details      = result.Reason
        });

        return result;
    }

    public Task TraceAsync(ExecutionTrace trace) => _tracing.EmitAsync(trace);

    // ── Step dispatch ──────────────────────────────────────────────────────────

    private async Task<ExecutionResult> DispatchAsync(ExecutionStep step)
    {
        var driver = _sessions.GetCurrent();
        var sw = System.Diagnostics.Stopwatch.StartNew();

        if (step.Action == StepAction.Navigate)
        {
            driver.Navigate().GoToUrl(step.Url ?? throw new ArgumentException("Url is required for Navigate."));
            await Task.Run(() =>
                new WebDriverWait(driver, TimeSpan.FromMilliseconds(step.TimeoutMs))
                    .Until(d => ((IJavaScriptExecutor)d)
                        .ExecuteScript("return document.readyState")?.ToString() == "complete"));
            sw.Stop();
            return ExecutionResult.Ok(driver.Url, sw.ElapsedMilliseconds, step.TraceId);
        }

        var by   = LocatorResolver.Resolve(step.SelectorStrategy, step.SelectorValue);
        var wait = new WebDriverWait(driver, TimeSpan.FromMilliseconds(step.TimeoutMs));

        IWebElement El() => wait.Until(d => d.FindElement(by));

        void ScrollTo(IWebElement el) =>
            ((IJavaScriptExecutor)driver).ExecuteScript("arguments[0].scrollIntoView(true);", el);

        sw.Stop();

        return step.Action switch
        {
            StepAction.Click => Exec(() => { var el = El(); ScrollTo(el); el.Click(); }, step, sw),
            StepAction.DoubleClick => Exec(() => new Actions(driver).DoubleClick(El()).Perform(), step, sw),
            StepAction.RightClick => Exec(() => new Actions(driver).ContextClick(El()).Perform(), step, sw),
            StepAction.Hover => Exec(() => new Actions(driver).MoveToElement(El()).Perform(), step, sw),
            StepAction.SendKeys => Exec(() => { var el = El(); el.Clear(); el.SendKeys(step.InputValue ?? ""); }, step, sw,
                resolvedSelector: step.SelectorValue, strategy: step.SelectorStrategy),
            StepAction.Clear => Exec(() => El().Clear(), step, sw),
            StepAction.ScrollIntoView => Exec(() => ScrollTo(El()), step, sw),
            StepAction.WaitForElement => Exec(() => El(), step, sw,
                resolvedSelector: step.SelectorValue, strategy: step.SelectorStrategy),
            StepAction.GetText => ExecValue(() => El().Text, step, sw),
            StepAction.GetAttribute => ExecValue(() => El().GetAttribute(step.InputValue ?? "value"), step, sw),
            StepAction.TakeScreenshot => TakeScreenshot(driver, step),
            StepAction.AssertText => AssertText(El().Text, step.InputValue, step, sw),
            StepAction.AssertVisible => AssertCondition(El().Displayed, "AssertVisible: element is not visible.", step, sw),
            StepAction.AssertEnabled => AssertCondition(El().Enabled, "AssertEnabled: element is disabled.", step, sw),
            _ => throw new NotSupportedException($"Action '{step.Action}' is not implemented.")
        };
    }

    private static ExecutionResult Exec(Action action, ExecutionStep step,
        System.Diagnostics.Stopwatch sw,
        string? resolvedSelector = null, SelectorStrategy? strategy = null)
    {
        action();
        return ExecutionResult.Ok(durationMs: sw.ElapsedMilliseconds, traceId: step.TraceId,
            resolvedSelector: resolvedSelector, strategy: strategy);
    }

    private static ExecutionResult ExecValue(Func<string?> fn, ExecutionStep step,
        System.Diagnostics.Stopwatch sw) =>
        ExecutionResult.Ok(fn(), sw.ElapsedMilliseconds, step.TraceId,
            step.SelectorValue, step.SelectorStrategy);

    private static ExecutionResult AssertText(string actual, string? expected, ExecutionStep step,
        System.Diagnostics.Stopwatch sw) =>
        actual == expected
            ? ExecutionResult.Ok(actual, sw.ElapsedMilliseconds, step.TraceId)
            : ExecutionResult.Fail($"AssertText failed: expected '{expected}', got '{actual}'",
                sw.ElapsedMilliseconds, step.TraceId);

    private static ExecutionResult AssertCondition(bool condition, string failMessage,
        ExecutionStep step, System.Diagnostics.Stopwatch sw) =>
        condition
            ? ExecutionResult.Ok(durationMs: sw.ElapsedMilliseconds, traceId: step.TraceId)
            : ExecutionResult.Fail(failMessage, sw.ElapsedMilliseconds, step.TraceId);

    private static ExecutionResult TakeScreenshot(IWebDriver driver, ExecutionStep step)
    {
        var path = step.InputValue
            ?? Path.Combine(Path.GetTempPath(), $"guido-{DateTime.UtcNow:yyyyMMddHHmmss}.png");
        ((ITakesScreenshot)driver).GetScreenshot().SaveAsFile(path);
        return new ExecutionResult { Success = true, ScreenshotPath = path, TraceId = step.TraceId };
    }
}
`,

// ─── Tracing ──────────────────────────────────────────────────────────────────

'Tracing/TraceEntry.cs': `namespace GUIDO.Mcp.Engine.Tracing;

/// <summary>Internal DTO for SPECTRA-TRACE row serialization.</summary>
public sealed class TraceEntry
{
    public string TraceId { get; init; } = string.Empty;
    public string? CorrelationId { get; init; }
    public string EventType { get; init; } = string.Empty;
    public string Intent { get; init; } = string.Empty;
    public string Timestamp { get; init; } = string.Empty;
    public long DurationMs { get; init; }
    public string Outcome { get; init; } = string.Empty;
    public string? SelectorUsed { get; init; }
    public string? Details { get; init; }
    public string? ErrorMessage { get; init; }
    public string? Url { get; init; }
    public string IterationId { get; init; } = "iter-1";
}
`,

'Tracing/SpectraTraceWriter.cs': `using System.Text;

namespace GUIDO.Mcp.Engine.Tracing;

/// <summary>
/// Appends trace entries in SPECTRA-TRACE compatible markdown table format
/// to GUIDO-TRACE.md in the working directory.
/// </summary>
public sealed class SpectraTraceWriter
{
    private readonly string _filePath;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public SpectraTraceWriter(string? filePath = null)
        => _filePath = filePath ?? Path.Combine(Directory.GetCurrentDirectory(), "GUIDO-TRACE.md");

    public async Task WriteAsync(TraceEntry entry)
    {
        await _lock.WaitAsync();
        try
        {
            await EnsureHeaderAsync();
            await File.AppendAllTextAsync(_filePath, FormatRow(entry));
        }
        finally { _lock.Release(); }
    }

    private async Task EnsureHeaderAsync()
    {
        if (File.Exists(_filePath)) return;
        var sb = new StringBuilder();
        sb.AppendLine("# GUIDO-TRACE.md");
        sb.AppendLine("> Execution trace log — SPECTRA-TRACE compatible format");
        sb.AppendLine($"> Created: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine();
        sb.AppendLine("## Execution Log");
        sb.AppendLine();
        sb.AppendLine("| trace_id | correlation | type | intent | timestamp | ms | outcome | selector | details | error |");
        sb.AppendLine("|----------|-------------|------|--------|-----------|-----|---------|----------|---------|-------|");
        await File.WriteAllTextAsync(_filePath, sb.ToString());
    }

    private static string FormatRow(TraceEntry e)
    {
        static string S(string? v) => string.IsNullOrWhiteSpace(v) ? "—" : v.Replace("|", "\\|");
        return $"| {S(e.TraceId)} | {S(e.CorrelationId)} | {S(e.EventType)} | {S(e.Intent)} " +
               $"| {S(e.Timestamp)} | {e.DurationMs} | {S(e.Outcome)} " +
               $"| {S(e.SelectorUsed)} | {S(e.Details)} | {S(e.ErrorMessage)} |\\n";
    }
}
`,

'Tracing/ExecutionTraceService.cs': `using GUIDO.Mcp.Engine.Domain;
using Microsoft.Extensions.Logging;

namespace GUIDO.Mcp.Engine.Tracing;

/// <summary>
/// Receives ExecutionTrace domain objects, converts to TraceEntry,
/// and fans out to registered writers (file + logger).
/// </summary>
public sealed class ExecutionTraceService
{
    private readonly SpectraTraceWriter _writer;
    private readonly ILogger<ExecutionTraceService> _logger;

    public ExecutionTraceService(SpectraTraceWriter writer, ILogger<ExecutionTraceService> logger)
    {
        _writer = writer;
        _logger = logger;
    }

    public async Task EmitAsync(ExecutionTrace trace)
    {
        var entry = new TraceEntry
        {
            TraceId       = trace.TraceId,
            CorrelationId = trace.CorrelationId,
            EventType     = trace.EventType.ToString(),
            Intent        = trace.Intent,
            Timestamp     = trace.Timestamp.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            DurationMs    = trace.DurationMs,
            Outcome       = trace.Outcome.ToString(),
            SelectorUsed  = trace.SelectorUsed,
            Details       = trace.Details,
            ErrorMessage  = trace.ErrorMessage,
            Url           = trace.Url,
            IterationId   = trace.IterationId
        };

        _logger.LogDebug("[TRACE] {EventType} | {Intent} | {Outcome} | {DurationMs}ms",
            entry.EventType, entry.Intent, entry.Outcome, entry.DurationMs);

        await _writer.WriteAsync(entry);
    }
}
`,

// ─── Commands ─────────────────────────────────────────────────────────────────

'Commands/ScanDomCommand.cs': `using System.ComponentModel;
using System.Text.Json;
using GUIDO.Mcp.Engine.Services;
using ModelContextProtocol.Server;

namespace GUIDO.Mcp.Engine.Commands;

/// <summary>MCP tool: scan_dom — navigate and return a ranked DOM element map.</summary>
[McpServerToolType]
public static class ScanDomCommand
{
    private static readonly JsonSerializerOptions _json = new() { WriteIndented = true };

    [McpServerTool, Description(
        "Navigate to a URL and scan the DOM. Returns a structured map of interactive elements " +
        "with selector candidates ranked by stability (id=100 > data-testid=90 > aria-label=80 > css=60 > xpath=40). " +
        "Pass empty string to scan the current page without navigating.")]
    public static async Task<string> ScanDom(
        IGuidoMcpEngine engine,
        [Description("URL to navigate to. Pass empty string to scan the current page.")] string url)
    {
        var map = await engine.ScanDomAsync(url);
        return JsonSerializer.Serialize(new
        {
            url          = map.Url,
            title        = map.Title,
            scannedAt    = map.ScannedAt,
            elementCount = map.Elements.Count,
            elements     = map.Elements.Select(el => new
            {
                tag       = el.TagName,
                id        = el.Id,
                text      = el.TextContent,
                ariaLabel = el.AriaLabel,
                testId    = el.DataTestId,
                visible   = el.IsVisible,
                selectors = el.Selectors.Select(s => new
                {
                    strategy = s.Strategy.ToString(),
                    s.Value,
                    s.StabilityScore
                })
            })
        }, _json);
    }
}
`,

'Commands/ExecuteStepCommand.cs': `using System.ComponentModel;
using System.Text.Json;
using GUIDO.Mcp.Engine.Domain;
using GUIDO.Mcp.Engine.Services;
using ModelContextProtocol.Server;

namespace GUIDO.Mcp.Engine.Commands;

/// <summary>MCP tool: execute_step — run one intent-based browser automation step.</summary>
[McpServerToolType]
public static class ExecuteStepCommand
{
    private static readonly JsonSerializerOptions _json = new() { WriteIndented = true };

    [McpServerTool, Description(
        "Execute a single browser automation step. Provide intent (human-readable purpose), " +
        "action (Navigate/Click/SendKeys/GetText/AssertText/etc.), selector strategy and value. " +
        "Returns success, output value, timing, and resolved selector for traceability.")]
    public static async Task<string> ExecuteStep(
        IGuidoMcpEngine engine,
        [Description("Human-readable purpose, e.g. 'Click the login button'")] string intent,
        [Description("Action: Navigate|Click|DoubleClick|RightClick|SendKeys|Clear|Hover|GetText|GetAttribute|WaitForElement|ScrollIntoView|AssertText|AssertVisible|AssertEnabled|TakeScreenshot")] string action,
        [Description("Selector strategy: Id|DataTestId|AriaLabel|Name|CssSelector|XPath|LinkText|PartialLinkText")] string selectorStrategy,
        [Description("Selector value, e.g. 'user-name' or '#login-btn' or '//button[@type=\\"submit\\"]'")] string selectorValue,
        [Description("Input value for SendKeys/AssertText, or attribute name for GetAttribute")] string? inputValue = null,
        [Description("Target URL — required for Navigate action")] string? url = null,
        [Description("Timeout in milliseconds (default 10000)")] int timeoutMs = 10_000,
        [Description("Correlation/trace ID from the orchestrator")] string? traceId = null)
    {
        if (!Enum.TryParse<StepAction>(action, ignoreCase: true, out var parsedAction))
            return JsonSerializer.Serialize(new { error = $"Unknown action '{action}'" });

        if (!Enum.TryParse<SelectorStrategy>(selectorStrategy, ignoreCase: true, out var parsedStrategy))
            return JsonSerializer.Serialize(new { error = $"Unknown selectorStrategy '{selectorStrategy}'" });

        var result = await engine.ExecuteStepAsync(new ExecutionStep
        {
            Intent           = intent,
            Action           = parsedAction,
            SelectorStrategy = parsedStrategy,
            SelectorValue    = selectorValue,
            InputValue       = inputValue,
            Url              = url,
            TimeoutMs        = timeoutMs,
            TraceId          = traceId
        });

        return JsonSerializer.Serialize(new
        {
            success          = result.Success,
            outputValue      = result.OutputValue,
            errorMessage     = result.ErrorMessage,
            screenshotPath   = result.ScreenshotPath,
            resolvedSelector = result.ResolvedSelector,
            resolvedStrategy = result.ResolvedStrategy?.ToString(),
            durationMs       = result.DurationMs,
            traceId          = result.TraceId
        }, _json);
    }
}
`,

'Commands/HealSelectorCommand.cs': `using System.ComponentModel;
using System.Text.Json;
using GUIDO.Mcp.Engine.Services;
using ModelContextProtocol.Server;

namespace GUIDO.Mcp.Engine.Commands;

/// <summary>MCP tool: heal_selector — propose alternatives for a broken selector.</summary>
[McpServerToolType]
public static class HealSelectorCommand
{
    private static readonly JsonSerializerOptions _json = new() { WriteIndented = true };

    [McpServerTool, Description(
        "Find alternative selectors for a broken one using the current live DOM. " +
        "Returns ranked candidates — this engine PROPOSES, the orchestrator DECIDES. " +
        "No selector is silently replaced. Requires an active browser session on the relevant page.")]
    public static async Task<string> HealSelector(
        IGuidoMcpEngine engine,
        [Description("The broken selector, e.g. '#old-login-btn' or '//button[@id=\\"submit\\"]'")] string brokenSelector)
    {
        var result = await engine.HealSelectorAsync(brokenSelector);
        return JsonSerializer.Serialize(new
        {
            healed              = result.Healed,
            originalSelector    = result.OriginalSelector,
            recommendedSelector = result.RecommendedSelector,
            recommendedStrategy = result.RecommendedStrategy?.ToString(),
            reason              = result.Reason,
            candidates          = result.Candidates.Select(c => new
            {
                strategy       = c.Strategy.ToString(),
                c.Value,
                c.StabilityScore
            })
        }, _json);
    }
}
`,

'Commands/TraceCommand.cs': `using System.ComponentModel;
using System.Text.Json;
using GUIDO.Mcp.Engine.Domain;
using GUIDO.Mcp.Engine.Services;
using ModelContextProtocol.Server;

namespace GUIDO.Mcp.Engine.Commands;

/// <summary>MCP tool: emit_trace — push an orchestrator-level trace entry into GUIDO-TRACE.md.</summary>
[McpServerToolType]
public static class TraceCommand
{
    private static readonly JsonSerializerOptions _json = new() { WriteIndented = true };

    [McpServerTool, Description(
        "Emit a custom trace entry into GUIDO-TRACE.md (SPECTRA-TRACE format). " +
        "Use this for orchestrator-level events (spec start/end, iteration markers, coverage checkpoints) " +
        "that the execution engine itself cannot observe.")]
    public static async Task<string> EmitTrace(
        IGuidoMcpEngine engine,
        [Description("Human-readable intent / description of this event")] string intent,
        [Description("Event type: DomScan|StepExecution|SelectorHealing|SessionStart|SessionEnd")] string eventType,
        [Description("Outcome: Success|Failure|Partial|Healed")] string outcome,
        [Description("Correlation ID from the orchestrator")] string? correlationId = null,
        [Description("URL context")] string? url = null,
        [Description("Additional details")] string? details = null,
        [Description("Iteration identifier, e.g. 'iter-1'")] string iterationId = "iter-1")
    {
        if (!Enum.TryParse<TraceEventType>(eventType, ignoreCase: true, out var parsedEventType))
            return JsonSerializer.Serialize(new { error = $"Unknown eventType '{eventType}'" });

        if (!Enum.TryParse<TraceOutcome>(outcome, ignoreCase: true, out var parsedOutcome))
            return JsonSerializer.Serialize(new { error = $"Unknown outcome '{outcome}'" });

        var trace = new ExecutionTrace
        {
            Intent        = intent,
            EventType     = parsedEventType,
            Outcome       = parsedOutcome,
            CorrelationId = correlationId,
            Url           = url,
            Details       = details,
            IterationId   = iterationId
        };

        await engine.TraceAsync(trace);

        return JsonSerializer.Serialize(new { emitted = true, traceId = trace.TraceId, timestamp = trace.Timestamp }, _json);
    }
}
`,

// ─── Program.cs ───────────────────────────────────────────────────────────────

'Program.cs': `using GUIDO.Mcp.Engine.Infrastructure;
using GUIDO.Mcp.Engine.Services;
using GUIDO.Mcp.Engine.Tracing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;

// GUIDO MCP Execution Engine
// Spec-driven, intent-based browser automation via MCP stdio transport (JSON-RPC 2.0).
// Tools: scan_dom | execute_step | heal_selector | emit_trace

var builder = Host.CreateApplicationBuilder(args);

// Log to stderr only — stdout is reserved for MCP JSON-RPC messages
builder.Logging.ClearProviders();
builder.Logging.AddConsole(o => o.LogToStandardErrorThreshold = LogLevel.Warning);

builder.Services
    // Infrastructure
    .AddSingleton<SessionManager>()
    // Tracing
    .AddSingleton<SpectraTraceWriter>()
    .AddSingleton<ExecutionTraceService>()
    // Services
    .AddSingleton<DomScanService>()
    .AddSingleton<SelectorStabilityService>()
    .AddSingleton<SelfHealingService>()
    .AddSingleton<IGuidoMcpEngine, GuidoMcpEngine>()
    // MCP server (stdio transport, all tools discovered via assembly scan)
    .AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();

var app = builder.Build();

// Dispose SessionManager (quit all open browsers) on shutdown
app.Services.GetRequiredService<IHostApplicationLifetime>()
    .ApplicationStopping.Register(() =>
        app.Services.GetRequiredService<SessionManager>().Dispose());

await app.RunAsync();
`,

};

// ─── Write all files ──────────────────────────────────────────────────────────

let created = 0;
let skipped = 0;
let errors  = 0;

for (const [relativePath, content] of Object.entries(FILES)) {
    const fullPath = path.join(BASE, relativePath);
    const dir = path.dirname(fullPath);

    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (fs.existsSync(fullPath)) {
            fs.writeFileSync(fullPath, content, 'utf8'); // overwrite
            console.log(`✓ Updated: ${relativePath}`);
        } else {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✓ Created: ${relativePath}`);
        }
        created++;
    } catch (err) {
        console.error(`✗ Error: ${relativePath} — ${err.message}`);
        errors++;
    }
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`GUIDO MCP Engine bootstrap complete.`);
console.log(`  Files written : ${created}`);
console.log(`  Errors        : ${errors}`);
console.log(`\nNext steps:`);
console.log(`  cd src/GUIDO.Mcp.Engine`);
console.log(`  dotnet restore`);
console.log(`  dotnet build`);
console.log(`  dotnet run`);
