import "../env.ts";
import bcrypt from "bcryptjs"; // tiene que ir primero: connection.ts lee process.env al cargarse
import { sequelize } from "./connection.ts";
import "../models/Index.ts"; 
import { User } from "../models/User.ts"
import { ICs } from "../models/ic.ts";
import { recalculateICScore } from "../repositories/ic.repository.ts";
import { Feedback } from "../models/feedback.ts";

import { Project } from "../models/project.ts";
import { Area } from "../models/Index.ts";







async function seed() {
    await sequelize.sync({ force: true });

    const adminPasswordHash = await bcrypt.hash("director", 10);
    const userPasswordHash = await bcrypt.hash("manager", 10);
    const [apollo, atlas, zephyr, orion] = await Project.bulkCreate([
  { name: "Apollo" },
  { name: "Atlas" },
  { name: "Zephyr" },
  { name: "Orion" },
]);

    const [ux,ui,research] = await Area.bulkCreate([
  { name: "UX" },
  { name: "UI" },
  { name: "Research" },
]);

    const [, carolina, lautaro, milito, mendez] = await User.bulkCreate([
    { name :"Martin Gonzalez" ,email: "director@example.com", passwordHash: adminPasswordHash, role: "director" },
    { name : "Carolina Méndez"  ,email: "manager@example.com", passwordHash: userPasswordHash, area_id: ux.id },
    { name : "Lautaro Martinez"  ,email: "Lautaro@example.com", passwordHash: userPasswordHash, area_id: ui.id },
    { name : "Milito Méndez"  ,email: "Milito@example.com", passwordHash: userPasswordHash, area_id: research.id },
    { name : "Méndez"  ,email: "Mendez@example.com", passwordHash: userPasswordHash, area_id: research.id },
]);
const [lucia, nicolas, camila] = await ICs.bulkCreate([
  { name: "Lucía Fernández", title: "UX Designer",     manager_id: carolina.id, area_id: ux.id, entries: 6 },
  { name: "Nicolás Herrera", title: "UX Designer Jr.", manager_id: carolina.id, area_id: ux.id, entries: 5 },
  { name: "Camila Rojas",    title: "UX Researcher",   manager_id: milito.id, area_id: research.id,   entries: 4 },
  { name: "Tomás Ibarra",    title: "UI Designer",     manager_id: lautaro.id, area_id: ui.id,  entries: 0 },
  { name: "Sofía Paz",       title: "UX Researcher",   manager_id: mendez.id, area_id: research.id,   entries: 0 },
]);
    // The feedback author is the manager of the IC it is about.
    const fb = (ic: { IC_id: number; manager_id: number }, project: { id: number }, date: string, source_name: string, score: number, comment: string | null) =>
      ({ author_id: ic.manager_id, ic_id: ic.IC_id, project_id: project.id, date, source_name, score, comment, screenshot_url: null });

    // Scores/dates reproduce the "My ICs" Figma design: averages 2.7 / 3.6 / 4.0 (team 3.3),
    // 6 / 5 / 4 entries, last entries 08/07, 08/13 and 08/13 (2026), 7 entries in the 30 days before 08/13.
    await Feedback.bulkCreate([
  // Lucía Fernández — 6 entries, avg 2.7
  fb(lucia, apollo, "2026-06-10", "1:1",         3, "Buenos wireframes, faltó validar con usuarios"),
  fb(lucia, atlas,  "2026-06-18", "Code review", 2, "Entregó fuera de plazo"),
  fb(lucia, zephyr, "2026-06-29", "Slack",       3, null),
  fb(lucia, orion,  "2026-07-08", "Demo",        3, "Prototipo correcto pero poco pulido"),
  fb(lucia, apollo, "2026-07-20", "Standup",     2, "Poca comunicación de bloqueos"),
  fb(lucia, atlas,  "2026-08-07", "Client call", 3, "Mejoró la presentación al cliente"),
  // Nicolás Herrera — 5 entries, avg 3.6
  fb(nicolas, zephyr, "2026-06-24", "Slack",       4, "Gran iniciativa con el sistema de diseño"),
  fb(nicolas, orion,  "2026-07-02", "1:1",         3, null),
  fb(nicolas, apollo, "2026-07-18", "Code review", 4, "Componentes consistentes"),
  fb(nicolas, atlas,  "2026-08-01", "Demo",        4, "Flujo de onboarding claro"),
  fb(nicolas, zephyr, "2026-08-13", "Standup",     3, "Debe estimar mejor los tiempos"),
  // Camila Rojas — 4 entries, avg 4.0
  fb(camila, orion,  "2026-06-15", "1:1",         4, "Entrevistas de usuario bien conducidas"),
  fb(camila, atlas,  "2026-07-01", "Slack",       4, null),
  fb(camila, apollo, "2026-07-25", "Demo",        4, "Síntesis de research muy útil para el equipo"),
  fb(camila, zephyr, "2026-08-13", "Client call", 4, "Excelente presentación de hallazgos"),
]);

    for (const ic of [lucia, nicolas, camila]) await recalculateICScore(ic.IC_id);

    console.log("✅ Database created and loaded:");
    console.log(`   ${await User.count()} users`);
    console.log(`   ${await ICs.count()} ICs`);
    console.log(`   ${await Project.count()} projects`);
    console.log(`   ${await Feedback.count()} feedback entries`);
    await sequelize.close();
}

seed().catch((error) => {
    console.error("❌ Error loading the database:", error);
    process.exit(1);
});