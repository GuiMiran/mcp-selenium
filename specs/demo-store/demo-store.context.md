# Demo Store Context

## Purpose

This local demo page provides a portable end-to-end flow for validating the Selenium MCP server against a realistic commerce journey without depending on external websites.

## Risk and scope

- Business flow: login -> inventory -> cart -> checkout -> confirmation
- Primary risk: selector drift in interactive controls
- Test scope: smoke and regression baseline for a single-browser demo path

## Selector strategy guidance

- Prefer stable ids for MCP smoke coverage
- Keep `data-testid` and `aria-label` attributes available for future GUIDO selector ranking and self-healing scenarios
- Verify outcome state after every action instead of asserting only that the tool call succeeded

## Governance tags

- `@smoke`
- `@regression`
- `@e2e`
- `@acceptance`
- `@guido:L2`
