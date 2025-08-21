// server.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ===== Paths & env =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

// Safety: never write to stdout (MCP uses it for JSON)
console.log = (...args) => console.error(...args);

// ===== Tokens =====
const TOKENS_PATH =
  process.env.RENXT_TOKENS_PATH || path.join(__dirname, "tokens.json");

function loadTokens() {
  console.error(`[renxt-mcp] Using tokens at: ${TOKENS_PATH}`);
  if (!fs.existsSync(TOKENS_PATH)) {
    throw new Error("Missing tokens.json. Run auth first.");
  }
  try {
    return JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
  } catch (e) {
    throw new Error(`Failed to read/parse tokens: ${e.message}`);
  }
}

let tokens = loadTokens();

// ===== Config =====
const {
  BLACKBAUD_CLIENT_ID,
  BLACKBAUD_CLIENT_SECRET,
  BLACKBAUD_SUBSCRIPTION_KEY,
} = process.env;

if (!BLACKBAUD_SUBSCRIPTION_KEY) {
  throw new Error("Missing BLACKBAUD_SUBSCRIPTION_KEY (in .env)");
}

const BASE_URL = "https://api.sky.blackbaud.com";
const TOKEN_URL = "https://oauth2.sky.blackbaud.com/token";

// ===== Axios instance & token refresh =====
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Bb-Api-Subscription-Key": BLACKBAUD_SUBSCRIPTION_KEY },
});

api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${tokens.access_token}`;
  return config;
});

async function refreshTokens() {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
    client_id: BLACKBAUD_CLIENT_ID,
    client_secret: BLACKBAUD_CLIENT_SECRET,
  });
  const resp = await axios.post(TOKEN_URL, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  tokens = resp.data;
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

api.interceptors.response.use(undefined, async (error) => {
  if (error.response && error.response.status === 401) {
    await refreshTokens();
    error.config.headers.Authorization = `Bearer ${tokens.access_token}`;
    return api.request(error.config);
  }
  throw error;
});

// ===== MCP server =====
const server = new McpServer({ name: "renxt-mcp", version: "0.1.0" });

// Define schemas for validation
const listConstituentsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
});

// list_constituents
server.registerTool(
  "list_constituents",
  {
    description: "List constituents. Optional `limit` (max 50).",
  },
  async (params) => {
    const { limit = 10 } = listConstituentsSchema.parse(params);
    const resp = await api.get(`/constituent/v1/constituents?limit=${encodeURIComponent(limit)}`);
    const items = (resp.data?.value || []).map(c => ({
      id: c.id, name: c.name, type: c.type, is_constituent: c.is_constituent
    }));
    return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
  }
);

const getConstituentSchema = z.object({ id: z.string() });

// get_constituent
server.registerTool(
  "get_constituent",
  {
    description: "Get a single constituent by system `id`.",
  },
  async (params) => {
    const { id } = getConstituentSchema.parse(params);
    const resp = await api.get(`/constituent/v1/constituents/${encodeURIComponent(id)}`);
    return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
  }
);

const searchConstituentsSchema = z.object({
  search_text: z.string(),
  search_field: z.enum(["name", "email_address", "lookup_id"]).optional(),
  strict_search: z.boolean().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

// search_constituents
server.registerTool(
  "search_constituents",
  {
    description: "Search by text. `search_field`: 'name' | 'email_address' | 'lookup_id'.",
  },
  async (params) => {
    const { search_text, search_field, strict_search, limit = 10 } = searchConstituentsSchema.parse(params);
    const urlParams = new URLSearchParams({ search_text, limit: String(limit) });
    if (search_field) urlParams.set("search_field", search_field);
    if (typeof strict_search === "boolean") urlParams.set("strict_search", String(strict_search));
    const resp = await api.get(`/constituent/v1/constituents/search?${urlParams.toString()}`);
    return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
  }
);

// ===== Transport =====
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("renxt-mcp server ready.");