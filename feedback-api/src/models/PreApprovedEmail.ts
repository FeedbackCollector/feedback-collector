import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.ts";

export class PreApprovedEmail extends Model<InferAttributes<PreApprovedEmail>, InferCreationAttributes<PreApprovedEmail>> {
    declare email: string;
    declare created_at: CreationOptional<Date>;
}

PreApprovedEmail.init(
    {
        email: { type: DataTypes.STRING(255), primaryKey: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "pre_approved_emails", timestamps: false },
);
