import { User } from "./User.ts";
import { ICs } from "./ic.ts";
import { Project } from "./project.ts";
import { Feedback } from "./feedback.ts";
import { Area } from "./area.ts";
import { ManagerFeedback } from "./managerFeedback.ts";

ICs.belongsTo(User, { as: "manager", foreignKey: "manager_id" });
ICs.belongsTo(User, { as: "director", foreignKey: "director_id" });
ICs.hasMany(Feedback, { foreignKey: "ic_id", onDelete: "CASCADE" });

Feedback.belongsTo(User, { foreignKey: "author_id" });
ICs.hasMany(Feedback, { foreignKey: "ic_id", onDelete: "CASCADE" });
Feedback.belongsTo(ICs, { foreignKey: "ic_id", targetKey: "IC_id" });
Project.hasMany(Feedback, { foreignKey: "project_id" });
Feedback.belongsTo(Project, { foreignKey: "project_id" });

// Feedback about a manager: removed with the manager, but the author (a director) cannot be deleted while they have authored any.
User.hasMany(ManagerFeedback, { foreignKey: "manager_id", as: "receivedManagerFeedback", onDelete: "CASCADE" });
ManagerFeedback.belongsTo(User, { foreignKey: "manager_id", as: "manager" });
User.hasMany(ManagerFeedback, { foreignKey: "author_id", as: "authoredManagerFeedback", onDelete: "RESTRICT" });
ManagerFeedback.belongsTo(User, { foreignKey: "author_id", as: "author" });
Project.hasMany(ManagerFeedback, { foreignKey: "project_id" });
ManagerFeedback.belongsTo(Project, { foreignKey: "project_id" });

Area.hasMany(User, { foreignKey: "area_id" });

User.hasMany(Feedback, { foreignKey: "author_id" });
User.hasMany(ICs, { as: "managedICs", foreignKey: "manager_id", onDelete: "RESTRICT" });
User.hasMany(ICs, { as: "unassignedICs", foreignKey: "director_id", onDelete: "RESTRICT" });
User.belongsTo(Area, { foreignKey: "area_id" });

export { User, ICs, Project, Feedback, Area, ManagerFeedback };