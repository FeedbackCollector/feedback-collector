import { User } from "./User.ts";
import { ICs } from "./ic.ts";
import { Project } from "./project.ts";
import { Feedback } from "./feedback.ts";

User.hasMany(ICs, { foreignKey: "manager_id", onDelete: "RESTRICT" });
ICs.belongsTo(User, { foreignKey: "manager_id" });
User.hasMany(Feedback, { foreignKey: "author_id" });
Feedback.belongsTo(User, { foreignKey: "author_id" });
ICs.hasMany(Feedback, { foreignKey: "ic_id", onDelete: "CASCADE" });
Feedback.belongsTo(ICs, { foreignKey: "ic_id", targetKey: "IC_id" });
Project.hasMany(Feedback, { foreignKey: "project_id" });
Feedback.belongsTo(Project, { foreignKey: "project_id" });

export { User, ICs, Project, Feedback };