import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.ts";

// Tabla: users
// ───────────
// id            INTEGER PK AUTOINCREMENT
// name          VARCHAR(255) NOT NULL
// email         VARCHAR(255) NOT NULL UNIQUE
// passwordHash  VARCHAR(255) NOT NULL
// role          VARCHAR(50)  NOT NULL DEFAULT 'MANAGER'
// area_id       INTEGER FK   NOT NULL 

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<number>;
    declare email: string;
    declare name: string;
    declare passwordHash: string;
    declare role: CreationOptional<string>; 
    declare area_id: number | null
}

User.init(
    {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: {type: DataTypes.STRING(255), allowNull: false, unique: true,validate: { isEmail: true }},
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    name : { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "manager" },
    area_id: { type: DataTypes.INTEGER, allowNull:true },
},
    {sequelize,tableName: "users",timestamps: false});
