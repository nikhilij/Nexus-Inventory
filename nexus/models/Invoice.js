// models/Invoice.js
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
   {
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      invoiceNumber: {
         type: String,
         required: true,
         unique: true,
         trim: true,
         uppercase: true,
      },
      order: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Order",
      },
      customer: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      billingAddress: {
         street: String,
         city: String,
         state: String,
         zipCode: String,
         country: {
            type: String,
            default: "US",
         },
      },
      status: {
         type: String,
         enum: ["draft", "sent", "viewed", "paid", "overdue", "cancelled", "refunded"],
         default: "draft",
      },
      type: {
         type: String,
         enum: ["standard", "recurring", "credit_note", "debit_note"],
         default: "standard",
      },
      currency: {
         type: String,
         default: "USD",
         trim: true,
         uppercase: true,
      },
      subtotal: {
         type: Number,
         required: true,
         min: [0, "Subtotal cannot be negative"],
      },
      taxRate: {
         type: Number,
         default: 0,
         min: [0, "Tax rate cannot be negative"],
         max: [100, "Tax rate cannot exceed 100%"],
      },
      taxAmount: {
         type: Number,
         default: 0,
         min: [0, "Tax amount cannot be negative"],
      },
      discountAmount: {
         type: Number,
         default: 0,
         min: [0, "Discount amount cannot be negative"],
      },
      shippingAmount: {
         type: Number,
         default: 0,
         min: [0, "Shipping amount cannot be negative"],
      },
      totalAmount: {
         type: Number,
         required: true,
         min: [0, "Total amount cannot be negative"],
      },
      amountPaid: {
         type: Number,
         default: 0,
         min: [0, "Amount paid cannot be negative"],
      },
      amountDue: {
         type: Number,
         min: [0, "Amount due cannot be negative"],
      },
      issueDate: {
         type: Date,
         default: Date.now,
      },
      dueDate: {
         type: Date,
         required: true,
      },
      paidDate: Date,
      sentDate: Date,
      viewedDate: Date,
      lastReminderDate: Date,
      paymentTerms: {
         type: String,
         enum: ["net_15", "net_30", "net_45", "net_60", "due_on_receipt", "cod"],
         default: "net_30",
      },
      paymentMethod: {
         type: String,
         enum: ["bank_transfer", "credit_card", "paypal", "check", "cash", "other"],
      },
      notes: String,
      terms: String,
      lineItems: [
         {
            product: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "Product",
            },
            description: {
               type: String,
               required: true,
               trim: true,
            },
            quantity: {
               type: Number,
               required: true,
               min: [1, "Quantity must be at least 1"],
            },
            unitPrice: {
               type: Number,
               required: true,
               min: [0, "Unit price cannot be negative"],
            },
            discount: {
               type: Number,
               default: 0,
               min: [0, "Discount cannot be negative"],
               max: [100, "Discount cannot exceed 100%"],
            },
            taxRate: {
               type: Number,
               default: 0,
               min: [0, "Tax rate cannot be negative"],
               max: [100, "Tax rate cannot exceed 100%"],
            },
            lineTotal: {
               type: Number,
               required: true,
               min: [0, "Line total cannot be negative"],
            },
         },
      ],
      reminders: [
         {
            sentAt: {
               type: Date,
               default: Date.now,
            },
            type: {
               type: String,
               enum: ["email", "sms", "letter"],
               default: "email",
            },
            status: {
               type: String,
               enum: ["sent", "delivered", "failed"],
               default: "sent",
            },
            notes: String,
         },
      ],
      attachments: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Attachment",
         },
      ],
      customFields: {
         type: Map,
         of: mongoose.Schema.Types.Mixed,
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
invoiceSchema.index({ organization: 1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ order: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ type: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ issueDate: -1 });
invoiceSchema.index({ totalAmount: -1 });
invoiceSchema.index({ amountDue: -1 });

// Compound indexes
invoiceSchema.index({ organization: 1, status: 1 });
invoiceSchema.index({ organization: 1, customer: 1 });
invoiceSchema.index({ organization: 1, dueDate: 1 });
invoiceSchema.index({ organization: 1, issueDate: -1 });
invoiceSchema.index({ customer: 1, status: 1 });
invoiceSchema.index({ organization: 1, invoiceNumber: 1 }, { unique: true });

// Virtuals
invoiceSchema.virtual("isPaid").get(function () {
   return this.amountPaid >= this.totalAmount;
});

invoiceSchema.virtual("isOverdue").get(function () {
   return this.status !== "paid" && this.status !== "cancelled" && new Date() > this.dueDate;
});

invoiceSchema.virtual("daysOverdue").get(function () {
   if (!this.isOverdue) return 0;
   return Math.floor((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
});

invoiceSchema.virtual("paymentStatus").get(function () {
   if (this.isPaid) return "paid";
   if (this.amountPaid > 0) return "partial";
   if (this.isOverdue) return "overdue";
   return "unpaid";
});

invoiceSchema.virtual("formattedTotal").get(function () {
   return `${this.currency} ${this.totalAmount.toFixed(2)}`;
});

invoiceSchema.virtual("formattedAmountDue").get(function () {
   return `${this.currency} ${this.amountDue.toFixed(2)}`;
});

// Pre-save middleware
invoiceSchema.pre("save", function (next) {
   // Calculate amount due
   this.amountDue = this.totalAmount - this.amountPaid;

   // Update status based on payment
   if (this.isPaid && this.status !== "paid") {
      this.status = "paid";
      this.paidDate = new Date();
   } else if (this.isOverdue && this.status !== "overdue") {
      this.status = "overdue";
   }

   // Generate invoice number if not provided
   if (!this.invoiceNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      this.invoiceNumber = `INV-${year}${month}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
   }

   next();
});

// Instance methods
invoiceSchema.methods.markAsSent = function () {
   this.status = "sent";
   this.sentDate = new Date();
   return this.save();
};

invoiceSchema.methods.markAsViewed = function () {
   if (this.status === "sent") {
      this.status = "viewed";
      this.viewedDate = new Date();
   }
   return this.save();
};

invoiceSchema.methods.recordPayment = function (amount, paymentMethod, notes) {
   if (amount <= 0) {
      throw new Error("Payment amount must be positive");
   }

   this.amountPaid += amount;
   this.paymentMethod = paymentMethod;

   if (notes) {
      this.notes = this.notes ? `${this.notes}\nPayment: ${notes}` : `Payment: ${notes}`;
   }

   return this.save();
};

invoiceSchema.methods.sendReminder = function (type = "email", notes) {
   this.reminders.push({
      type: type,
      notes: notes,
      sentAt: new Date(),
   });

   this.lastReminderDate = new Date();
   return this.save();
};

invoiceSchema.methods.cancel = function (reason) {
   this.status = "cancelled";
   this.notes = this.notes ? `${this.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`;
   return this.save();
};

invoiceSchema.methods.refund = function (amount, reason) {
   if (amount <= 0) {
      throw new Error("Refund amount must be positive");
   }

   if (amount > this.amountPaid) {
      throw new Error("Cannot refund more than paid amount");
   }

   this.amountPaid -= amount;
   this.status = "refunded";
   this.notes = this.notes ? `${this.notes}\nRefunded ${amount}: ${reason}` : `Refunded ${amount}: ${reason}`;

   return this.save();
};

invoiceSchema.methods.addLineItem = function (lineItemData) {
   // Calculate line total
   const lineTotal = lineItemData.quantity * lineItemData.unitPrice;
   const discountAmount = lineTotal * (lineItemData.discount / 100);
   const taxableAmount = lineTotal - discountAmount;
   const taxAmount = taxableAmount * (lineItemData.taxRate / 100);

   this.lineItems.push({
      ...lineItemData,
      lineTotal: lineTotal - discountAmount + taxAmount,
   });

   // Recalculate totals
   this.recalculateTotals();
   return this.save();
};

invoiceSchema.methods.recalculateTotals = function () {
   let subtotal = 0;
   let totalTax = 0;
   let totalDiscount = 0;

   this.lineItems.forEach((item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineDiscount = lineSubtotal * (item.discount / 100);
      const taxableAmount = lineSubtotal - lineDiscount;
      const lineTax = taxableAmount * (item.taxRate / 100);

      subtotal += lineSubtotal;
      totalDiscount += lineDiscount;
      totalTax += lineTax;
   });

   this.subtotal = subtotal;
   this.discountAmount = totalDiscount;
   this.taxAmount = totalTax;
   this.totalAmount = subtotal - totalDiscount + totalTax + this.shippingAmount;
   this.amountDue = this.totalAmount - this.amountPaid;
};

// Static methods
invoiceSchema.statics.findByCustomer = function (customerId, organizationId) {
   return this.find({
      customer: customerId,
      organization: organizationId,
   })
      .populate("order", "orderNumber")
      .populate("createdBy", "name email")
      .sort({ issueDate: -1 });
};

invoiceSchema.statics.findOverdue = function (organizationId) {
   return this.find({
      organization: organizationId,
      status: { $ne: "paid" },
      dueDate: { $lt: new Date() },
   })
      .populate("customer", "name email")
      .populate("order", "orderNumber")
      .sort({ dueDate: 1 });
};

invoiceSchema.statics.findUnpaid = function (organizationId) {
   return this.find({
      organization: organizationId,
      amountDue: { $gt: 0 },
   })
      .populate("customer", "name email")
      .sort({ dueDate: 1 });
};

invoiceSchema.statics.getInvoiceStats = async function (organizationId, startDate, endDate) {
   const matchStage = { organization: mongoose.Types.ObjectId(organizationId) };

   if (startDate && endDate) {
      matchStage.issueDate = {
         $gte: new Date(startDate),
         $lte: new Date(endDate),
      };
   }

   const stats = await this.aggregate([
      { $match: matchStage },
      {
         $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
            totalPaid: { $sum: "$amountPaid" },
            totalDue: { $sum: "$amountDue" },
            paidCount: {
               $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
            },
            overdueCount: {
               $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] },
            },
            draftCount: {
               $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
            },
            sentCount: {
               $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] },
            },
         },
      },
   ]);

   const result = stats[0] || {
      totalInvoices: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalDue: 0,
      paidCount: 0,
      overdueCount: 0,
      draftCount: 0,
      sentCount: 0,
   };

   result.paymentRate = result.totalAmount > 0 ? (result.totalPaid / result.totalAmount) * 100 : 0;

   return result;
};

invoiceSchema.statics.generateInvoiceNumber = async function (organizationId) {
   const date = new Date();
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, "0");

   // Find the latest invoice number for this month
   const latestInvoice = await this.findOne({
      organization: organizationId,
      invoiceNumber: new RegExp(`^INV-${year}${month}`),
   }).sort({ invoiceNumber: -1 });

   let sequence = 1;
   if (latestInvoice) {
      const lastSequence = parseInt(latestInvoice.invoiceNumber.split("-")[2]);
      sequence = lastSequence + 1;
   }

   return `INV-${year}${month}-${String(sequence).padStart(4, "0")}`;
};

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
