import "./env.ts";
import express, { Request, Response } from "express";
import userRoutes from "./routes/user.routes.ts";
import icRoutes from "./routes/ic.routes.ts";
import feedbackRoutes from "./routes/feedback.routes.ts";
import usersRoutes from "./routes/users.routes.ts";
import areaRoutes from "./routes/area.routes.ts";
import projectRoutes from "./routes/project.routes.ts";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { readFileSync } from "node:fs";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

const openApiSpec = YAML.parse(
  readFileSync(new URL("../docs/openapi.yaml", import.meta.url), "utf8")
);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "FeedBack Controller API running", docs: `http://localhost:${PORT}/docs` });
});

app.use("/auth", userRoutes);
app.use("/ics", icRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/users", usersRoutes);
app.use("/areas", areaRoutes);
app.use("/projects", projectRoutes);

export default app;
