# Authentication

A self-hosted JWT authentication service built with NestJS and TypeORM.

## Requirements

- Node.js 20+
- A PostgreSQL database called "authentication"

## Installation

1. Create a `.env` file containing the following variables:

   | Variable | Required | Description |
   |---|---|---|
   | `DATABASE_HOST` | Yes | PostgreSQL host |
   | `DATABASE_USERNAME` | Yes | PostgreSQL user |
   | `DATABASE_PASSWORD` | Yes | PostgreSQL password |
   | `DATABASE_PORT` | Yes | PostgreSQL port |
   | `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens |
   | `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens |
   | `CORS_ORIGIN` | Yes | Allowed CORS origin |
   | `PORT` | No | Port for the service (defaults to 3000) |

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