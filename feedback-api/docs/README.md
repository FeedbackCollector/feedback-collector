# parqueJurasico-API

REST API for managing the dinosaurs, enclosures, incidents, and users of a
Jurassic park.

## Requirements

- Node.js and npm
- PostgreSQL

## Setup

1. Install the dependencies from the project root:

```sh
   npm install
```

2. Set up a local PostgreSQL database. The connection is configured in
   `src/db/connection.ts` (database, user, password, host, and port).
   Adjust those values for your environment before starting the API.

3. Create a `.env` file in the root with the variables used by the application:

```env
   PORT=3000
   JWT_SECRET="(your chosen secret key here)"
```

## Loading the sample data

From the project root, run:

```sh
npm run db:seed
```

The seed drops and recreates the tables (`sequelize.sync({ force: true })`)
and loads sample data. This deletes any existing data.

It also creates these test users:

| Email | Password | Role |
|---|---|---|
| `manager@example.com` | `password` | `manager` |
| `director@example.com` | `password` | `director` |

Passwords are stored using bcrypt.

## Running the API

After setting up PostgreSQL and the `.env` file, start the server in
development mode:

```sh
npm run dev
```

The application uses the port defined in `PORT`. The interactive Swagger
documentation will be available at `http://localhost:<PORT>/api-docs`, for example
`http://localhost:3000/api-docs`.

## Technical decisions

- **TypeScript and Express:** implementation of the HTTP API and its routes.
- **PostgreSQL and Sequelize:** relational persistence and model definition.
- **bcrypt:** password storage as hashes, not as plain text.
- **JWT:** authentication using tokens with a one-hour lifetime.
- **Swagger UI:** interactive documentation available at `/api-docs`.

Authentication routes are mounted under `/auth`; for example,
`POST /auth/register` and `POST /auth/login`.