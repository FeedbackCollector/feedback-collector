import "./env.ts";
import app from "./app.ts";
import { sequelize } from "./db/connection.ts";
import { assertJwtSecret } from "./utils/token.ts";
import { ensureAccountStatusColumn, ensureUnaccentExtension, ensureICAreaColumn, ensureICScoreColumn } from "./db/migrations.ts";

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  assertJwtSecret();
  await sequelize.authenticate();
  await sequelize.sync();
  await ensureUnaccentExtension();
  await ensureAccountStatusColumn();
  await ensureICAreaColumn();
  await ensureICScoreColumn();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Docs available at    http://localhost:${PORT}/docs`);
  });
}

start();
