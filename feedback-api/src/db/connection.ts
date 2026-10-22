import { Sequelize } from "sequelize";

// Conexión a PostgreSQL.
// Antes de usarla, creá en pgAdmin una base vacía llamada `library`.
// 👇 Cambiá estos datos por los de tu instalación de Postgres.
const DATABASE = process.env.DB_DATABASE || '';
const USER = process.env.DB_USER || '';
const PASSWORD = process.env.DB_PASSWORD || '';
const HOST = process.env.DB_HOST || '';
const PORT = Number(process.env.DB_PORT) || 5432;


const DATABASE_URL = process.env.DATABASE_URL;
const USE_SSL = process.env.DB_SSL === "true";
const dialectOptions = USE_SSL ? { ssl: { require: true, rejectUnauthorized: false } } : {};

// Con DATABASE_URL (servicios gestionados) se usa esa; si no, las variables DB_*.
export const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, { dialect: "postgres", logging: false, dialectOptions })
  : new Sequelize(DATABASE, USER, PASSWORD, {
      dialect: "postgres",
      host: HOST,
      port: PORT,
      logging: false, // poné `console.log` si querés ver el SQL que genera Sequelize
      dialectOptions,
    });
