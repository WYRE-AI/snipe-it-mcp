/**
 * DRAFT tool surface — Tier 1 (asset-read) only, for scope review.
 *
 * Not wired to handlers yet. Schemas here are illustrative of the proposed
 * shape (see ../docs/scope-proposal.md for the full tiered breakdown and
 * endpoint mapping) — pending Aaron's tier-boundary sign-off before Tier 2/3
 * get added or any handler gets implemented.
 *
 * Follows fleet convention (connectwise-cpq-mcp/src/tools.ts): flat array,
 * hand-written JSON Schema, <vendor>_<verb>_<entity> naming, deterministic
 * order, no per-session variance.
 */
import type { Tool } from "@modelcontextprotocol/server";

const READ_ANNOTATIONS = { readOnlyHint: true } as const;

const searchProp = {
  type: "string" as const,
  description: "Free-text search across asset name, tag, serial, and model.",
};

const paginationProps = {
  limit: {
    type: "number" as const,
    description: "Results per page (Snipe-IT default 50).",
  },
  offset: {
    type: "number" as const,
    description: "Pagination offset (default 0).",
  },
};

export const TOOLS: Tool[] = [
  // 1
  {
    name: "snipeit_test_connection",
    description: "Verify SNIPEIT_URL + SNIPEIT_TOKEN and report the authenticated identity.",
    inputSchema: { type: "object", properties: {} },
    annotations: READ_ANNOTATIONS,
  },
  // 2
  {
    name: "snipeit_list_assets",
    description:
      "List/search assets with filters. Returns the fields the EOSL lifecycle-audit " +
      "pull-step needs: manufacturer, model, model_number, serial, status_label, " +
      "asset_tag, category, location, assigned_to.",
    inputSchema: {
      type: "object",
      properties: {
        search: searchProp,
        status: {
          type: "string" as const,
          description: "RTD | Deployed | Undeployable | Deleted | Archived | Requestable",
        },
        category_id: { type: "number" as const },
        manufacturer_id: { type: "number" as const },
        model_id: { type: "number" as const },
        location_id: { type: "number" as const },
        company_id: { type: "number" as const },
        ...paginationProps,
      },
    },
    annotations: READ_ANNOTATIONS,
  },
  // 3
  {
    name: "snipeit_get_asset",
    description: "Get full detail for one asset by its Snipe-IT internal id.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "number" as const } },
      required: ["id"],
    },
    annotations: READ_ANNOTATIONS,
  },
  // 4
  {
    name: "snipeit_get_asset_by_tag",
    description: "Get one asset by its asset tag — the barcode/tag-scan lookup path.",
    inputSchema: {
      type: "object",
      properties: { tag: { type: "string" as const } },
      required: ["tag"],
    },
    annotations: READ_ANNOTATIONS,
  },
  // 5
  {
    name: "snipeit_get_asset_by_serial",
    description: "Get one asset by its serial number — the physical-scan lookup path.",
    inputSchema: {
      type: "object",
      properties: { serial: { type: "string" as const } },
      required: ["serial"],
    },
    annotations: READ_ANNOTATIONS,
  },
  // 6
  {
    name: "snipeit_list_models",
    description:
      "List asset models (name, manufacturer, category, model number). Resolves " +
      "model_id filters; Snipe-IT's own model-level EOL/depreciation fields are a " +
      "secondary signal the EOSL audit can optionally use.",
    inputSchema: {
      type: "object",
      properties: { search: searchProp, manufacturer_id: { type: "number" as const }, ...paginationProps },
    },
    annotations: READ_ANNOTATIONS,
  },
  // 7
  {
    name: "snipeit_list_manufacturers",
    description: "List manufacturers — resolves manufacturer_id filters and provides the " +
      "manufacturer name key the EOSL lookup requires.",
    inputSchema: { type: "object", properties: { search: searchProp, ...paginationProps } },
    annotations: READ_ANNOTATIONS,
  },
  // 8
  {
    name: "snipeit_list_categories",
    description: "List asset categories.",
    inputSchema: { type: "object", properties: { search: searchProp, ...paginationProps } },
    annotations: READ_ANNOTATIONS,
  },
  // 9
  {
    name: "snipeit_list_status_labels",
    description: "List status labels (RTD/Deployed/Undeployable/Archived/etc).",
    inputSchema: { type: "object", properties: {} },
    annotations: READ_ANNOTATIONS,
  },
];
