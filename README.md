# Authentication

A self-hosted JWT authentication service built with NestJS and TypeORM. Supports local (email/password) login and OpenID Connect (OIDC) single sign-on.

## Requirements

- Node.js 20+ 
- A PostgreSQL database called "authentication"

## Installation

1. Create a `.env` file containing the following variables:

   | Variable                 | Required | Description                                                              |
   |--------------------------|----------|--------------------------------------------------------------------------|
   | `DATABASE_HOST`          | Yes      | PostgreSQL host                                                          |
   | `DATABASE_PORT`          | Yes      | PostgreSQL port                                                          |
   | `DATABASE_NAME`          | Yes      | PostgreSQL database name                                                 |
   | `DATABASE_USERNAME`      | Yes      | PostgreSQL user                                                          |
   | `DATABASE_PASSWORD`      | Yes      | PostgreSQL password                                                      |
   | `JWT_ACCESS_SECRET`      | Yes      | Secret for signing access tokens                                         |
   | `JWT_REFRESH_SECRET`     | Yes      | Secret for signing refresh tokens                                        |
   | `SESSION_SECRET`         | Yes      | Secret for server-side session storage (required for OIDC)               |
   | `APP_URL`                | Yes      | Public base URL of this service (e.g. `http://localhost:3000`)           |
   | `CORS_ORIGIN`            | Yes      | Allowed CORS origin (e.g. `http://localhost:5173`)                       |
   | `JWT_ACCESS_EXPIRATION`  | No       | Access token lifetime — duration string or seconds (default: `15m`)     |
   | `JWT_REFRESH_EXPIRATION` | No       | Refresh token lifetime — duration string or seconds (default: `7d`)     |
   | `PORT`                   | No       | Port for the service (default: `3000`)                                   |

   > Duration strings use the [`ms`](https://github.com/vercel/ms) format: `15m`, `7d`, `1h`, etc. Plain integers are treated as seconds.

   See `.env.example` for a complete template.

2. Install dependencies:
   ```sh
   npm install
   ```

3. Run database migrations:
   ```sh
   npm run migration:run
   ```

4. Start the service:
   ```sh
   node dist/main
   ```

## Development

```sh
npm run start:dev
```

## Docker

Build and run with Docker:

```sh
docker build -t authentication .
docker run --env-file .env -p 3000:3000 authentication
```

## OIDC / Single Sign-On

OIDC is configured at runtime via the admin settings UI — no environment variables required. Once logged in as an ADMIN, navigate to **Settings → Single Sign-On** and provide:

- **Issuer URL** — the OIDC provider's discovery URL (e.g. `https://accounts.google.com`)
- **Client ID** and **Client Secret** — from your provider's app registration
- **Callback URL** — must be set to `{APP_URL}/login/oidc/callback` and registered with your provider

Saving valid OIDC credentials registers the strategy immediately — no restart needed. When OIDC is enabled, users who sign in via SSO are automatically created in the database on first login (if sign-up is enabled).

## API Reference

All responses follow the shape `{ success: boolean, value?: T, message?: string }`. Tokens are delivered as httpOnly cookies (`access_token`, `refresh_token`).

### Auth

| Method | Path                    | Auth              | Description                                          |
|--------|-------------------------|-------------------|------------------------------------------------------|
| POST   | `/login`                | —                 | Local login (email + password). Sets token cookies.  |
| POST   | `/sign-up`              | —                 | Register a new user (if sign-up is enabled).         |
| GET    | `/me`                   | JWT               | Returns the currently authenticated user.            |
| POST   | `/refresh`              | Refresh token     | Issues new token pair; rotates the refresh token.    |
| POST   | `/refresh/invalidate`   | JWT               | Revokes the current refresh token and clears cookies.|
| GET    | `/login/oidc`           | —                 | Initiates the OIDC authorization flow.               |
| GET    | `/login/oidc/callback`  | —                 | OIDC provider callback. Sets token cookies.          |

### Configuration

| Method | Path             | Auth       | Description                                                      |
|--------|------------------|------------|------------------------------------------------------------------|
| GET    | `/config`        | JWT, ADMIN | Returns full auth configuration (including OIDC secrets).        |
| PATCH  | `/config`        | JWT, ADMIN | Updates auth configuration. Reloads OIDC strategy if changed.    |
| GET    | `/config/public` | —          | Returns non-sensitive config: `signupEnabled`, `oidcEnabled`, `oidcProviderName`. |

### Users

All user endpoints require a valid JWT. Most require the `ADMIN` role.

| Method | Path              | Auth       | Description                    |
|--------|-------------------|------------|--------------------------------|
| GET    | `/users`          | JWT, ADMIN | List all users.                |
| POST   | `/users`          | JWT, ADMIN | Create a user.                 |
| GET    | `/users/:id`      | JWT        | Get a user by ID.              |
| PATCH  | `/users/:id`      | JWT, ADMIN | Update a user's profile.       |
| PATCH  | `/users/:id/role` | JWT, ADMIN | Update a user's role.          |
| DELETE | `/users`          | JWT, ADMIN | Delete a user by email.        |
