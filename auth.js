// auth.js
import express from "express";
import open from "open";
import axios from "axios";
import fs from "fs";
// Load .env by absolute path (ESM)
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const TOKENS_PATH =
  process.env.RENXT_TOKENS_PATH || path.join(__dirname, "tokens.json");

const {
  BLACKBAUD_CLIENT_ID,
  BLACKBAUD_CLIENT_SECRET,
  BLACKBAUD_REDIRECT_URI,
  PORT = 5173,
} = process.env;

const AUTH_URL = "https://oauth2.sky.blackbaud.com/authorization";
const TOKEN_URL = "https://oauth2.sky.blackbaud.com/token";

if (!BLACKBAUD_CLIENT_ID || !BLACKBAUD_CLIENT_SECRET || !BLACKBAUD_REDIRECT_URI) {
  console.error("Missing env vars. Check .env");
  process.exit(1);
}

const app = express();

app.get("/callback", async (req, res) => {
  const { code, error, error_description } = req.query;
  if (error) {
    return res.status(400).send(`OAuth error: ${error_description || error}`);
  }
  if (!code) return res.status(400).send("Missing authorization code");

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: code.toString(),
      redirect_uri: BLACKBAUD_REDIRECT_URI,
      client_id: BLACKBAUD_CLIENT_ID,
      client_secret: BLACKBAUD_CLIENT_SECRET,
    });

    const tokenResp = await axios.post(TOKEN_URL, body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const tokens = tokenResp.data; // {access_token, refresh_token, expires_in, ...}
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
console.error(`[renxt-mcp] Tokens saved to: ${TOKENS_PATH}`);
    res.send("Success! Tokens saved to tokens.json. You can close this window.");
    console.error("Tokens saved to tokens.json");
    process.exit(0);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).send("Token exchange failed. See console.");
  }
});

app.listen(PORT, async () => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: BLACKBAUD_CLIENT_ID,
    redirect_uri: BLACKBAUD_REDIRECT_URI,
    // scope parameter typically not required for SKY API; handled by Blackbaud. 
    // state optional.
  });
  const url = `${AUTH_URL}?${params.toString()}`;
  console.log("Opening browser for authorization...");
  await open(url);
});
