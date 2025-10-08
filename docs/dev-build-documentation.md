Frontend developer build & run — quick guide

This doc explains how to run the frontend locally for development, common environment variables, and troubleshooting tips. It focuses only on the frontend (you said you'll handle the backend).

Prerequisites
- Node.js 18+ (LTS recommended)
- npm (comes with Node.js) or yarn/pnpm if you prefer (project uses npm scripts)
- Git
- Recommended: VS Code with the TypeScript and ESLint extensions

Folder
- Frontend sources live in `frontend/` at the repo root.

Install dependencies
Open a terminal in the repository root or directly in the `frontend` folder and run:

```powershell
cd frontend
npm install
```

Start development server
The project uses Next.js (client + server) for the frontend. To start the dev server run:

```powershell
# from repo root
cd frontend
npm run dev
```

This will run the Next dev server (typically on http://localhost:3000). The terminal will show the URL and any build errors.

Environment variables
Create a `.env.local` in `frontend/` to store local-only variables. Example entries the app expects or commonly uses:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key
# any other NEXT_PUBLIC_* vars used by the code
```

Notes about reCAPTCHA
- The frontend expects a reCAPTCHA site key (client) and the backend needs the secret key.
- In dev you can a) use test keys from Google reCAPTCHA, b) stub-out recaptcha by toggling provider activation in the RecaptchaProvider (for fast local dev), or c) run over HTTPS and use real keys.
- If you see errors that recaptcha is not active, check the UI provider calls — some pages call `activateRecaptcha()` in useEffect; ensure the provider is mounted and the site key is present.

WASM assets
This project ships a WASM solver under `frontend/public/wasm/` and/or `frontend/WASM/`. Ensure those files are present and copied to `public/wasm/` if necessary. Next dev will serve `public/wasm/*` automatically.

Tailwind / CSS
Tailwind is configured. If you change Tailwind config, restart the dev server to pick up changes.

Common npm scripts
- npm run dev — start Next.js dev server
- npm run build — build production assets
- npm run start — start production server after build
- npm run lint — run ESLint
- npm run typecheck — run TypeScript checks (if available)

PowerShell tips
- Use `;` to chain commands on a single line in PowerShell, or run them separately.
- If you need to run HTTPS in Next dev for OAuth testing, see Next documentation or run a dev reverse proxy.

Troubleshooting
- Port in use: If port 3000 is occupied, Next will prompt to use another port; you can also run `PORT=3001 npm run dev` (PowerShell: `$env:PORT=3001; npm run dev`).
- ReCAPTCHA failing: Ensure `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set in `.env.local` and that the RecaptchaProvider is activated on the page you are testing.
- Missing public assets (fonts, wasm): Check `frontend/public/` and the files referenced in code. Missing assets will show 404s in the browser console.
- Type errors / build fails: Run `npm run typecheck` or look at the terminal where `npm run dev` shows compile errors — fix TS/React errors.

Debugging tips
- Open browser devtools (Console & Network) to inspect API calls and static asset 404s.
- If auth flows fail, verify the API base URL (NEXT_PUBLIC_API_BASE_URL) and that your backend server is running and reachable from the frontend.
- For OAuth flows (Google login) that require an exact redirect URI, use a tunnel (ngrok) or run local HTTPS matching the redirect URI configured in Google Console.

Production build & local run (optional)

```powershell
cd frontend
npm run build
npm run start
```

This builds server-side bundles and starts a production server. Use this to validate the production build locally.

Further notes
- Editor/debugging: Use VS Code debug launch config for Node/Next if you want to set breakpoints in server components.
- Tests: If the repo has tests, run `npm test` (or check package.json for the test script).

If you want, I can:
- add a short troubleshooting checklist specifically about reCAPTCHA activation steps (where to call `activateRecaptcha()`),
- provide a small PowerShell script to start both backend and frontend concurrently, or
- add a dev checklist for OAuth + webhook testing (ngrok usage).

Happy to expand any section you want more detail on.

## Backend — quick run notes (SSH tunnel + docker-compose)

These are the minimal steps to bring up the backend on the remote AWS EC2 instance where the project's Docker Compose configuration is expected to run from the repository root.

1) Open an SSH tunnel to the EC2 host (PowerShell examples)

```powershell
# Command provided separately
```

Notes:
- The command above creates a local forwarding for the remote service so your local frontend can call `http://localhost:5432` and reach the backend running on the EC2 instance.
- Keep the SSH session open while you develop. If you need to run the tunnel in the background on Windows you can use a dedicated terminal or run it through a backgrounded SSH client.

2) Build and start Docker Compose on the remote server

Once SSH'd into the EC2 instance (or using a remote shell), run from the repository root (NOT inside `/backend`):

```bash
# on the EC2 instance
cd /path/to/ConnectFour   # repo root on the server
docker-compose up --build
```

Notes:
- Running from repo root uses the top-level `docker-compose.yml` which wires frontend/backend services and any other infra you configured.
- If your production setup uses `docker-compose.prod.yml`, use that instead: `docker-compose -f docker-compose.prod.yml up --build`.

3) Verify and test

- With the SSH tunnel in place (if used) you should be able to hit the API at `http://localhost:5432` from your local machine.
- Check logs on the EC2 instance with:

```bash
docker-compose logs -f
```

- If containers fail to start, inspect individual container logs:

```bash
docker-compose logs -f <service-name>
```

Troubleshooting notes
- If `docker-compose` is not found on the server, install Docker Compose or use Docker's Compose plugin (modern Docker versions use `docker compose up --build`).
- Ensure your EC2 security groups allow SSH (port 22) from your IP and any required ports between containers for the Compose network.
- If the backend binds to 0.0.0.0 inside containers but still isn't reachable via the tunnel, confirm the container's port mapping in `docker-compose.yml` and use that remote host/port in the SSH tunnel command instead of `localhost:4000`.

If you'd like, I can add a one-liner PowerShell script to open the SSH tunnel and start the frontend dev server automatically (keeps two terminals open), or add explicit commands for using `docker compose` (no hyphen) depending on the Docker version on the server.