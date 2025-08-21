# Renxt MCP Server

A Model Context Protocol (MCP) server that provides Claude Desktop with access to Blackbaud Raiser's Edge NXT (RENXT) API for constituent management.

## Features

- **List Constituents**: Retrieve paginated lists of constituents
- **Search Constituents**: Search for constituents by name, email, or lookup ID
- **Get Constituent Details**: Fetch detailed information for specific constituents
- **OAuth Token Management**: Automatic token refresh and secure credential handling
- **Claude Desktop Integration**: Seamless integration with Claude Desktop via MCP

## Prerequisites

- Node.js (v18 or higher)
- Blackbaud Developer Account with RENXT API access
- Claude Desktop application

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RynneSpin/renxt-mcp.git
   cd renxt-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the project root:
   ```env
   BLACKBAUD_CLIENT_ID=your_client_id_here
   BLACKBAUD_CLIENT_SECRET=your_client_secret_here
   BLACKBAUD_SUBSCRIPTION_KEY=your_subscription_key_here
   BLACKBAUD_REDIRECT_URI=http://localhost:5173/callback
   PORT=5173
   ```

4. **Authenticate with Blackbaud**
   ```bash
   npm run auth
   ```
   This will open a browser window for OAuth authentication and save your tokens.

## Claude Desktop Configuration

Add the server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "renxt": {
      "command": "/usr/local/bin/node",
      "args": ["/path/to/renxt-mcp/server.js"],
      "cwd": "/path/to/renxt-mcp"
    }
  }
}
```

Replace `/path/to/renxt-mcp` with the actual path to your project directory.

## Available Tools

### `list_constituents`
Lists constituents with optional limit parameter.

**Parameters:**
- `limit` (optional): Maximum number of constituents to return (1-50, default: 10)

**Example usage in Claude:**
> "List the first 5 constituents"

### `search_constituents`
Search for constituents by text criteria.

**Parameters:**
- `search_text` (required): Text to search for
- `search_field` (optional): Field to search in (`name`, `email_address`, `lookup_id`)
- `strict_search` (optional): Whether to perform strict search
- `limit` (optional): Maximum results to return (1-50, default: 10)

**Example usage in Claude:**
> "Search for constituents with the name 'Smith'"

### `get_constituent`
Retrieve detailed information for a specific constituent.

**Parameters:**
- `id` (required): The constituent's system ID

**Example usage in Claude:**
> "Get details for constituent ID 12345"

## Development

### Running the Server
```bash
npm start
```

### Project Structure
```
renxt-mcp/
├── server.js          # Main MCP server implementation
├── auth.js            # OAuth authentication flow
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (not in repo)
├── tokens.json       # OAuth tokens (not in repo)
└── .gitignore        # Git ignore rules
```

### API Integration

The server integrates with the following Blackbaud RENXT API endpoints:

- `GET /constituent/v1/constituents` - List constituents
- `GET /constituent/v1/constituents/{id}` - Get constituent details
- `GET /constituent/v1/constituents/search` - Search constituents

## Security

- **Environment Variables**: Sensitive credentials are stored in `.env` file (not tracked in git)
- **Token Management**: OAuth tokens are automatically refreshed when expired
- **Secure Storage**: Tokens are stored locally in `tokens.json` (not tracked in git)

## Troubleshooting

### Server Shows as "Disabled" in Claude Desktop

1. Ensure the `cwd` path in your Claude Desktop config is correct
2. Verify Node.js path with `which node` and update the `command` field
3. Check that all dependencies are installed with `npm install`
4. Restart Claude Desktop after configuration changes

### Authentication Issues

1. Verify your Blackbaud developer credentials in `.env`
2. Ensure your redirect URI matches the one configured in your Blackbaud app
3. Re-run the authentication: `npm run auth`

### API Errors

1. Check that your Blackbaud subscription key is valid
2. Verify your API permissions in the Blackbaud developer console
3. Ensure tokens haven't expired (automatic refresh should handle this)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues related to:
- **MCP Server**: Open an issue on this repository
- **Blackbaud API**: Consult the [Blackbaud Developer Documentation](https://developer.blackbaud.com/)
- **Claude Desktop**: Check the [Claude Desktop Documentation](https://docs.anthropic.com/claude/docs)

---

Built with ❤️ for the nonprofit community using Blackbaud Raiser's Edge NXT.