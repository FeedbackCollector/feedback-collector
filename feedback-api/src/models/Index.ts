import { User } from "./User.ts";
import { ICs } from "./ic.ts";
import { Project } from "./project.ts";
import { Feedback } from "./feedback.ts";
import { Area } from "./area.ts";
import { ManagerFeedback } from "./managerFeedback.ts";
import { ProjectManager } from "./projectManager.ts";

User.hasMany(ICs, { foreignKey: "manager_id", onDelete: "RESTRICT" });
ICs.belongsTo(User, { foreignKey: "manager_id" });
User.hasMany(Feedback, { foreignKey: "author_id" });
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

Project.hasMany(ProjectManager, { foreignKey: "project_id", onDelete: "CASCADE" });
ProjectManager.belongsTo(Project, { foreignKey: "project_id" });
User.hasMany(ProjectManager, { foreignKey: "manager_id", onDelete: "CASCADE" });
ProjectManager.belongsTo(User, { foreignKey: "manager_id" });

Area.hasMany(User, { foreignKey: "area_id" });
User.belongsTo(Area, { foreignKey: "area_id" });

export { User, ICs, Project, Feedback, Area, ManagerFeedback, ProjectManager };