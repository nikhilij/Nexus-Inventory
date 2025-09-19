// services/UserService.js
import { User, Role, Invitation } from "../models/index.js";
import * as NotificationService from "./NotificationService.js";
import crypto from "crypto";

class UserService {
   // Create a new user
   async createUser(userData) {
      const { email, password, firstName, lastName, role } = userData;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
         throw new Error("User with this email already exists");
      }

      const user = new User({ email, password, firstName, lastName });

      if (role) {
         const userRole = await Role.findOne({ name: role });
         if (userRole) {
            user.role = userRole._id;
         }
      }

      await user.save();
      return user;
   }

   // Update user details
   async updateUser(userId, updateData) {
      const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
      if (!user) {
         throw new Error("User not found");
      }
      return user;
   }

   // Search for users
   async searchUsers(query, options = { page: 1, limit: 10 }) {
      const { page, limit } = options;
      const skip = (page - 1) * limit;

      const users = await User.find(query).skip(skip).limit(limit).populate("role");
      const total = await User.countDocuments(query);

      return { users, total, page, pages: Math.ceil(total / limit) };
   }

   // Deactivate a user account
   async deactivateUser(userId) {
      const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
      if (!user) {
         throw new Error("User not found");
      }
      // Optionally, revoke all sessions
      // await Session.deleteMany({ user: userId });
      return { message: "User deactivated successfully" };
   }

   // Manage user roles
   async manageUserRoles(userId, roleNames) {
      const user = await User.findById(userId);
      if (!user) {
         throw new Error("User not found");
      }

      const roles = await Role.find({ name: { $in: roleNames } });
      user.role = roles.map((r) => r._id);

      await user.save();
      return user.populate("role");
   }

   // Invite a new user
   async inviteUser(inviterId, inviteeEmail, roleName) {
      const inviter = await User.findById(inviterId);
      if (!inviter) {
         throw new Error("Inviter not found");
      }

      const existingUser = await User.findOne({ email: inviteeEmail });
      if (existingUser) {
         throw new Error("User with this email already exists");
      }

      const role = await Role.findOne({ name: roleName });
      if (!role) {
         throw new Error("Role not found");
      }

      const invitationToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = new Invitation({
         invitedBy: inviterId,
         email: inviteeEmail,
         role: role._id,
         token: invitationToken,
         expiresAt,
      });

      await invitation.save();

      // Send invitation email
      const invitationUrl = `${process.env.CLIENT_URL}/accept-invitation?token=${invitationToken}`;
      await NotificationService.sendEmail({
         to: inviteeEmail,
         subject: `You have been invited to join ${inviter.organization?.name || "Nexus Inventory"}`,
         template: "user-invitation",
         context: { inviter, invitationUrl, roleName },
      });

      return { message: "Invitation sent successfully" };
   }
}

const userService = new UserService();
export default userService;
