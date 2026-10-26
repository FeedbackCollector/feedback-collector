import "dotenv/config";
import bcrypt from "bcryptjs"; // tiene que ir primero: connection.ts lee process.env al cargarse
import { sequelize } from "./connection.ts";
import "../models/Index.ts"; 
import { User } from "../models/User.ts"
import { ICs } from "../models/ic.ts";
import { Feedback } from "../models/feedback.ts";

import { Project } from "../models/project.ts";







async function seed() {
    await sequelize.sync({ force: true });

    const adminPasswordHash = await bcrypt.hash("director", 10);
    const userPasswordHash = await bcrypt.hash("manager", 10);
    const [apollo, atlas] = await Project.bulkCreate([{ name: "Apollo" }, { name: "Atlas" }]);

    const [, manager] = await User.bulkCreate([
    { name :"director" ,email: "director@example.com", passwordHash: adminPasswordHash, role: "director" },
    { name : "manager"  ,email: "manager@example.com", passwordHash: userPasswordHash, area_id: 2 },

]);
const [ana, luis, carla, diego, sofia, mateo] = await ICs.bulkCreate([
  { name: "Ana Torres",    title: "Software Engineer",        manager_id: manager.id, entries: 0 },
  { name: "Luis Gomez",    title: "QA Engineer",              manager_id: manager.id, entries: 0 },
  { name: "Carla Mendez",  title: "AI Engineer",              manager_id: manager.id, entries: 0 },
  { name: "Diego Ruiz",    title: "DevOps Engineer",          manager_id: manager.id, entries: 0 },
  { name: "Sofia Castro",  title: "Frontend Developer",       manager_id: manager.id, entries: 0 },
  { name: "Mateo Herrera", title: "Data Analyst",             manager_id: manager.id, entries: 0 },
]);

    await Feedback.bulkCreate([
  { author_id: manager.id, ic_id: ana.IC_id, project_id: apollo.id, date: "2026-10-01",
    source_name: "Slack", score: 5, comment: "Excelente entrega", screenshot_url: null },
  { author_id: manager.id, ic_id: ana.IC_id, project_id: atlas.id, date: "2026-10-08",
    source_name: "Code review", score: 4, comment: "Buen código", screenshot_url: null },
  { author_id: manager.id, ic_id: luis.IC_id, project_id: apollo.id, date: "2026-10-05",
    source_name: "Standup", score: 3, comment: null, screenshot_url: null },
]);




    console.log("✅ Database created and loaded:");
    console.log(`   ${await User.count()} users`);
    console.log(`   ${await ICs.count()} ICs`);
    await sequelize.close();
}

seed().catch((error) => {
    console.error("❌ Error loading the database:", error);
    process.exit(1);
});