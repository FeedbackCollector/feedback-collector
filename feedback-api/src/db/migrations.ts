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
