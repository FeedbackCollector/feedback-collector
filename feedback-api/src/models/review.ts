import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.js";

export class Review extends Model<InferAttributes<Review>, InferCreationAttributes<Review>> {
  declare review_id: CreationOptional<number>;
  declare ic_id: number;
  declare author_id: number;
  declare project_id: number | null;
  declare origin: string;
  declare source_title: string | null;
  declare text: string;
  declare score: number;
  declare screenshot_path: string | null;
  declare occurred_on: string;
}

Review.init(
  {
    review_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "ics", key: "IC_id" },
      onDelete: "CASCADE",
    },
    author_id: { type: DataTypes.INTEGER, allowNull: false },
    project_id: { type: DataTypes.INTEGER, allowNull: true },
    origin: { type: DataTypes.STRING(100), allowNull: false },
    source_title: { type: DataTypes.STRING(255), allowNull: true },
    text: { type: DataTypes.TEXT, allowNull: false },
    score: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
    screenshot_path: { type: DataTypes.STRING(255), allowNull: true },
    occurred_on: { type: DataTypes.DATEONLY, allowNull: false },
  },
  { sequelize, tableName: "reviews", timestamps: false }
);