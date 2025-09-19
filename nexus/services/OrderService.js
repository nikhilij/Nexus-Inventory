// services/OrderService.js
import { PurchaseOrder, SalesOrder, OrderItem, Return, Shipment } from "../models/index.js";
import * as InventoryService from "./InventoryService.js";
import * as WarehouseService from "./WarehouseService.js";
import * as NotificationService from "./NotificationService.js";

class OrderService {
   // Create a purchase order
   async createPurchaseOrder(orderData) {
      const { supplierId, items, expectedDeliveryDate, notes } = orderData;

      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
         totalAmount += item.unitPrice * item.quantity;
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
         "supplier@example.com", // In real implementation, get from supplier
         "New Purchase Order",
         `Purchase Order #${purchaseOrder._id} created for $${totalAmount.toFixed(2)}`
      );

      return purchaseOrder;
   }

   // Process a sales order
   async processSalesOrder(orderId) {
      const salesOrder = await SalesOrder.findById(orderId).populate("items.product");
      if (!salesOrder) {
         throw new Error("Sales order not found");
      }

      if (salesOrder.status !== "pending") {
         throw new Error("Order is not in pending status");
      }

      // Optimize fulfillment
      const fulfillmentPlan = await WarehouseService.optimizeFulfillment({
         items: salesOrder.items,
         shippingAddress: salesOrder.shippingAddress,
         orderId: salesOrder._id,
      });

      // Update order with fulfillment plan
      salesOrder.warehouse = fulfillmentPlan.warehouse._id;
      salesOrder.status = "processing";
      salesOrder.estimatedShippingCost = fulfillmentPlan.estimatedShippingCost;

      await salesOrder.save();

      // Send confirmation to customer
      await NotificationService.sendEmail(
         salesOrder.customerEmail,
         "Order Confirmation",
         `Your order #${salesOrder._id} is being processed. Estimated shipping: $${fulfillmentPlan.estimatedShippingCost.toFixed(2)}`
      );

      return {
         order: salesOrder,
         fulfillmentPlan,
      };
   }

   // Pick, pack, and ship process
   async pickPackShip(orderId) {
      const salesOrder = await SalesOrder.findById(orderId);
      if (!salesOrder) {
         throw new Error("Sales order not found");
      }

      if (salesOrder.status !== "processing") {
         throw new Error("Order is not ready for picking");
      }

      // Create shipment
      const shipment = new Shipment({
         order: orderId,
         warehouse: salesOrder.warehouse,
         items: salesOrder.items,
         shippingAddress: salesOrder.shippingAddress,
         status: "picking",
      });

      await shipment.save();

      // Update order status
      salesOrder.status = "shipped";
      salesOrder.shippedAt = new Date();
      salesOrder.shipment = shipment._id;

      await salesOrder.save();

      // Record stock movements for picked items
      for (const item of salesOrder.items) {
         await InventoryService.recordStockMovement({
            productId: item.product,
            warehouseId: salesOrder.warehouse,
            type: "out",
            quantity: -item.quantity,
            reason: "Order fulfillment",
            reference: `SO-${orderId}`,
         });
      }

      // Send shipping notification
      await NotificationService.sendEmail(
         salesOrder.customerEmail,
         "Order Shipped",
         `Your order #${salesOrder._id} has been shipped. Tracking number: ${shipment.trackingNumber}`
      );

      return {
         order: salesOrder,
         shipment,
      };
   }

   // Process returns
   async returnsProcessing(returnData) {
      const { orderId, items, reason, condition } = returnData;

      const salesOrder = await SalesOrder.findById(orderId);
      if (!salesOrder) {
         throw new Error("Order not found");
      }

      // Create return record
      const returnRecord = new Return({
         order: orderId,
         items,
         reason,
         condition,
         status: "received",
      });

      await returnRecord.save();

      // Process returned items
      for (const item of items) {
         // Record stock return
         await InventoryService.recordStockMovement({
            productId: item.product,
            warehouseId: salesOrder.warehouse,
            type: "in",
            quantity: item.quantity,
            reason: "Return processing",
            reference: `RTN-${returnRecord._id}`,
         });

         // Update product condition if damaged
         if (condition === "damaged") {
            // In a real implementation, update product status or create repair ticket
            console.log(`Product ${item.product} returned damaged`);
         }
      }

      // Update order status
      salesOrder.status = "returned";
      await salesOrder.save();

      // Send return confirmation
      await NotificationService.sendEmail(
         salesOrder.customerEmail,
         "Return Processed",
         `Your return for order #${orderId} has been processed. Refund will be issued within 3-5 business days.`
      );

      return returnRecord;
   }

   // Generate order reports
   async generateOrderReports(filters) {
      const { startDate, endDate, status, supplierId, customerId } = filters;

      let query = {};

      if (startDate && endDate) {
         query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }

      if (status) {
         query.status = status;
      }

      if (supplierId) {
         query.supplier = supplierId;
      }

      // Get purchase orders
      const purchaseOrders = await PurchaseOrder.find(query).populate("supplier").sort({ createdAt: -1 });

      // Get sales orders
      const salesOrders = await SalesOrder.find({
         ...query,
         customer: customerId,
      })
         .populate("customer")
         .sort({ createdAt: -1 });

      // Calculate summary statistics
      const summary = {
         totalPurchaseOrders: purchaseOrders.length,
         totalPurchaseValue: purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0),
         totalSalesOrders: salesOrders.length,
         totalSalesValue: salesOrders.reduce((sum, order) => sum + order.totalAmount, 0),
         averageOrderValue: 0,
      };

      const totalOrders = purchaseOrders.length + salesOrders.length;
      if (totalOrders > 0) {
         summary.averageOrderValue = (summary.totalPurchaseValue + summary.totalSalesValue) / totalOrders;
      }

      return {
         summary,
         purchaseOrders,
         salesOrders,
         generatedAt: new Date(),
      };
   }

   // Get order status
   async getOrderStatus(orderId, orderType) {
      let order;
      if (orderType === "purchase") {
         order = await PurchaseOrder.findById(orderId).populate("supplier");
      } else {
         order = await SalesOrder.findById(orderId).populate("customer");
      }

      if (!order) {
         throw new Error("Order not found");
      }

      return {
         orderId: order._id,
         status: order.status,
         createdAt: order.createdAt,
         updatedAt: order.updatedAt,
         items: order.items,
         totalAmount: order.totalAmount,
         trackingInfo: orderType === "sales" ? order.shipment : null,
      };
   }

   // Cancel order
   async cancelOrder(orderId, orderType, reason) {
      let order;
      if (orderType === "purchase") {
         order = await PurchaseOrder.findById(orderId);
      } else {
         order = await SalesOrder.findById(orderId);
      }

      if (!order) {
         throw new Error("Order not found");
      }

      if (order.status === "cancelled") {
         throw new Error("Order is already cancelled");
      }

      // Release any reservations for sales orders
      if (orderType === "sales" && order.reservations) {
         for (const reservation of order.reservations) {
            await InventoryService.releaseReservation(reservation);
         }
      }

      order.status = "cancelled";
      order.cancelledAt = new Date();
      order.cancelReason = reason;
      await order.save();

      // Send cancellation notification
      const email = orderType === "purchase" ? "supplier@example.com" : order.customerEmail;
      await NotificationService.sendEmail(
         email,
         "Order Cancelled",
         `Order #${orderId} has been cancelled. Reason: ${reason}`
      );

      return order;
   }
}

const orderService = new OrderService();
export default orderService;
