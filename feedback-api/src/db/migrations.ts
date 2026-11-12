import { DataTypes } from "sequelize";
import { sequelize } from "./connection.ts";

export async function ensureAccountStatusColumn(): Promise<void> {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable("users");

    if (!columns.status) {
        await queryInterface.addColumn("users", "status", {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "approved",
        });
    }
}

export async function ensureICAreaColumn(): Promise<void> {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable("ics");

    if (!columns.area_id) {
        await queryInterface.addColumn("ics", "area_id", {
            type: DataTypes.INTEGER,
            allowNull: true,
        });
        await sequelize.query(
            `UPDATE ics SET area_id = (SELECT area_id FROM users WHERE users.id = ics.manager_id)`
        );
    }
}
