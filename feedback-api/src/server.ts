
import "dotenv/config"; 
import express, { Request, Response } from "express";
import { sequelize } from "./db/connection.ts";
import userRoutes from "./routes/user.routes.ts";


const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(express.json()); // permite leer JSON del body en POST / PUT / PATCH

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Library API running", docs: `http://localhost:${PORT}/docs` });
});

app.use('/auth', userRoutes);





async function start() {
  await sequelize.authenticate(); // falla si Postgres no está prendido, si la base `library` no existe o si la contraseña de src/db/connection.ts está mal
  await sequelize.sync(); // crea las tablas que falten, sin borrar datos
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Docs available at    http://localhost:${PORT}/docs`);
  });
}

start();
