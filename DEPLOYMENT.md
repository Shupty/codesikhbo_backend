# Backend production deployment

The API is an Express 4 service backed by MongoDB. It listens on `PORT`, serves `/health` for process health and `/ready` for database readiness, and expects the frontend origin to be explicitly allowlisted.

## Vercel setup

The API is exported as an Express application from `src/app.js`, which Vercel detects as a Node.js Express backend ([Vercel Express deployment documentation](https://vercel.com/docs/frameworks/backend/express)). The `build` script runs the backend syntax checks; this JavaScript service does not need a transpilation step.

1. Create two Vercel projects connected to this repository. Set the backend project's **Root Directory** to `backend`, and the frontend project's **Root Directory** to `frontend`. Note the frontend project's expected `*.vercel.app` production domain.
2. Add the backend environment values from the table below. Set `CLIENT_ORIGIN` to the frontend's exact HTTPS production origin (for example, `https://your-frontend-project.vercel.app`).
3. Deploy the backend with `npm run build` as the build command. Vercel detects and deploys the Express application from `src/app.js`; do not set a custom `start` command.
4. Set the frontend project's `NEXT_PUBLIC_API_URL` to the backend's public HTTPS URL ending in `/api`, then deploy it. The frontend build intentionally fails if this production URL is missing or is not HTTPS.
5. From a trusted local terminal with the production environment values set, run `npm run seed:admin` once. Do not include this command in the build or normal runtime.
6. If the frontend uses a custom domain, update backend `CLIENT_ORIGIN` to that exact origin and redeploy the backend.

The Vercel function uses a cached MongoDB connection across warm invocations and connects before handling API/readiness requests. `/health` remains a liveness endpoint; `/ready` checks the database connection. Vercel sets `VERCEL=1` automatically; `TRUST_PROXY=true` must be configured by you.

## Required production environment

Set these values in Vercel's project environment settings. Do not commit `.env` or paste secrets into deployment logs.

| Variable | Production requirement |
| --- | --- |
| `NODE_ENV` | Vercel sets `production` automatically for Production deployments. |
| `NEXT_PUBLIC_API_URL` | Frontend project only: `https://<backend-project>.vercel.app/api`. |
| `MONGO_URI` | Production MongoDB URI; use the provider's TLS-enabled connection string and restrict network access to the backend. |
| `JWT_SECRET` | Unique random secret, at least 32 characters. |
| `JWT_EXPIRES_IN` | Token lifetime, for example `1d`. |
| `CLIENT_ORIGIN` | One or more exact HTTPS frontend origins, comma-separated; paths and `*` are rejected. |
| `TRUST_PROXY` | Set `true` on Vercel so client IP rate limits use the forwarded IP correctly. |
| `ADMIN_EMAIL` | Email address for the first administrator account. |
| `ADMIN_PASSWORD` | Unique initial administrator password, at least 16 characters. |
| `ADMIN_NAME` | Initial administrator display name. |

Generate a JWT secret locally with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Use the result as a secret value in the host dashboard; never commit it.

## Non-Vercel deployment

1. Create a production MongoDB database. Configure TLS, backups, and a network access rule allowing only the backend host where the provider supports it.
2. Configure all required environment variables above. `CLIENT_ORIGIN` must match the browser-visible frontend origin exactly, including scheme and hostname.
3. Deploy the `backend/` directory using Node.js 18 or newer:

   ```bash
   npm ci
   npm run check
   npm start
   ```

4. Run the administrator seed command once from the same release with the production environment loaded:

   ```bash
   npm run seed:admin
   ```

   Keep the initial password in the provider's secret store. Rotate it after first login. The seed command promotes an existing account with the configured email to admin; it does not reset that account's password.
5. Configure the platform's health check to `GET /ready`. Use `GET /health` only as a process/liveness check; it does not prove MongoDB is connected.
6. Set the frontend build variable `NEXT_PUBLIC_API_URL` to the API's public base URL ending in `/api`, for example `https://api.example.com/api`, then deploy/rebuild the frontend.

## Operational notes

- Authentication endpoints are limited to 10 failed requests per 15 minutes per client IP. The API also has a 300-request-per-15-minute per-IP limit.
- Existing sessions are invalidated once when this release is first deployed because the token format now includes a revocation version. Users will need to sign in again.
- Rate-limit counters currently use in-memory storage and are per function instance. Configure Vercel Firewall rate limits or a shared store before relying on them as a production-wide abuse-control boundary.
- Use MongoDB Atlas IP access controls with a Vercel static egress option where available. Do not expose Atlas broadly unless required by the selected Vercel plan; if broad egress is unavoidable, use a dedicated least-privilege database user, TLS, strong credentials, and monitoring.
- Configure TLS at the host/load balancer, MongoDB backups, centralized logs/alerts, and a documented restore test before production traffic.
- `npm run seed:admin` must not be an every-start command. It is a one-time deployment operation.
- The API has no automated integration test suite yet. `npm run check` validates JavaScript syntax; perform the smoke tests below against the deployed staging service before directing real users to production.

## Staging smoke tests

```bash
curl -i https://api.example.com/health
curl -i https://api.example.com/ready
curl -i -X OPTIONS https://api.example.com/api/auth/login \
  -H 'Origin: https://app.example.com' \
  -H 'Access-Control-Request-Method: POST'
```

Expect `200` from both health endpoints when MongoDB is connected, and a successful CORS preflight for the configured frontend origin. An unconfigured browser origin should not receive an `Access-Control-Allow-Origin` header.
