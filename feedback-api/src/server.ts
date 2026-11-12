import "./env.ts";
import app from "./app.ts";
import { sequelize } from "./db/connection.ts";
import { ensureAccountStatusColumn } from "./db/migrations.ts";
import { assertJwtSecret } from "./utils/token.ts";

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  assertJwtSecret();
  await sequelize.authenticate();
  await sequelize.sync();
  await ensureAccountStatusColumn();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Docs available at    http://localhost:${PORT}/docs`);
  });
}

start();
