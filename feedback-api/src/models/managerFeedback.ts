import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.ts";

// Feedback the director writes about a manager. Separate from `feedback` (which is about ICs) so it never mixes into IC or manager scores.
export class ManagerFeedback extends Model<InferAttributes<ManagerFeedback>, InferCreationAttributes<ManagerFeedback>> {
    declare id: CreationOptional<number>;
    declare author_id: number;
    declare manager_id: number;
    declare project_id: number;
    declare date: string;
    declare source_name: string;
    declare source_title: string | null;
    declare score: number;
    declare comment: string | null;
    declare screenshot_url: string | null;
    declare created_at: CreationOptional<Date>;
}

ManagerFeedback.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        author_id: { type: DataTypes.INTEGER, allowNull: false },
        manager_id: { type: DataTypes.INTEGER, allowNull: false },
        project_id: { type: DataTypes.INTEGER, allowNull: false },
        date: { type: DataTypes.DATEONLY, allowNull: false },
        source_name: { type: DataTypes.STRING(200), allowNull: false },
        source_title: { type: DataTypes.STRING(200), allowNull: true },
        score: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
        comment: { type: DataTypes.TEXT, allowNull: true },
        screenshot_url: { type: DataTypes.STRING(500), allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "manager_feedback", timestamps: false }
);
