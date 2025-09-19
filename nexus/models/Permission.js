// models/Permission.js
import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         unique: true,
         trim: true,
      },
      code: {
         type: String,
         required: true,
         unique: true,
         trim: true,
         uppercase: true,
      },
      description: {
         type: String,
         trim: true,
      },
      resource: {
         type: String,
         required: true,
         trim: true,
      },
      action: {
         type: String,
         required: true,
         enum: ["create", "read", "update", "delete", "manage"],
         trim: true,
      },
      isSystemPermission: {
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
permissionSchema.index({ code: 1 });
permissionSchema.index({ resource: 1, action: 1 });
permissionSchema.index({ organization: 1 });
permissionSchema.index({ isSystemPermission: 1 });

// Compound index for efficient lookups
permissionSchema.index({ resource: 1, action: 1, organization: 1 });

// Virtual for full permission string (resource:action)
permissionSchema.virtual("permissionString").get(function () {
   return `${this.resource}:${this.action}`;
});

// Instance methods
permissionSchema.methods.matches = function (resource, action) {
   return this.resource === resource && this.action === action;
};

permissionSchema.methods.isManagePermission = function () {
   return this.action === "manage";
};

// Static methods
permissionSchema.statics.findByCode = function (code) {
   return this.findOne({ code: code.toUpperCase() });
};

permissionSchema.statics.findByResource = function (resource) {
   return this.find({ resource });
};

permissionSchema.statics.findSystemPermissions = function () {
   return this.find({ isSystemPermission: true });
};

permissionSchema.statics.findByResourceAndAction = function (resource, action) {
   return this.findOne({ resource, action });
};

const Permission = mongoose.model("Permission", permissionSchema);

export default Permission;
