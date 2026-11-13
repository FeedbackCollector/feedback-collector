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

export async function ensureSourceTitleColumn(): Promise<void> {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable("feedback");

    if (!columns.source_title) {
        await queryInterface.addColumn("feedback", "source_title", {
            type: DataTypes.STRING(200),
            allowNull: true,
        });
    }
}
