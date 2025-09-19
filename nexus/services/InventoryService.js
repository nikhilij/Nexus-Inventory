// services/InventoryService.js
import { StockMovement, StockLevel, Reservation, Product, Warehouse } from "../models/index.js";
import * as NotificationService from "./NotificationService.js";

class InventoryService {
   // Record stock movement (in/out/adjustment)
   async recordStockMovement(movementData) {
      const { productId, warehouseId, type, quantity, reason, reference } = movementData;

      // Validate product and warehouse exist
      const product = await Product.findById(productId);
      const warehouse = await Warehouse.findById(warehouseId);

      if (!product || !warehouse) {
         throw new Error("Product or warehouse not found");
      }

      // Create stock movement record
      const movement = new StockMovement({
         product: productId,
         warehouse: warehouseId,
         type,
         quantity,
         reason,
         reference,
      });

      await movement.save();

      // Update stock levels
      await this.updateStockLevel(productId, warehouseId, type, quantity);

      // Check for low stock alerts
      await this.checkLowStockAlerts(productId, warehouseId);

      return movement;
   }

   // Get stock levels for a product in a warehouse
   async getStockLevels(productId, warehouseId) {
      const stockLevel = await StockLevel.findOne({
         product: productId,
         warehouse: warehouseId,
      }).populate("product warehouse");

      if (!stockLevel) {
         return { productId, warehouseId, quantity: 0, reserved: 0, available: 0 };
      }

      return {
         productId,
         warehouseId,
         quantity: stockLevel.quantity,
         reserved: stockLevel.reserved,
         available: stockLevel.quantity - stockLevel.reserved,
      };
   }

   // Perform stock take (physical inventory count)
   async performStockTake(warehouseId, counts) {
      const results = { updated: [], discrepancies: [] };

      for (const count of counts) {
         const { productId, countedQuantity } = count;

         const currentStock = await this.getStockLevels(productId, warehouseId);
         const discrepancy = countedQuantity - currentStock.quantity;

         if (discrepancy !== 0) {
            // Record adjustment movement
            await this.recordStockMovement({
               productId,
               warehouseId,
               type: "adjustment",
               quantity: discrepancy,
               reason: "Stock take adjustment",
               reference: `ST-${Date.now()}`,
            });

            results.discrepancies.push({
               productId,
               expected: currentStock.quantity,
               counted: countedQuantity,
               discrepancy,
            });
         }

         results.updated.push({ productId, quantity: countedQuantity });
      }

      return results;
   }

   // Transfer stock between warehouses
   async transferStock(fromWarehouse, toWarehouse, productId, quantity) {
      // Check if source warehouse has enough stock
      const sourceStock = await this.getStockLevels(productId, fromWarehouse);
      if (sourceStock.available < quantity) {
         throw new Error("Insufficient stock in source warehouse");
      }

      // Record outbound movement
      await this.recordStockMovement({
         productId,
         warehouseId: fromWarehouse,
         type: "out",
         quantity: -quantity,
         reason: "Transfer to warehouse",
         reference: `TRF-${Date.now()}`,
      });

      // Record inbound movement
      await this.recordStockMovement({
         productId,
         warehouseId: toWarehouse,
         type: "in",
         quantity,
         reason: "Transfer from warehouse",
         reference: `TRF-${Date.now()}`,
      });

      return { success: true, transferred: quantity };
   }

   // Reserve stock for an order
   async reserveStock(productId, quantity, warehouseId, orderId) {
      const stockLevel = await StockLevel.findOne({
         product: productId,
         warehouse: warehouseId,
      });

      if (!stockLevel || stockLevel.quantity - stockLevel.reserved < quantity) {
         throw new Error("Insufficient available stock");
      }

      // Create reservation
      const reservation = new Reservation({
         product: productId,
         warehouse: warehouseId,
         quantity,
         order: orderId,
         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      await reservation.save();

      // Update reserved quantity
      stockLevel.reserved += quantity;
      await stockLevel.save();

      return reservation;
   }

   // Release stock reservation
   async releaseReservation(reservationId) {
      const reservation = await Reservation.findById(reservationId);
      if (!reservation) {
         throw new Error("Reservation not found");
      }

      // Update stock level
      const stockLevel = await StockLevel.findOne({
         product: reservation.product,
         warehouse: reservation.warehouse,
      });

      if (stockLevel) {
         stockLevel.reserved = Math.max(0, stockLevel.reserved - reservation.quantity);
         await stockLevel.save();
      }

      // Mark reservation as released
      reservation.status = "released";
      await reservation.save();

      return reservation;
   }

   // Helper method to update stock levels
   async updateStockLevel(productId, warehouseId, type, quantity) {
      let stockLevel = await StockLevel.findOne({
         product: productId,
         warehouse: warehouseId,
      });

      if (!stockLevel) {
         stockLevel = new StockLevel({
            product: productId,
            warehouse: warehouseId,
            quantity: 0,
            reserved: 0,
         });
      }

      // Adjust quantity based on movement type
      if (type === "in") {
         stockLevel.quantity += quantity;
      } else if (type === "out" || type === "adjustment") {
         stockLevel.quantity += quantity; // quantity can be negative for out/adjustment
      }

      await stockLevel.save();
      return stockLevel;
   }

   // Check for low stock alerts
   async checkLowStockAlerts(productId, warehouseId) {
      const product = await Product.findById(productId);
      if (!product || !product.lowStockThreshold) return;

      const stockLevel = await this.getStockLevels(productId, warehouseId);
      if (stockLevel.quantity <= product.lowStockThreshold) {
         await NotificationService.sendLowStockAlert(productId, warehouseId, stockLevel.quantity);
      }
   }
}

const inventoryService = new InventoryService();
export default inventoryService;
