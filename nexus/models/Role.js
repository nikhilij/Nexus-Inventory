// models/Role.js
import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         unique: true,
         trim: true,
         lowercase: true,
      },
      description: {
         type: String,
         trim: true,
      },
      permissions: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Permission",
         },
      ],
      isSystemRole: {
         type: Boolean,
         default: false,
      },
      isDefault: {
         type: Boolean,
         default: false,
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ organization: 1 });
roleSchema.index({ isSystemRole: 1 });

// Virtual for user count
roleSchema.virtual("userCount", {
   ref: "User",
   localField: "_id",
   foreignField: "role",
   count: true,
});

// Instance methods
roleSchema.methods.hasPermission = function (permissionName) {
   return this.permissions.some((perm) => perm.name === permissionName || perm.code === permissionName);
};

roleSchema.methods.addPermission = function (permissionId) {
   if (!this.permissions.includes(permissionId)) {
      this.permissions.push(permissionId);
   }
   return this.save();
};

roleSchema.methods.removePermission = function (permissionId) {
   this.permissions = this.permissions.filter((id) => !id.equals(permissionId));
   return this.save();
};

// Static methods
roleSchema.statics.findByName = function (name) {
   return this.findOne({ name: name.toLowerCase() });
};

roleSchema.statics.findSystemRoles = function () {
   return this.find({ isSystemRole: true });
};

roleSchema.statics.findDefaultRole = function () {
   return this.findOne({ isDefault: true });
};

const Role = mongoose.model("Role", roleSchema);

export default Role;
