import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.ts";

export class Area extends Model<InferAttributes<Area>, InferCreationAttributes<Area>> {
  declare id: CreationOptional<number>;
  declare name: string;
}
Area.init(
    {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    },
    { sequelize, tableName: "area", timestamps: false }
);