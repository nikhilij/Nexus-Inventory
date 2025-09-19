// lib/notificationService.js
import { dbConnect } from "./dbConnect";
import { Notification, User } from "../models/index";

/**
 * Service for notification management operations
 */
export const notificationService = {
   /**
    * Get notifications for a specific user
    * @param {String} userId - User ID
    * @param {Object} options - Query options
    * @param {Number} options.page - Page number (starts at 1)
    * @param {Number} options.limit - Number of notifications per page
    * @param {Boolean} options.unreadOnly - Whether to return only unread notifications
    * @returns {Promise<Object>} - Notifications and pagination metadata
    */
   async getUserNotifications({ userId, page = 1, limit = 10, unreadOnly = false } = {}) {
      await dbConnect();

      const skip = (page - 1) * limit;
      const filter = { user: userId };

      if (unreadOnly) {
         filter.read = false;
      }

      const countPromise = Notification.countDocuments(filter);
      const notificationsPromise = Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

      const [total, notifications] = await Promise.all([countPromise, notificationsPromise]);

      return {
         notifications,
         pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
         },
      };
   },

   /**
    * Get a notification by ID
    * @param {String} id - Notification ID
    * @returns {Promise<Object>} - Notification document
    */
   async getNotificationById(id) {
      await dbConnect();
      return Notification.findById(id);
   },

   /**
    * Create a new notification
    * @param {Object} notificationData - Notification data
    * @returns {Promise<Object>} - Created notification
    */
   async createNotification(notificationData) {
      await dbConnect();

      const notification = new Notification(notificationData);
      await notification.save();

      return notification;
   },

   /**
    * Mark notifications as read
    * @param {String} userId - User ID
    * @param {Array<String>} notificationIds - Notification IDs to mark as read
    * @returns {Promise<Number>} - Number of updated notifications
    */
   async markAsRead(userId, notificationIds) {
      await dbConnect();

      const filter = { user: userId };

      if (notificationIds && notificationIds.length > 0) {
         filter._id = { $in: notificationIds };
      }

      const result = await Notification.updateMany(filter, { $set: { read: true } });
      return result.modifiedCount;
   },

   /**
    * Delete notifications
    * @param {String} userId - User ID
    * @param {Array<String>} notificationIds - Notification IDs to delete
    * @returns {Promise<Number>} - Number of deleted notifications
    */
   async deleteNotifications(userId, notificationIds) {
      await dbConnect();

      const filter = { user: userId };

      if (notificationIds && notificationIds.length > 0) {
         filter._id = { $in: notificationIds };
      }

      const result = await Notification.deleteMany(filter);
      return result.deletedCount;
   },

   /**
    * Get unread notification count for a user
    * @param {String} userId - User ID
    * @returns {Promise<Number>} - Number of unread notifications
    */
   async getUnreadCount(userId) {
      await dbConnect();
      return Notification.countDocuments({ user: userId, read: false });
   },

   /**
    * Create a system notification for all users or specific roles
    * @param {Object} data - Notification data
    * @param {String} data.title - Notification title
    * @param {String} data.message - Notification message
    * @param {String} data.type - Notification type (info, warning, error, success)
    * @param {Array<String>} [data.roles] - User roles to target (if omitted, targets all users)
    * @returns {Promise<Number>} - Number of notifications created
    */
   async createSystemNotification({ title, message, type = "info", roles = [] } = {}) {
      await dbConnect();

      // Find users to notify
      const filter = {};
      if (roles && roles.length > 0) {
         filter.roles = { $in: roles };
      }

      const users = await User.find(filter).select("_id");

      // Create notifications for each user
      const notifications = users.map((user) => ({
         user: user._id,
         title,
         message,
         type,
         isSystem: true,
         read: false,
         createdAt: new Date(),
      }));

      if (notifications.length > 0) {
         const result = await Notification.insertMany(notifications);
         return result.length;
      }

      return 0;
   },
};
