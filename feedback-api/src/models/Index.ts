import { User } from "./User.ts";
import { ICs } from "./ic.ts";
import { Project } from "./project.ts";
import { Feedback } from "./feedback.ts";
import { Area } from "./area.ts";
import { ManagerFeedback } from "./managerFeedback.ts";
import { ProjectManager } from "./projectManager.ts";


ICs.belongsTo(User, { foreignKey: "manager_id" });
ICs.hasMany(Feedback, { foreignKey: "ic_id", onDelete: "CASCADE" });

Feedback.belongsTo(User, { foreignKey: "author_id" });
Feedback.belongsTo(ICs, { foreignKey: "ic_id", targetKey: "IC_id" });
Feedback.belongsTo(Project, { foreignKey: "project_id" });

ManagerFeedback.belongsTo(User, { foreignKey: "manager_id", as: "manager" });
ManagerFeedback.belongsTo(User, { foreignKey: "author_id", as: "author" });
ManagerFeedback.belongsTo(Project, { foreignKey: "project_id" });

Project.hasMany(Feedback, { foreignKey: "project_id" });
Project.hasMany(ProjectManager, { foreignKey: "project_id", onDelete: "CASCADE" });
Project.hasMany(ManagerFeedback, { foreignKey: "project_id" });

ProjectManager.belongsTo(Project, { foreignKey: "project_id" });
ProjectManager.belongsTo(User, { foreignKey: "manager_id" });

Area.hasMany(User, { foreignKey: "area_id" });

User.hasMany(Feedback, { foreignKey: "author_id" });
User.hasMany(ICs, { foreignKey: "manager_id", onDelete: "RESTRICT" });
User.belongsTo(Area, { foreignKey: "area_id" });
User.hasMany(ProjectManager, { foreignKey: "manager_id", onDelete: "CASCADE" });
User.hasMany(ManagerFeedback, { foreignKey: "author_id", as: "authoredManagerFeedback", onDelete: "RESTRICT" });
User.hasMany(ManagerFeedback, { foreignKey: "manager_id", as: "receivedManagerFeedback", onDelete: "CASCADE" });
User.hasMany(User, { as: "managers", foreignKey: "director_id", onDelete: "RESTRICT" });
User.belongsTo(User, { as: "director", foreignKey: "director_id" });



export { User, ICs, Project, Feedback, Area, ManagerFeedback, ProjectManager };