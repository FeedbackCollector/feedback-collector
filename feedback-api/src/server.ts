import "./env.ts";
import app from "./app.ts";
import { sequelize } from "./db/connection.ts";
import { ensureAccountStatusColumn, ensureICAreaColumn } from "./db/migrations.ts";

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  await sequelize.authenticate();
  await sequelize.sync();
  await ensureAccountStatusColumn();
  await ensureICAreaColumn();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Docs available at    http://localhost:${PORT}/docs`);
  });
}

start();
