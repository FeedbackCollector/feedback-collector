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

// Adds ics.score (average feedback score) to existing databases and backfills it.
export async function ensureICScoreColumn(): Promise<void> {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable("ics");

    if (!columns.score) {
        await queryInterface.addColumn("ics", "score", {
            type: DataTypes.FLOAT,
            allowNull: true,
        });
        await sequelize.query(
            `UPDATE ics SET score = (SELECT ROUND(AVG(score)::numeric, 2) FROM feedback WHERE feedback.ic_id = ics."IC_id")`
        );
    }
}
