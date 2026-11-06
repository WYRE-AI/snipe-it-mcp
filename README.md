# snipe-it-mcp (DRAFT — scope stage, not yet reviewed)

> **Status:** repo scaffolded, no working implementation yet. This README doubles as the
> scope proposal for Aaron's 2026-08-12 morning review. Do not build the full tool set
> until the tier boundary below is confirmed — see `docs/scope-proposal.md`.

First-party WYRE MCP server for [Snipe-IT](https://snipeitapp.com/) (open-source IT asset
management). Built in-house per Aaron's 2026-08-12 directive ("B, do our own") — no
official Snipe-IT MCP exists yet, and the community options (`jameshgordy/snipeit-mcp`,
`Wil-Collier/...`) don't clear WYRE's first-party bar (unaudited, not gateway/S2S-wired,
no WYRE support surface).

## Why

The asset-read surface here is the **inventory feeder for the EOSL
psa-lifecycle-audit pluggable pull-step** (`msp-claude-plugins#213`, `eosl-psa-lifecycle-audit`
skill). That skill currently stubs a PSA pull (Autotask configuration-items /
ConnectWise PSA config) as its inventory source; Snipe-IT is the equivalent pull-step
for MSPs/customers who track assets in Snipe-IT instead of (or alongside) a PSA. The
EOSL audit needs, per asset: **manufacturer, model (or model number/part number), serial,
and status** — that shapes which tools are Tier 1 below.

## Auth

`SNIPEIT_URL` (self-hosted instance base, e.g. `https://assets.customer.com`) +
`SNIPEIT_TOKEN` (personal or API access token, Bearer auth) — matches Snipe-IT's own
API convention (`Authorization: Bearer <token>` against `<SNIPEIT_URL>/api/v1/...`).
Gateway/S2S mode follows fleet convention: 401 gate before the handler, credentials
never fall through to env vars when gateway-mode auth is expected.

## Proposed tool surface (see `docs/scope-proposal.md` for full detail + rationale)

Reference: `jameshgordy/snipeit-mcp`'s 39 tools (grouped CRUD-mega-tools) — used as the
**capability menu**, not copied. WYRE convention is flat, one-tool-per-operation naming
(`snipeit_<verb>_<entity>`), matching `connectwise-cpq-mcp`/other recent fleet servers.

| Tier | Scope | Tool count (est.) | Status |
|---|---|---|---|
| **1 — asset-read** (EOSL feeder, build first) | list/get/search assets + the lookup tables (models, manufacturers, categories, locations, status labels) needed to filter/interpret them | ~9 | **Proposed v1 minimum** |
| **2 — asset lifecycle** | create/update/delete asset, checkout/checkin, audit | ~6 | Proposed v1 (core ITAM value, low marginal cost once Tier 1 exists) |
| **3 — broader ITAM entities** | consumables, accessories, licenses, users, companies/departments, custom fields, reporting, imports, system admin | ~20 | **Defer to v2** unless Aaron wants full community-parity now |

Full per-tool breakdown, Snipe-IT REST endpoint mapping, and response-field notes are in
`docs/scope-proposal.md`.

## Companion SDK

Fleet convention wraps vendor API calls in a separate `@wyre-ai/node-snipe-it`
package (see `node-connectwise-cpq`, `node-scalepad`, etc. for the pattern) rather than
inline in this repo. **Not built yet** — scoping that is the next step after this
proposal is confirmed, so the SDK's shape matches whichever tier boundary Aaron picks.

## Status

Scaffold only. No handlers, no tests, no CI wired yet — deliberately, per the "scope
first, don't go deep before review" instruction. Not registered in Conduit's
`vendor-config.ts`, no GHCR image, no release pipeline. Repo is **private** pending
Aaron's scope sign-off (fleet convention for `*-mcp` repos is public; flip once approved
rather than defaulting to public pre-review).

## Security

Dependencies are locked in `package-lock.json` (install with `npm ci`). The MCP SDK floor is `@modelcontextprotocol/server` / `client` 2.3.1 and `node` 2.1.1, which carry the fixes for CVE-2026-111770 (GHSA-jm63-cq47-j5jp), CVE-2026-111768 (GHSA-46jr-4wx8-v453) and GHSA-f897-62hf-6gxq. When the HTTP server is added, follow the fleet request limits: a new server per request via `createMcpHandler(factory, { legacy: "stateless", maxRequestBodySize: 256 * 1024 })` and a 10,000-element cap on tool arguments (WYREAI-454).
