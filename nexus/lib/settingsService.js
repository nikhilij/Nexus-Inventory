// lib/settingsService.js
import { dbConnect } from "./dbConnect";
import { Setting } from "../models/index";

/**
 * Service for application settings management
 */
export const settingsService = {
   /**
    * Get all application settings
    * @returns {Promise<Object>} - Settings object
    */
   async getSettings() {
      await dbConnect();

      // Get all setting documents
      const settings = await Setting.find();

      // Convert to a key-value object
      const settingsObject = {};
      settings.forEach((setting) => {
         settingsObject[setting.key] = setting.value;
      });

      return settingsObject;
   },

   /**
    * Get a specific setting by key
    * @param {String} key - Setting key
    * @param {*} defaultValue - Default value if setting not found
    * @returns {Promise<*>} - Setting value
    */
   async getSetting(key, defaultValue = null) {
      await dbConnect();

      const setting = await Setting.findOne({ key });
      return setting ? setting.value : defaultValue;
   },

   /**
    * Update application settings
    * @param {Object} settings - Settings object with key-value pairs
    * @returns {Promise<Object>} - Updated settings object
    */
   async updateSettings(settings) {
      await dbConnect();

      const updates = [];
      const settingsObject = {};

      // Process each setting
      for (const [key, value] of Object.entries(settings)) {
         // Upsert setting
         const update = Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });

         updates.push(update);
      }

      // Wait for all updates to complete
      const updatedSettings = await Promise.all(updates);

      // Convert to key-value object
      updatedSettings.forEach((setting) => {
         settingsObject[setting.key] = setting.value;
      });

      return settingsObject;
   },

   /**
    * Delete a setting
    * @param {String} key - Setting key
    * @returns {Promise<Boolean>} - Success status
    */
   async deleteSetting(key) {
      await dbConnect();

      const result = await Setting.findOneAndDelete({ key });
      return !!result;
   },

   /**
    * Get system defaults for essential settings
    * @returns {Object} - Default settings
    */
   getDefaults() {
      return {
         siteName: "Nexus Inventory",
         companyName: "Nexus Technologies",
         currency: "USD",
         dateFormat: "MM/DD/YYYY",
         timeZone: "UTC",
         lowStockThreshold: 10,
         enableEmailNotifications: true,
         theme: "light",
         itemsPerPage: 10,
      };
   },
};
