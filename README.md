# LMS

- `frontend/` - Next.js admin panel
- `backend/` - JavaScript Express/MongoDB API

## Backend

```bash
cd backend
npm install
npm run dev
```

Copy `.env.example` to `.env` for a new installation. The configured backend uses port `4100` and allows the frontend at `http://localhost:3000`. Create or promote the configured administrator with `npm run seed:admin`.

API endpoints include authentication (`/api/auth`), dashboard (`/api/dashboard`), course CRUD (`/api/courses`), admin user management (`/api/users`), and `/health`.

Never commit `.env` files.
