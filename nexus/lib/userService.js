// lib/userService.js
import { dbConnect } from "./dbConnect";
import { User } from "../models/index";

/**
 * Service for user management operations
 */
export const userService = {
   /**
    * Get all users with optional pagination
    * @param {Object} options - Pagination options
    * @param {Number} options.page - Page number (starts at 1)
    * @param {Number} options.limit - Number of users per page
    * @param {Object} options.filter - Filter criteria
    * @returns {Promise<Object>} - Users and pagination metadata
    */
   async getUsers({ page = 1, limit = 10, filter = {} } = {}) {
      await dbConnect();

      const skip = (page - 1) * limit;
      const countPromise = User.countDocuments(filter);
      const usersPromise = User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-password");

      const [total, users] = await Promise.all([countPromise, usersPromise]);

      return {
         users,
         pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
         },
      };
   },

   /**
    * Get a user by ID
    * @param {String} id - User ID
    * @returns {Promise<Object>} - User document
    */
   async getUserById(id) {
      await dbConnect();
      return User.findById(id).select("-password");
   },

   /**
    * Get a user by email
    * @param {String} email - User email
    * @returns {Promise<Object>} - User document
    */
   async getUserByEmail(email) {
      await dbConnect();
      return User.findOne({ email }).select("-password");
   },

   /**
    * Create a new user
    * @param {Object} userData - User data
    * @returns {Promise<Object>} - Created user
    */
   async createUser(userData) {
      await dbConnect();
      const user = new User(userData);
      await user.save();
      const userObject = user.toObject();
      delete userObject.password;
      return userObject;
   },

   /**
    * Update a user
    * @param {String} id - User ID
    * @param {Object} userData - Updated user data
    * @returns {Promise<Object>} - Updated user
    */
   async updateUser(id, userData) {
      await dbConnect();

      // Never update password through this method
      if (userData.password) {
         delete userData.password;
      }

      try {
         const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: userData },
            { new: true, runValidators: true, context: "query" }
         ).select("-password");

         return updatedUser;
      } catch (error) {
         console.error(
            "userService.updateUser error:",
            error && error.message,
            error && error.errors ? error.errors : error
         );
         throw error;
      }
   },

   /**
    * Delete a user
    * @param {String} id - User ID
    * @returns {Promise<Boolean>} - Success status
    */
   async deleteUser(id) {
      await dbConnect();
      const result = await User.findByIdAndDelete(id);
      return !!result;
   },

   /**
    * Change user password
    * @param {String} id - User ID
    * @param {String} newPassword - New password (already hashed)
    * @returns {Promise<Boolean>} - Success status
    */
   async changePassword(id, newPassword) {
      await dbConnect();
      const user = await User.findById(id);

      if (!user) {
         return false;
      }

      user.password = newPassword;
      await user.save();
      return true;
   },

   /**
    * Verify user's PIN
    * @param {String} userId - User ID
    * @param {String} pin - PIN to verify
    * @returns {Promise<Object>} - Result object with success status and message
    */
   async verifyPin(userId, pin) {
      await dbConnect();
      const user = await User.findById(userId);

      if (!user) {
         return { success: false, message: "User not found" };
      }

      if (!user.pin) {
         return { success: false, message: "PIN not set up", needsSetup: true };
      }

      // In a real app, use a proper comparison method that's timing-safe
      const isValid = user.pin === pin;

      return {
         success: isValid,
         message: isValid ? "PIN verified successfully" : "Invalid PIN",
      };
   },
};
