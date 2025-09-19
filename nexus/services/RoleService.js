// services/RoleService.js
import { Role, Permission } from "../models/index.js";

class RoleService {
   // Create a new role
   async createRole(roleData) {
      const { name, description, permissions } = roleData;

      const existingRole = await Role.findOne({ name });
      if (existingRole) {
         throw new Error("Role with this name already exists");
      }

      const role = new Role({ name, description });

      if (permissions && permissions.length > 0) {
         const permissionDocs = await Permission.find({ name: { $in: permissions } });
         role.permissions = permissionDocs.map((p) => p._id);
      }

      await role.save();
      return role;
   }

   // Assign permissions to a role
   async assignPermissions(roleId, permissionNames) {
      const role = await Role.findById(roleId);
      if (!role) {
         throw new Error("Role not found");
      }

      const permissions = await Permission.find({ name: { $in: permissionNames } });
      role.permissions = permissions.map((p) => p._id);

      await role.save();
      return role.populate("permissions");
   }

   // Get the role matrix (all roles and their permissions)
   async getRoleMatrix() {
      const roles = await Role.find().populate("permissions");
      const allPermissions = await Permission.find();

      const matrix = roles.map((role) => ({
         role: role.name,
         permissions: allPermissions.map((p) => ({
            name: p.name,
            hasPermission: role.permissions.some((rp) => rp.name === p.name),
         })),
      }));

      return matrix;
   }
}

const roleService = new RoleService();
export default roleService;
