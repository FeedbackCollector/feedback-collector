import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.ts";
import type { AccountStatus } from "../types/user.ts";

// Tabla: users
// ───────────
// id            INTEGER PK AUTOINCREMENT
// name          VARCHAR(255) NOT NULL
// email         VARCHAR(255) NOT NULL UNIQUE
// passwordHash  VARCHAR(255) NOT NULL
// role          VARCHAR(50)  NOT NULL DEFAULT 'MANAGER'
// area_id       INTEGER FK → area.id, NULL for users without an area (e.g. the director)
// status        VARCHAR(20)  NOT NULL DEFAULT 'approved'

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<number>;
    declare email: string;
    declare name: string;
    declare passwordHash: string;
    declare role: CreationOptional<string>; 
    declare area_id: number | null;
    declare status: CreationOptional<AccountStatus>;
}

User.init(
    {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: {type: DataTypes.STRING(255), allowNull: false, unique: true,validate: { isEmail: true }},
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    name : { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "manager" },
    area_id: { type: DataTypes.INTEGER, allowNull:true },
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "approved",
        validate: { isIn: [["pending", "approved"]] },
    },
},
    {sequelize,tableName: "users",timestamps: false});
