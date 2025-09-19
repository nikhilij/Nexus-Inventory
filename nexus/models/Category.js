// models/Category.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         trim: true,
      },
      description: {
         type: String,
         trim: true,
      },
      parent: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Category",
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      image: {
         type: String, // URL to category image
         trim: true,
      },
      color: {
         type: String,
         trim: true,
         default: "#3B82F6", // Default blue color
      },
      isActive: {
         type: Boolean,
         default: true,
      },
      sortOrder: {
         type: Number,
         default: 0,
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
categorySchema.index({ name: 1 });
categorySchema.index({ organization: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });

// Compound indexes
categorySchema.index({ organization: 1, name: 1 }, { unique: true });
categorySchema.index({ organization: 1, parent: 1 });

// Virtuals
categorySchema.virtual("subcategories", {
   ref: "Category",
   localField: "_id",
   foreignField: "parent",
});

categorySchema.virtual("productCount", {
   ref: "Product",
   localField: "_id",
   foreignField: "category",
   count: true,
});

categorySchema.virtual("fullPath").get(async function () {
   const path = [this.name];
   let current = this;

   while (current.parent) {
      const parent = await mongoose.model("Category").findById(current.parent);
      if (!parent) break;
      path.unshift(parent.name);
      current = parent;
   }

   return path.join(" > ");
});

// Instance methods
categorySchema.methods.getAncestors = async function () {
   const ancestors = [];
   let current = this;

   while (current.parent) {
      const parent = await mongoose.model("Category").findById(current.parent);
      if (!parent) break;
      ancestors.unshift(parent);
      current = parent;
   }

   return ancestors;
};

categorySchema.methods.getDescendants = async function () {
   const descendants = [];
   const queue = [this._id];

   while (queue.length > 0) {
      const currentId = queue.shift();
      const children = await mongoose.model("Category").find({ parent: currentId });

      for (const child of children) {
         descendants.push(child);
         queue.push(child._id);
      }
   }

   return descendants;
};

categorySchema.methods.moveTo = function (newParentId) {
   this.parent = newParentId;
   return this.save();
};

// Static methods
categorySchema.statics.findByOrganization = function (organizationId) {
   return this.find({ organization: organizationId, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

categorySchema.statics.findRootCategories = function (organizationId) {
   return this.find({
      organization: organizationId,
      parent: null,
      isActive: true,
   }).sort({ sortOrder: 1, name: 1 });
};

categorySchema.statics.findSubcategories = function (parentId) {
   return this.find({ parent: parentId, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

categorySchema.statics.findByName = function (name, organizationId) {
   return this.findOne({
      name: new RegExp(name, "i"),
      organization: organizationId,
      isActive: true,
   });
};

const Category = mongoose.model("Category", categorySchema);

export default Category;
