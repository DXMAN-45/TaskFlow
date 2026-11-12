
import { ObjectId } from "mongodb";

export function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

export function getProjectRole(project, userId) {
  if (!project || !userId) return null;

  if (project.ownerId?.toString() === userId.toString()) {
    return "owner";
  }

  const membership = project.members?.find(
    (member) => member.userId?.toString() === userId.toString()
  );

  return membership?.role || null;
}

export function canManageProject(role) {
  return role === "owner" || role === "admin";
}

export function canDeleteProject(role) {
  return role === "owner";
}

export function canCreateProjectTask(role) {
  return role === "owner" || role === "admin";
}

export function canDeleteProjectTask(role) {
  return role === "owner" || role === "admin";
}

export function canUpdateAssignedTask(role, assignedTo, userId) {
  if (role === "owner" || role === "admin") return true;

  return (
    role === "member" &&
    assignedTo?.toString() === userId?.toString()
  );
}
