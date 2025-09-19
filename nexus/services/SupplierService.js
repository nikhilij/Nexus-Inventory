// services/SupplierService.js
import { Supplier, SupplierProduct, PurchaseOrder, SupplierPerformance } from "../models/index.js";
import * as NotificationService from "./NotificationService.js";

class SupplierService {
   // Onboard a new supplier
   async onboardingSupplier(supplierData) {
      const { name, contactInfo, address, paymentTerms, categories } = supplierData;

      // Check if supplier already exists
      const existingSupplier = await Supplier.findOne({ name });
      if (existingSupplier) {
         throw new Error("Supplier with this name already exists");
      }

      const supplier = new Supplier({
         name,
         contactInfo,
         address,
         paymentTerms,
         categories,
         status: "pending",
      });

      await supplier.save();

      // Send onboarding notification
      await NotificationService.sendEmail(
         supplier.contactInfo.email,
         "Supplier Onboarding",
         `Welcome ${supplier.name}! Your account is being reviewed.`
      );

      return supplier;
   }

   // Sync supplier catalog with our system
   async syncCatalog(supplierId) {
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
         throw new Error("Supplier not found");
      }

      // In a real implementation, this would connect to supplier's API
      // For now, simulate catalog sync
      const mockProducts = [
         { name: "Product A", sku: "SUP-A-001", price: 10.99 },
         { name: "Product B", sku: "SUP-B-002", price: 15.5 },
         { name: "Product C", sku: "SUP-C-003", price: 8.75 },
      ];

      const syncedProducts = [];
      for (const productData of mockProducts) {
         const supplierProduct = new SupplierProduct({
            supplier: supplierId,
            ...productData,
            lastSynced: new Date(),
         });

         await supplierProduct.save();
         syncedProducts.push(supplierProduct);
      }

      // Update supplier's last sync time
      supplier.lastCatalogSync = new Date();
      await supplier.save();

      return {
         supplier: supplier.name,
         syncedProducts: syncedProducts.length,
         products: syncedProducts,
      };
   }

   // Get supplier performance metrics
   async supplierPerformanceMetrics(supplierId) {
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
         throw new Error("Supplier not found");
      }

      // Get purchase orders for this supplier
      const purchaseOrders = await PurchaseOrder.find({ supplier: supplierId })
         .populate("items.product")
         .sort({ createdAt: -1 });

      // Calculate metrics
      const metrics = {
         totalOrders: purchaseOrders.length,
         totalValue: 0,
         onTimeDelivery: 0,
         qualityScore: 0,
         averageLeadTime: 0,
      };

      let totalLeadTime = 0;
      let onTimeCount = 0;

      for (const order of purchaseOrders) {
         metrics.totalValue += order.totalAmount;

         if (order.status === "delivered") {
            if (order.deliveredAt <= order.expectedDeliveryDate) {
               onTimeCount++;
            }

            const leadTime = order.deliveredAt - order.createdAt;
            totalLeadTime += leadTime;
         }
      }

      metrics.onTimeDelivery = metrics.totalOrders > 0 ? (onTimeCount / metrics.totalOrders) * 100 : 0;
      metrics.averageLeadTime = purchaseOrders.length > 0 ? totalLeadTime / purchaseOrders.length : 0;

      // Quality score based on returns/refusals (simplified)
      metrics.qualityScore = Math.max(0, 100 - (supplier.returnRate || 0) * 100);

      // Save performance metrics
      const performance = new SupplierPerformance({
         supplier: supplierId,
         period: new Date().toISOString().slice(0, 7), // YYYY-MM
         metrics,
      });

      await performance.save();

      return {
         supplier: supplier.name,
         period: performance.period,
         metrics,
      };
   }

   // Update supplier status
   async updateSupplierStatus(supplierId, status, reason) {
      const supplier = await Supplier.findByIdAndUpdate(supplierId, { status, statusReason: reason }, { new: true });

      if (!supplier) {
         throw new Error("Supplier not found");
      }

      // Send notification based on status change
      if (status === "approved") {
         await NotificationService.sendEmail(
            supplier.contactInfo.email,
            "Supplier Account Approved",
            `Congratulations ${supplier.name}! Your account has been approved.`
         );
      } else if (status === "rejected") {
         await NotificationService.sendEmail(
            supplier.contactInfo.email,
            "Supplier Account Status",
            `Dear ${supplier.name}, your account application has been ${status}. Reason: ${reason}`
         );
      }

      return supplier;
   }

   // Get supplier catalog
   async getSupplierCatalog(supplierId) {
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
         throw new Error("Supplier not found");
      }

      const products = await SupplierProduct.find({ supplier: supplierId }).sort({ name: 1 });

      return {
         supplier: supplier.name,
         totalProducts: products.length,
         products,
      };
   }

   // Place purchase order with supplier
   async placePurchaseOrder(supplierId, orderData) {
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
         throw new Error("Supplier not found");
      }

      const { items, expectedDeliveryDate, notes } = orderData;

      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
         const supplierProduct = await SupplierProduct.findOne({
            supplier: supplierId,
            _id: item.productId,
         });

         if (!supplierProduct) {
            throw new Error(`Product ${item.productId} not found in supplier catalog`);
         }

         totalAmount += supplierProduct.price * item.quantity;
      }

      const purchaseOrder = new PurchaseOrder({
         supplier: supplierId,
         items,
         totalAmount,
         expectedDeliveryDate,
         notes,
         status: "pending",
      });

      await purchaseOrder.save();

      // Send notification to supplier
      await NotificationService.sendEmail(
         supplier.contactInfo.email,
         "New Purchase Order",
         `You have received a new purchase order #${purchaseOrder._id} for $${totalAmount.toFixed(2)}`
      );

      return purchaseOrder;
   }
}

const supplierService = new SupplierService();
export default supplierService;
