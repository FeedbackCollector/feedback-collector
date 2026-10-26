import { Sequelize } from "sequelize";

// Conexión a PostgreSQL.
// Antes de usarla, creá en pgAdmin una base vacía llamada `library`.
// 👇 Cambiá estos datos por los de tu instalación de Postgres.
const DATABASE = process.env.DB_DATABASE || '';
const USER = process.env.DB_USER || '';
const PASSWORD = process.env.DB_PASSWORD || '';
const HOST = process.env.DB_HOST || '';
const PORT = Number(process.env.DB_PORT) || 5432;


export const sequelize = new Sequelize(DATABASE, USER, PASSWORD, {
  dialect: "postgres",
  host: HOST,
  port: PORT,
  logging: false, // poné `console.log` si querés ver el SQL que genera Sequelize
});
