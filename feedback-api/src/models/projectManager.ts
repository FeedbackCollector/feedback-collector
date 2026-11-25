import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../db/connection.ts";

export class ProjectManager extends Model<
  InferAttributes<ProjectManager>,
  InferCreationAttributes<ProjectManager>
> {
  declare project_id: number;
  declare manager_id: number;
}

ProjectManager.init(
  {
    project_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    manager_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
  },
  { sequelize, tableName: "project_managers", timestamps: false }
);
