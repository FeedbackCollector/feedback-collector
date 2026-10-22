import "dotenv/config";
import bcrypt from "bcryptjs"; // tiene que ir primero: connection.ts lee process.env al cargarse
import { sequelize } from "./connection.ts";
import "../models/Index.ts"; 
import { User } from "../models/User.ts"
import { ICs } from "../models/ic.ts";





async function seed() {
    await sequelize.sync({ force: true });

    const adminPasswordHash = await bcrypt.hash("director", 10);
    const userPasswordHash = await bcrypt.hash("manager", 10);

  // 1. USUARIOS
    const [, manager] = await User.bulkCreate([
    { name :"director" ,email: "director@example.com", passwordHash: adminPasswordHash, role: "director" },
    { name : "manager"  ,email: "manager@example.com", passwordHash: userPasswordHash, area_id: 2 },

]);

  // 2. ICs (manager_id must be a user with the manager role)
    await ICs.bulkCreate([
    { name: "Ana Torres", title: "Software Engineer", manager_id: manager.id, entries: 0 },
    { name: "Luis Gomez", title: "QA Engineer", manager_id: manager.id, entries: 0 },
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