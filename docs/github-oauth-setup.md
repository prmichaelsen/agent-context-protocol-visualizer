# GitHub OAuth Setup

This visualizer supports GitHub OAuth authentication to enable:
- Access to private repositories
- Repository search/typeahead for your repos
- Higher API rate limits

## 1. Create a GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: ACP Visualizer (or your preferred name)
   - **Homepage URL**: `http://localhost:3400` (for dev) or your production URL
   - **Authorization callback URL**:
     - Dev: `http://localhost:3400/auth/github/callback`
     - Prod: `https://viz.agentcontextprotocol.net/auth/github/callback`
4. Click "Register application"
5. Note down the **Client ID**
6. Generate a new **Client Secret** and save it securely

## 2. Configure Environment Variables

### Local Development

Create a `.env.local` file in the project root:

```bash
VITE_GITHUB_CLIENT_ID=your_client_id_here
VITE_GITHUB_CLIENT_SECRET=your_client_secret_here
```

### Cloudflare Workers (Production)

For Cloudflare Workers deployment, you need to set secrets:

```bash
# Using wrangler CLI
wrangler secret put VITE_GITHUB_CLIENT_ID
# Enter your client ID when prompted

wrangler secret put VITE_GITHUB_CLIENT_SECRET
# Enter your client secret when prompted
```

Alternatively, use the Cloudflare dashboard:
1. Go to Workers & Pages > Your Worker > Settings > Variables
2. Add environment variables:
   - `VITE_GITHUB_CLIENT_ID`
   - `VITE_GITHUB_CLIENT_SECRET`

## 3. Test the Integration

1. Start the dev server: `npm run dev`
2. Open the app in your browser
3. In the sidebar, click "Sign in with GitHub"
4. Authorize the app
5. You should be redirected back with authentication complete
6. Try searching for your repos in the GitHub input field

## Security Notes

- The OAuth flow uses state parameter for CSRF protection
- Access tokens are stored in localStorage (client-side only)
- Tokens are included in API requests via Authorization header
- For production, ensure your callback URL matches exactly
- Keep your client secret secure and never commit it to version control

## Scopes

The app requests the `repo` scope, which grants:
- Read access to private repositories
- Read access to repository metadata
- No write permissions (read-only access)

To modify scopes, edit `src/lib/github-auth.ts` line 47.
