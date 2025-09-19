// models/Attachment.js
import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
   {
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      name: {
         type: String,
         required: true,
         trim: true,
         maxlength: 255,
      },
      originalName: {
         type: String,
         required: true,
         trim: true,
      },
      fileName: {
         type: String,
         required: true,
         trim: true,
      },
      url: {
         type: String,
         required: true,
         trim: true,
         validate: {
            validator: function (v) {
               return /^https?:\/\/.+/.test(v);
            },
            message: "URL must be a valid HTTP/HTTPS URL",
         },
      },
      fileType: {
         type: String,
         required: true,
         trim: true,
         enum: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
            "text/plain",
            "application/zip",
            "application/x-zip-compressed",
         ],
      },
      mimeType: {
         type: String,
         required: true,
         trim: true,
      },
      size: {
         type: Number,
         required: true,
         min: [0, "File size cannot be negative"],
         max: [50 * 1024 * 1024, "File size cannot exceed 50MB"], // 50MB limit
      },
      extension: {
         type: String,
         required: true,
         trim: true,
         lowercase: true,
      },
      resourceType: {
         type: String,
         required: true,
         enum: ["product", "order", "supplier", "warehouse", "user", "organization", "invoice", "report", "other"],
      },
      resourceId: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
      },
      category: {
         type: String,
         enum: ["image", "document", "spreadsheet", "archive", "other"],
         default: "other",
      },
      description: {
         type: String,
         trim: true,
         maxlength: 500,
      },
      tags: [
         {
            type: String,
            trim: true,
            lowercase: true,
         },
      ],
      metadata: {
         type: Map,
         of: mongoose.Schema.Types.Mixed,
      },
      isPublic: {
         type: Boolean,
         default: false,
      },
      isPrimary: {
         type: Boolean,
         default: false,
      },
      uploadedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      downloadCount: {
         type: Number,
         default: 0,
         min: 0,
      },
      lastDownloadedAt: Date,
      expiresAt: Date,
      isExpired: {
         type: Boolean,
         default: false,
      },
      checksum: {
         type: String,
         trim: true,
      },
      storage: {
         provider: {
            type: String,
            enum: ["local", "s3", "azure", "gcs"],
            default: "local",
         },
         bucket: String,
         key: String,
         region: String,
         acl: {
            type: String,
            enum: ["private", "public-read", "public-read-write"],
            default: "private",
         },
      },
      versions: [
         {
            version: {
               type: Number,
               required: true,
            },
            url: {
               type: String,
               required: true,
            },
            size: {
               type: Number,
               required: true,
            },
            uploadedAt: {
               type: Date,
               default: Date.now,
            },
            uploadedBy: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "User",
               required: true,
            },
         },
      ],
      thumbnail: {
         url: String,
         width: Number,
         height: Number,
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
attachmentSchema.index({ organization: 1 });
attachmentSchema.index({ resourceType: 1 });
attachmentSchema.index({ resourceId: 1 });
attachmentSchema.index({ uploadedBy: 1 });
attachmentSchema.index({ fileType: 1 });
attachmentSchema.index({ category: 1 });
attachmentSchema.index({ isPublic: 1 });
attachmentSchema.index({ isExpired: 1 });
attachmentSchema.index({ expiresAt: 1 });
attachmentSchema.index({ createdAt: -1 });

// Compound indexes
attachmentSchema.index({ organization: 1, resourceType: 1, resourceId: 1 });
attachmentSchema.index({ organization: 1, uploadedBy: 1 });
attachmentSchema.index({ organization: 1, category: 1 });
attachmentSchema.index({ organization: 1, isExpired: 1 });
attachmentSchema.index({ resourceType: 1, resourceId: 1, isPrimary: 1 });

// Virtuals
attachmentSchema.virtual("isImage").get(function () {
   return this.fileType.startsWith("image/");
});

attachmentSchema.virtual("isDocument").get(function () {
   return [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
   ].includes(this.fileType);
});

attachmentSchema.virtual("isSpreadsheet").get(function () {
   return [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
   ].includes(this.fileType);
});

attachmentSchema.virtual("formattedSize").get(function () {
   const units = ["B", "KB", "MB", "GB"];
   let size = this.size;
   let unitIndex = 0;

   while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
   }

   return `${size.toFixed(1)} ${units[unitIndex]}`;
});

attachmentSchema.virtual("isExpiringSoon").get(function () {
   if (!this.expiresAt) return false;
   const now = new Date();
   const daysUntilExpiry = (this.expiresAt - now) / (1000 * 60 * 60 * 24);
   return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
});

attachmentSchema.virtual("currentVersion").get(function () {
   return this.versions.length > 0 ? Math.max(...this.versions.map((v) => v.version)) : 1;
});

// Pre-save middleware
attachmentSchema.pre("save", function (next) {
   // Set category based on file type
   if (this.fileType.startsWith("image/")) {
      this.category = "image";
   } else if (this.isDocument) {
      this.category = "document";
   } else if (this.isSpreadsheet) {
      this.category = "spreadsheet";
   } else if (this.fileType === "application/zip" || this.fileType === "application/x-zip-compressed") {
      this.category = "archive";
   }

   // Set extension from fileName if not provided
   if (!this.extension && this.fileName) {
      this.extension = this.fileName.split(".").pop().toLowerCase();
   }

   // Check if expired
   if (this.expiresAt && new Date() > this.expiresAt) {
      this.isExpired = true;
   }

   next();
});

// Instance methods
attachmentSchema.methods.download = function () {
   this.downloadCount += 1;
   this.lastDownloadedAt = new Date();
   return this.save();
};

attachmentSchema.methods.setAsPrimary = function () {
   return this.constructor
      .updateMany(
         {
            organization: this.organization,
            resourceType: this.resourceType,
            resourceId: this.resourceId,
            isPrimary: true,
         },
         { isPrimary: false }
      )
      .then(() => {
         this.isPrimary = true;
         return this.save();
      });
};

attachmentSchema.methods.addVersion = function (versionData) {
   const newVersion = {
      version: this.currentVersion + 1,
      ...versionData,
      uploadedAt: new Date(),
   };

   this.versions.push(newVersion);
   return this.save();
};

attachmentSchema.methods.getVersion = function (version) {
   return this.versions.find((v) => v.version === version);
};

attachmentSchema.methods.generateThumbnail = function (thumbnailData) {
   this.thumbnail = thumbnailData;
   return this.save();
};

attachmentSchema.methods.markExpired = function () {
   this.isExpired = true;
   return this.save();
};

attachmentSchema.methods.extendExpiry = function (days) {
   if (!this.expiresAt) {
      this.expiresAt = new Date();
   }

   this.expiresAt.setDate(this.expiresAt.getDate() + days);
   this.isExpired = false;
   return this.save();
};

// Static methods
attachmentSchema.statics.findByResource = function (resourceType, resourceId) {
   return this.find({
      resourceType: resourceType,
      resourceId: resourceId,
   })
      .populate("uploadedBy", "name email")
      .sort({ isPrimary: -1, createdAt: -1 });
};

attachmentSchema.statics.findByOrganization = function (organizationId, filters = {}) {
   const query = { organization: organizationId, ...filters };
   return this.find(query).populate("uploadedBy", "name email").sort({ createdAt: -1 });
};

attachmentSchema.statics.findImages = function (organizationId, resourceType = null, resourceId = null) {
   const query = {
      organization: organizationId,
      fileType: { $regex: "^image/" },
   };

   if (resourceType && resourceId) {
      query.resourceType = resourceType;
      query.resourceId = resourceId;
   }

   return this.find(query).populate("uploadedBy", "name email").sort({ createdAt: -1 });
};

attachmentSchema.statics.findExpiringSoon = function (organizationId) {
   const now = new Date();
   const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

   return this.find({
      organization: organizationId,
      expiresAt: {
         $gte: now,
         $lte: sevenDaysFromNow,
      },
      isExpired: false,
   })
      .populate("uploadedBy", "name email")
      .sort({ expiresAt: 1 });
};

attachmentSchema.statics.findExpired = function (organizationId) {
   return this.find({
      organization: organizationId,
      isExpired: true,
   })
      .populate("uploadedBy", "name email")
      .sort({ expiresAt: -1 });
};

attachmentSchema.statics.getStorageStats = async function (organizationId) {
   const stats = await this.aggregate([
      { $match: { organization: mongoose.Types.ObjectId(organizationId) } },
      {
         $group: {
            _id: null,
            totalFiles: { $sum: 1 },
            totalSize: { $sum: "$size" },
            byCategory: {
               $push: "$category",
            },
            byType: {
               $push: "$fileType",
            },
         },
      },
   ]);

   if (stats.length === 0) {
      return {
         totalFiles: 0,
         totalSize: 0,
         categories: {},
         types: {},
      };
   }

   const result = stats[0];

   // Count categories
   result.categories = result.byCategory.reduce((acc, category) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
   }, {});

   // Count file types
   result.types = result.byType.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
   }, {});

   delete result.byCategory;
   delete result.byType;

   return result;
};

attachmentSchema.statics.search = function (organizationId, searchTerm) {
   return this.find({
      organization: organizationId,
      $or: [
         { name: new RegExp(searchTerm, "i") },
         { originalName: new RegExp(searchTerm, "i") },
         { description: new RegExp(searchTerm, "i") },
         { tags: new RegExp(searchTerm, "i") },
      ],
   })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });
};

const Attachment = mongoose.model("Attachment", attachmentSchema);

export default Attachment;
