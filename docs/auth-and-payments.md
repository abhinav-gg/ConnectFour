Auth and Payments (Stripe) — Summary

This document summarizes the backend authentication flows, middleware, session lifecycle, and the Stripe integration points present in the codebase. It is intended for developers who need a quick reference to auth behavior and where to look in the code.

Files referenced
- `backend/src/controllers/api/routes/authRoutes.ts` — main auth HTTP routes (register, login, verify-email, Google OAuth flows, profile, logout, etc.)
- `backend/src/services/auth.service.ts` — core auth logic (session management, registration, login, email verification, token signing)
- `backend/src/lib/middleware/auth.middleware.ts` — session & reCAPTCHA middleware used by the routes
- `backend/src/utils/auth.ts` — helpers (session token generation, password hashing & verification, verification code generation)
- `backend/src/controllers/api/routes/stripeRoutes.ts` — Stripe integration (currently commented example/webhook handler)

High-level features
- Local registration/login with reCAPTCHA verification and email verification flow
- Google OAuth login + Google registration flow (uses a redirect + postMessage flow to complete sign-in in the client)
- Server-side session tokens stored in Redis and presented to the client as an httpOnly cookie (`sessionToken`)
- Anonymous session support (create an anonymous session token and use it in a cookie)
- Middleware helpers for optional authentication, required authentication, admin checks
- reCAPTCHA verification middleware used on routes where human verification is required
- Stripe: commented example code for payment-intent creation and webhook handling; webhook code expects raw body handling (bodyParser.raw)

Auth routes overview (important endpoints)
- POST /auth/register/start
  - Checks if email exists, if verified; triggers pre-verification flow. Uses `verifyRecaptcha` middleware.
  - If user exists but not verified, triggers `authService.handleEmailVerificationCheck` and returns a preVerify JWT for further verification.

- POST /auth/register
  - Normal registration (username, email, password) with `verifyRecaptcha`.
  - Creates user via `authService.registerUser` and issues a temporary JWT to verify email.

- POST /auth/login
  - Local login endpoint with `verifyRecaptcha`.
  - Uses `authService.loginLocalUser`. If service indicates email verification required, redirects to email verification UI.
  - On success, calls `authService.makeUserSession` and sets `sessionToken` cookie.

- POST /auth/verify-email
  - Uses `authService.verifyJWT` of a preVerify token and `authService.attemptEmailVerification(code)`; on success sets `sessionToken` cookie.

- GET /auth/google/start and GET /auth/google/callback
  - Standard OAuth2 dance: redirect to Google auth URL, exchange code for token, fetch user info, then sign in or return a registration postMessage HTML for client to finish registration.

- POST /auth/google/register
  - Finalize Google-based registration after client supplies username; uses `verifyRecaptcha`.

- GET /auth/me
  - Optional authentication; creates anonymous session token when no token present (calls `authService.makeAnonymousSession`) and returns user profile if authenticated.

- POST /auth/logout
  - Requires authenticated session. Calls `authService.logoutUser` to remove session from Redis and clears cookie.

Key middleware and behaviors

- verifyRecaptcha (in `auth.middleware.ts`)
  - Reads `recaptchaToken` from `req.body` or `req.query` and calls Google siteverify endpoint.
  - Verifies `success` and `score >= 0.5`. On failure returns 403.
  - On success attaches `req.recaptchaResult` and calls next().

- authenticateSession / requireSignedIn / optionalAuth / requireUnauthenticated
  - `authenticateSession`: requires `sessionToken` cookie and validates it via `authService.validateToken` (which reads Redis); sets `req.identity` to PlayerIdentity.
  - `requireSignedIn`: ensures token is a real user session (not anonymous). Returns 401 for anonymous.
  - `optionalAuth`: will attach `req.identity` if token validates, otherwise continues without error.
  - `requireUnauthenticated`: used for pages that should not be accessed by signed-in users; allows anonymous or no-cookie requests but rejects real user sessions.

Session lifecycle and Redis
- Sessions are tokens created by `authService.makeUserSession` which calls `redisOps().user.setSession(sessionToken, 'user:<userId>')`.
- Anonymous sessions are created using `authService.makeAnonymousSession` which stores `anon:<uuid>`.
- `authService.validateToken(token)` retrieves the session mapping from Redis and converts `user:<id>` or `anon:<id>` to a `PlayerIdentity`.
- Session cookie behavior (in routes that set it):
  - Name: `sessionToken`
  - Flags: `httpOnly: true`, `secure: true`, `sameSite: 'strict'`, `maxAge: 1000 * UserSessionTTL` (TTL from Redis schema)

Email verification flow
- `authService.sendEmailVerification(email, username)` generates a numeric code, stores it in Redis via `redis.user.setEmailCode(email, code)` and delegates sending to `sendEmailVerifyCode`.
- `authService.checkEmailVerifyCodes(email)` inspects existing TTLs to rate-limit resends.
- `authService.attemptEmailVerification(email, code)` validates stored code and on success marks user as verified and issues a session token.

Auth service responsibilities (summary)
- create and drop sessions in Redis
- register users (Local and Google)
- login (Local and Google)
- send & validate email verification codes
- sign and verify short-lived JWTs used during verification flows (via `signJWT`/`verifyJWT`)

Google OAuth specifics
- `GET /auth/google/start` builds an OAuth URL with `state` stored in Redis to mitigate CSRF.
- `GET /auth/google/callback` exchanges code for tokens, fetches user info, then logs in user or returns a small HTML page that posts a message back to the window opener with the session token (or registration token) — client handles postMessage.

Stripe integration (summary)
- `backend/src/controllers/api/routes/stripeRoutes.ts` contains commented example code with two main pieces:
  1. `POST /create-payment-intent` — create a Stripe payment intent and return client secret (example uses `stripe.paymentIntents.create`).
  2. `POST /webhook` — example webhook handler that expects `bodyParser.raw({ type: 'application/json' })` and verifies Stripe signature using `stripe.webhooks.constructEvent` and `endpointSecret`.
- The webhook handler demonstrates handling `payment_intent.succeeded` and optionally calling a service such as `updateUserToPro(userId)` when the payment is completed.

Auth route stack trace diagrams

1) Regular local registration/login flow (happy path)

Client --> POST /auth/register (verifyRecaptcha)
             authRoutes.register -> authService.registerUser -> rdsDBOps.user.createUser
             authService.sendEmailVerification -> redis.user.setEmailCode(email)
             response: presignup JWT (frontend asks user for code -> verify-email)

Client --> POST /auth/verify-email (verifyRecaptcha)
             authRoutes.verify-email -> authService.verifyJWT -> authService.attemptEmailVerification
             on success: authService.makeUserSession -> redis.user.setSession
             set cookie sessionToken -> 200 OK

2) Login flow (local)

Client --> POST /auth/login (verifyRecaptcha)
             authRoutes.login -> authService.loginLocalUser
               -> userDbOps.getUserByEmail/getUserByUsername
               -> if email not verified: authService.handleEmailVerificationCheck (returns 401, preverify JWT)
               -> if verified & password OK: authService.makeUserSession -> set cookie sessionToken

3) Google OAuth flow (happy path)

Client --> GET /auth/google/start
  server: generate `state`, store in redis, redirect to Google oauth URL

Google -> redirect to GET /auth/google/callback?code=...&state=...
  server: validate `state` via redis, exchange code for tokens, fetch userinfo
  server: if user exists and verified -> authService.loginGoogleUser -> create sessionToken -> set cookie
  server: respond with small HTML that posts session token to window.opener

4) Middleware stack for protected routes

Incoming Request -> [verifyRecaptcha?] -> authenticateSession (validate sessionToken via authService.validateToken -> redis) -> requireSignedIn? -> route handler

Notes, pitfalls, and gotchas
- reCAPTCHA relies on env `GOOGLE_RECAPTCHA_SECRET_KEY` and expects a `recaptchaToken` in the request; missing secret or token returns 403.
- Cookie `secure: true` requires HTTPS; ensure dev/test environments either run HTTPS or adapt cookie flags for dev.
- Google OAuth callback returns HTML that uses window.postMessage — UI must open login in a popup to complete the flow.
- Session tokens are random base64 strings (`generateSessionToken` uses crypto random bytes).
- The code uses argon2 for password hashing and crypto.randomUUID for UUIDs.

Where to look for further details
- `backend/src/services/auth.service.ts` — implementation details for session creation, registration, login, verification
- `backend/src/controllers/api/routes/authRoutes.ts` — routing, request validation and cookie-setting code
- `backend/src/lib/middleware/auth.middleware.ts` — recaptcha and session middleware implementations
- `backend/src/controllers/api/routes/stripeRoutes.ts` — example Stripe webhook + payment intent creation (commented)

Short snippet: set auth cookie (example used in multiple places)

```ts
res.cookie('sessionToken', sessionToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 1000 * UserSessionTTL,
});
```

If you want, I can also:
- produce sequence diagrams (Mermaid) exported as images, or
- add a one-page quickstart on how to test the Google OAuth flow locally (dev HTTPS, redirect URI), or
- extract and document the Redis key schema used for sessions and email codes.

End of document.
