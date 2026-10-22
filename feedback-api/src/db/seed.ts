import "dotenv/config";
import bcrypt from "bcryptjs"; // tiene que ir primero: connection.ts lee process.env al cargarse
import { sequelize } from "./connection.ts";
import "../models/Index.ts"; 
import { User } from "../models/User.ts"





async function seed() {
    await sequelize.sync({ force: true });

    const adminPasswordHash = await bcrypt.hash("director", 10);
    const userPasswordHash = await bcrypt.hash("manager", 10);

    await await User.bulkCreate([
    { name :"director" ,email: "director@example.com", passwordHash: adminPasswordHash, role: "director" },
    { name : "manager"  ,email: "manager@example.com", passwordHash: userPasswordHash, area_id: 2 },

]);

    console.log("✅ Database created and loaded:");
    console.log(`   ${await User.count()} users`);
    await sequelize.close();
}

seed().catch((error) => {
    console.error("❌ Error loading the database:", error);
    process.exit(1);
});