// models/Tag.js
import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         trim: true,
         maxlength: 50,
      },
      slug: {
         type: String,
         required: true,
         unique: true,
         trim: true,
         lowercase: true,
      },
      description: {
         type: String,
         trim: true,
         maxlength: 200,
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      color: {
         type: String,
         default: "#3B82F6",
         validate: {
            validator: function (v) {
               return /^#[0-9A-F]{6}$/i.test(v);
            },
            message: "Color must be a valid hex color code",
         },
      },
      category: {
         type: String,
         enum: ["product", "customer", "order", "inventory", "general"],
         default: "general",
      },
      usageCount: {
         type: Number,
         default: 0,
         min: 0,
      },
      isActive: {
         type: Boolean,
         default: true,
      },
      isSystemTag: {
         type: Boolean,
         default: false,
      },
      parent: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Tag",
      },
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      updatedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
tagSchema.index({ name: 1 });
tagSchema.index({ organization: 1 });
tagSchema.index({ category: 1 });
tagSchema.index({ isActive: 1 });
tagSchema.index({ isSystemTag: 1 });
tagSchema.index({ parent: 1 });
tagSchema.index({ usageCount: -1 });

// Compound indexes
tagSchema.index({ organization: 1, name: 1 }, { unique: true });
tagSchema.index({ organization: 1, slug: 1 }, { unique: true });
tagSchema.index({ organization: 1, category: 1 });
tagSchema.index({ organization: 1, isActive: 1 });

// Virtuals
tagSchema.virtual("fullPath").get(async function () {
   const path = [this.name];
   let current = this;

   while (current.parent) {
      const parent = await mongoose.model("Tag").findById(current.parent);
      if (!parent) break;
      path.unshift(parent.name);
      current = parent;
   }

   return path.join(" > ");
});

tagSchema.virtual("children", {
   ref: "Tag",
   localField: "_id",
   foreignField: "parent",
});

// Pre-save middleware
tagSchema.pre("save", function (next) {
   if (this.isModified("name")) {
      // Generate slug from name
      this.slug = this.name
         .toLowerCase()
         .replace(/[^a-z0-9]+/g, "-")
         .replace(/^-+|-+$/g, "");
   }
   next();
});

// Instance methods
tagSchema.methods.incrementUsage = function () {
   this.usageCount += 1;
   return this.save();
};

tagSchema.methods.decrementUsage = function () {
   this.usageCount = Math.max(0, this.usageCount - 1);
   return this.save();
};

tagSchema.methods.getHierarchyLevel = async function () {
   let level = 0;
   let current = this;

   while (current.parent) {
      const parent = await mongoose.model("Tag").findById(current.parent);
      if (!parent) break;
      level++;
      current = parent;
   }

   return level;
};

tagSchema.methods.getAncestors = async function () {
   const ancestors = [];
   let current = this;

   while (current.parent) {
      const parent = await mongoose.model("Tag").findById(current.parent);
      if (!parent) break;
      ancestors.unshift(parent);
      current = parent;
   }

   return ancestors;
};

tagSchema.methods.getDescendants = async function () {
   const descendants = [];
   const queue = [this._id];

   while (queue.length > 0) {
      const currentId = queue.shift();
      const children = await mongoose.model("Tag").find({ parent: currentId });

      for (const child of children) {
         descendants.push(child);
         queue.push(child._id);
      }
   }

   return descendants;
};

tagSchema.methods.moveTo = function (newParentId) {
   this.parent = newParentId;
   return this.save();
};

// Static methods
tagSchema.statics.findBySlug = function (slug, organizationId) {
   return this.findOne({
      slug: slug.toLowerCase(),
      organization: organizationId,
      isActive: true,
   });
};

tagSchema.statics.findByCategory = function (category, organizationId) {
   return this.find({
      category: category,
      organization: organizationId,
      isActive: true,
   }).sort({ usageCount: -1, name: 1 });
};

tagSchema.statics.findRootTags = function (organizationId) {
   return this.find({
      organization: organizationId,
      parent: null,
      isActive: true,
   }).sort({ usageCount: -1, name: 1 });
};

tagSchema.statics.findSubTags = function (parentId) {
   return this.find({
      parent: parentId,
      isActive: true,
   }).sort({ usageCount: -1, name: 1 });
};

tagSchema.statics.findPopularTags = function (organizationId, limit = 10) {
   return this.find({
      organization: organizationId,
      isActive: true,
      usageCount: { $gt: 0 },
   })
      .sort({ usageCount: -1 })
      .limit(limit);
};

tagSchema.statics.findUnusedTags = function (organizationId) {
   return this.find({
      organization: organizationId,
      isActive: true,
      usageCount: 0,
   }).sort({ createdAt: -1 });
};

tagSchema.statics.searchTags = function (query, organizationId) {
   return this.find({
      organization: organizationId,
      isActive: true,
      $or: [{ name: new RegExp(query, "i") }, { description: new RegExp(query, "i") }],
   }).sort({ usageCount: -1, name: 1 });
};

tagSchema.statics.cleanupUnused = function (organizationId, daysOld = 90) {
   const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

   return this.deleteMany({
      organization: organizationId,
      usageCount: 0,
      createdAt: { $lt: cutoffDate },
      isSystemTag: false,
   });
};

const Tag = mongoose.model("Tag", tagSchema);

export default Tag;
