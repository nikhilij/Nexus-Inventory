// models/Session.js
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
   {
      sid: {
         type: String,
         required: true,
         unique: true,
         trim: true,
      },
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
      },
      data: {
         type: mongoose.Schema.Types.Mixed,
         default: {},
      },
      expires: {
         type: Date,
         required: true,
         default: function () {
            return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
         },
      },
      ipAddress: {
         type: String,
         trim: true,
      },
      userAgent: {
         type: String,
         trim: true,
      },
      deviceInfo: {
         type: {
            type: String,
            enum: ["desktop", "mobile", "tablet"],
            default: "desktop",
         },
         os: String,
         browser: String,
         platform: String,
      },
      location: {
         country: String,
         region: String,
         city: String,
         timezone: String,
      },
      isActive: {
         type: Boolean,
         default: true,
      },
      lastActivity: {
         type: Date,
         default: Date.now,
      },
      loginMethod: {
         type: String,
         enum: ["password", "google", "github", "microsoft", "api_key"],
         default: "password",
      },
      sessionType: {
         type: String,
         enum: ["web", "api", "mobile"],
         default: "web",
      },
      refreshToken: {
         type: String,
         trim: true,
      },
      refreshTokenExpires: Date,
      accessTokenCount: {
         type: Number,
         default: 0,
         min: 0,
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
sessionSchema.index({ sid: 1 });
sessionSchema.index({ user: 1 });
sessionSchema.index({ organization: 1 });
sessionSchema.index({ expires: 1 });
sessionSchema.index({ isActive: 1 });
sessionSchema.index({ lastActivity: 1 });
sessionSchema.index({ refreshToken: 1 });

// Compound indexes
sessionSchema.index({ user: 1, isActive: 1 });
sessionSchema.index({ organization: 1, expires: 1 });
sessionSchema.index({ user: 1, sessionType: 1 });

// Virtuals
sessionSchema.virtual("isExpired").get(function () {
   return this.expires < new Date();
});

sessionSchema.virtual("isValid").get(function () {
   return this.isActive && !this.isExpired;
});

sessionSchema.virtual("timeUntilExpiry").get(function () {
   if (this.isExpired) return 0;
   const diffTime = this.expires - new Date();
   return Math.ceil(diffTime / (1000 * 60)); // minutes
});

sessionSchema.virtual("daysSinceLastActivity").get(function () {
   const diffTime = new Date() - this.lastActivity;
   return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
sessionSchema.pre("save", function (next) {
   if (this.isModified()) {
      this.lastActivity = new Date();
   }
   next();
});

// Instance methods
sessionSchema.methods.extend = function (minutes = 60) {
   this.expires = new Date(Date.now() + minutes * 60 * 1000);
   return this.save();
};

sessionSchema.methods.touch = function () {
   this.lastActivity = new Date();
   return this.save();
};

sessionSchema.methods.invalidate = function () {
   this.isActive = false;
   return this.save();
};

sessionSchema.methods.generateRefreshToken = function () {
   const crypto = require("crypto");
   this.refreshToken = crypto.randomBytes(64).toString("hex");
   this.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
   return this.save();
};

sessionSchema.methods.isRefreshTokenValid = function () {
   return this.refreshToken && this.refreshTokenExpires && this.refreshTokenExpires > new Date();
};

// Static methods
sessionSchema.statics.findActiveSessions = function (userId) {
   return this.find({
      user: userId,
      isActive: true,
      expires: { $gt: new Date() },
   }).sort({ lastActivity: -1 });
};

sessionSchema.statics.findExpiredSessions = function () {
   return this.find({
      expires: { $lt: new Date() },
   });
};

sessionSchema.statics.invalidateUserSessions = function (userId, exceptSessionId = null) {
   const query = { user: userId };
   if (exceptSessionId) {
      query.sid = { $ne: exceptSessionId };
   }
   return this.updateMany(query, { isActive: false });
};

sessionSchema.statics.invalidateOrganizationSessions = function (organizationId) {
   return this.updateMany({ organization: organizationId }, { isActive: false });
};

sessionSchema.statics.cleanupExpired = function () {
   return this.deleteMany({
      $or: [{ expires: { $lt: new Date() } }, { isActive: false }],
   });
};

sessionSchema.statics.findByRefreshToken = function (refreshToken) {
   return this.findOne({
      refreshToken: refreshToken,
      isActive: true,
      refreshTokenExpires: { $gt: new Date() },
   });
};

sessionSchema.statics.getSessionStats = async function (userId) {
   const stats = await this.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId), isActive: true } },
      {
         $group: {
            _id: "$sessionType",
            count: { $sum: 1 },
            lastActivity: { $max: "$lastActivity" },
         },
      },
   ]);

   return stats;
};

const Session = mongoose.model("Session", sessionSchema);

export default Session;
