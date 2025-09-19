// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         trim: true,
      },
      email: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         trim: true,
      },
      password: {
         type: String,
         required: true,
      },
      status: {
         type: String,
         enum: ["active", "inactive", "suspended"],
         default: "active",
      },
      role: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Role",
         required: true,
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
      },
      teams: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
         },
      ],
      profile: {
         avatar: String,
         phone: String,
         department: String,
         jobTitle: String,
      },
      preferences: {
         theme: {
            type: String,
            enum: ["light", "dark", "auto"],
            default: "auto",
         },
         notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
         },
      },
      lastLogin: Date,
      emailVerified: {
         type: Boolean,
         default: false,
      },
      emailVerificationToken: String,
      passwordResetToken: String,
      passwordResetExpires: Date,
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ organization: 1 });
userSchema.index({ status: 1 });
userSchema.index({ "preferences.theme": 1 });

// Virtual for full name (if we want to split first/last later)
userSchema.virtual("fullName").get(function () {
   return this.name;
});

// Instance methods
userSchema.methods.isActive = function () {
   return this.status === "active";
};

userSchema.methods.isAdmin = function () {
   return this.role && this.role.name === "admin";
};

// Static methods
userSchema.statics.findByEmail = function (email) {
   return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function () {
   return this.find({ status: "active" });
};

const User = mongoose.model("User", userSchema);

export default User;
