import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.ts";

export class Feedback extends Model<InferAttributes<Feedback>, InferCreationAttributes<Feedback>> {
    declare id: CreationOptional<number>;
    declare author_id: number;
    declare ic_id: number;
    declare project_id: number;
    declare date: string;
    declare source_name: string;
    declare score: number;
    declare comment: string | null;
    declare screenshot_url: string | null;
    declare created_at: CreationOptional<Date>;
    }

Feedback.init(
    {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    author_id: { type: DataTypes.INTEGER, allowNull: false },
    ic_id: { type: DataTypes.INTEGER, allowNull: false },
    project_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    source_name: { type: DataTypes.STRING(200), allowNull: false },
    score: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },    comment: { type: DataTypes.TEXT, allowNull: true },
    screenshot_url: { type: DataTypes.STRING(500), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "feedback", timestamps: false }
);

