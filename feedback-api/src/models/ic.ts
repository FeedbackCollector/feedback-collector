import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.ts";

export class ICs extends Model<InferAttributes<ICs>, InferCreationAttributes<ICs>> {
  declare IC_id: CreationOptional<number>;
  declare name: string;
  declare title: string;
  declare manager_id: number;
  declare area_id: number | null;
  declare entries: number;
  declare score: CreationOptional<number | null>;
}

ICs.init(
  {
    IC_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    manager_id: { type: DataTypes.INTEGER, allowNull: false },
    area_id: { type: DataTypes.INTEGER, allowNull: true },
    entries: { type: DataTypes.INTEGER, allowNull: false },
    score: { type: DataTypes.FLOAT, allowNull: true },
  },
  { sequelize, tableName: "ics", timestamps: false }
);
