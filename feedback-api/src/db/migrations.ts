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

export async function ensureDirectorIdColumn(): Promise<void> {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable("users");

    if (!columns.director_id) {
        await queryInterface.addColumn("users", "director_id", {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "RESTRICT",
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

export async function ensureUnaccentExtension(): Promise<void> {
    await sequelize.query("CREATE EXTENSION IF NOT EXISTS unaccent;");
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

export async function ensureICDirectorIdColumn(): Promise<void> {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable("ics");

    if (!columns.director_id) {
        await queryInterface.addColumn("ics", "director_id", {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "RESTRICT",
        });
    }
}

export async function ensureICManagerIsNullable(): Promise<void> {
    await sequelize.query('ALTER TABLE "ics" ALTER COLUMN "manager_id" DROP NOT NULL');
}

export async function ensureICOwnerConstraint(): Promise<void> {
    await sequelize.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'ics_exactly_one_owner'
                  AND conrelid = 'ics'::regclass
            ) THEN
                ALTER TABLE ics
                ADD CONSTRAINT ics_exactly_one_owner
                CHECK ((manager_id IS NULL) <> (director_id IS NULL));
            END IF;
        END
        $$;
    `);
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
