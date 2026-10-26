
import "dotenv/config"; 
import express, { Request, Response } from "express";
import { sequelize } from "./db/connection.ts";
import userRoutes from "./routes/user.routes.ts";
import icRoutes from "./routes/ic.routes.ts"
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { readFileSync } from "node:fs";

import ('dotenv/config'); 


const app = express();
const PORT = 3000;
app.use(express.json()); // permite leer JSON del body en POST / PUT / PATCH

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

const openApiSpec = YAML.parse(
  readFileSync(new URL("../docs/openapi.yaml", import.meta.url), "utf8")
);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "FeedBack Controller API running", docs: `http://localhost:${PORT}/api-docs` });
});

app.use('/auth', userRoutes);
app.use('/ics', icRoutes);





async function start() {
  await sequelize.authenticate(); // falla si Postgres no está prendido, si la base `FeedBack-Controller` no existe o si la contraseña de src/db/connection.ts está mal
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Docs available at    http://localhost:${PORT}/docs`);
  });
}

start();
