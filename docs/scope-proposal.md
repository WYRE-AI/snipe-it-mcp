# snipe-it-mcp — tool surface scope proposal

For Aaron's 2026-08-12 morning review. Written by forge per boss's directive: scope +
scaffold first, report back before deep implementation.

## Grounding

- **Snipe-IT REST API**: `GET/POST/PUT/DELETE <SNIPEIT_URL>/api/v1/...`, Bearer-token auth.
  Confirmed via official docs (`snipe-it.readme.io`): `/hardware` list supports
  `search`, `limit`/`offset`, `sort`/`order`, and filters `model_id`, `category_id`,
  `manufacturer_id`, `company_id`, `location_id`, `status`/`status_id`, `assigned_to`.
  Per-asset response includes `asset_tag`, `serial`, `id`, `name`, `model`,
  `model_number`, `manufacturer`, `category`, `location`, `status_label`,
  `assigned_to`, `purchase_date`, `purchase_cost`, `notes`, `last_checkout`,
  `expected_checkin`.
- **Community reference** (`jameshgordy/snipeit-mcp`, 39 tools, MIT-ish, Python/FastMCP):
  used as the *capability menu* — confirms Snipe-IT's full surface (assets, consumables,
  components, accessories, licenses, users, companies, departments, groups, categories,
  manufacturers, models, status labels, locations, suppliers, depreciations, custom
  fields/fieldsets, reporting/audit, imports, system admin) — not copied tool-for-tool.
  Their tools are grouped multi-action mega-tools (`manage_assets` does full CRUD via an
  `action` param); WYRE's fleet convention (see `connectwise-cpq-mcp/src/tools.ts`) is
  flat, one-tool-per-operation, hand-written JSON Schema, `<vendor>_<verb>_<entity>`
  naming, `readOnlyHint`/`destructiveHint` annotations. This proposal follows the WYRE
  shape, sized down from the reference's 39-tool footprint.
- **EOSL driver** (`msp-claude-plugins#213`, `eosl-psa-lifecycle-audit` skill): pulls
  inventory → extracts manufacturer/model/part-number → runs EOSL.ai lifecycle checks →
  flags renewals. Snipe-IT's per-asset `manufacturer`, `model`/`model_number`, `serial`,
  and `status_label` are exactly the fields that pull-step needs. This is why Tier 1
  below is asset-read-first, not CRUD-first.

## Tier 1 — asset-read (proposed v1 minimum, ~9 tools)

| Tool | Endpoint | Purpose |
|---|---|---|
| `snipeit_test_connection` | `GET /users/me` (or `/hardware?limit=1`) | Verify URL + token, report the authenticated identity — standard first tool per fleet convention. |
| `snipeit_list_assets` | `GET /hardware` | Search/filter assets: `search`, `status`, `category_id`, `manufacturer_id`, `model_id`, `location_id`, `company_id`, pagination. Returns the EOSL-relevant fields per row. |
| `snipeit_get_asset` | `GET /hardware/{id}` | Full detail for one asset by internal id. |
| `snipeit_get_asset_by_tag` | `GET /hardware/bytag/{tag}` | Lookup by asset tag — barcode-scan use case. |
| `snipeit_get_asset_by_serial` | `GET /hardware/byserial/{serial}` | Lookup by serial — the other common physical-scan path. |
| `snipeit_list_models` | `GET /models` | Asset models (name, manufacturer, category, EOL/depreciation fields Snipe-IT itself tracks) — needed to resolve `model_id` filters and to cross-reference model-level EOL data Snipe-IT already has, which the EOSL audit can use as a secondary signal. |
| `snipeit_list_manufacturers` | `GET /manufacturers` | Needed to resolve `manufacturer_id` filters; manufacturer name is a required EOSL-lookup key. |
| `snipeit_list_categories` | `GET /categories` | Filter support + human-readable category names. |
| `snipeit_list_status_labels` | `GET /statuslabels` | Filter support (RTD/Deployed/Undeployable/Archived) + human-readable status names. |

## Tier 2 — asset lifecycle (proposed v1, ~6 tools)

Core write operations most ITAM use cases expect once read access exists. Low marginal
cost once Tier 1's client plumbing is built.

| Tool | Endpoint | Notes |
|---|---|---|
| `snipeit_create_asset` | `POST /hardware` | |
| `snipeit_update_asset` | `PUT /hardware/{id}` | |
| `snipeit_delete_asset` | `DELETE /hardware/{id}` | **Destructive** — needs the fleet's destructive-tool annotation + confirm-with-user description suffix. |
| `snipeit_checkout_asset` | `POST /hardware/{id}/checkout` | To a user, asset, or location. |
| `snipeit_checkin_asset` | `POST /hardware/{id}/checkin` | |
| `snipeit_audit_asset` | `POST /hardware/audit` | Mark an asset physically verified — feeds Snipe-IT's own audit-due tracking, complements (doesn't duplicate) the EOSL audit. |

## Tier 3 — broader ITAM entities (proposed defer to v2, ~20 tools)

Everything else in the community reference: consumables, components, accessories,
licenses (+ seats, files), users, companies, departments, groups, custom
fields/fieldsets, suppliers, depreciations, reporting/activity logs, CSV imports, system
administration (backups, LDAP, version info). Real ITAM value, but not on the EOSL
critical path and not needed for a focused v1. Flagged for a v2 pass once v1 is live and
Aaron/customers have used it.

## Open questions for Aaron

1. **Tier boundary**: ship Tier 1 only (leanest, fastest to review), Tier 1+2 (read +
   lifecycle, ~15 tools), or push for closer community parity now? Recommend Tier 1+2 —
   read-only-only feels incomplete for a first-party server people will actually adopt,
   but Tier 3 is genuinely deferrable.
2. **Companion SDK**: build `@wyre-ai/node-snipe-it` now (fleet convention) or
   inline the API client in this repo for v1 speed and split later? Recommend following
   convention from the start — inlining then splitting is real rework the fleet has hit
   before (multiple `node-*` extraction follow-ups in the backlog).
2. **Model-level EOL as a secondary signal**: Snipe-IT models can carry their own
   EOL/depreciation data independent of EOSL.ai. Worth a `snipeit_list_models` field
   worth surfacing prominently to the EOSL skill, or noise? Recommend surfacing it (cheap,
   already in Tier 1) and letting the EOSL skill's design decide whether to use it.
3. **Repo visibility**: currently private (draft/pre-review). Flip to public once scope
   is confirmed, matching every other `*-mcp` repo? Recommend yes, standard convention.
