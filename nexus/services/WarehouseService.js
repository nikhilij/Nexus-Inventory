// services/WarehouseService.js
import { Warehouse, WarehouseLocation, Product, Order } from "../models/index.js";
import * as InventoryService from "./InventoryService.js";

class WarehouseService {
   // Create a new warehouse
   async createWarehouse(warehouseData) {
      const { name, address, type, capacity, zones } = warehouseData;

      const warehouse = new Warehouse({
         name,
         address,
         type,
         capacity,
         zones: zones || [],
      });

      await warehouse.save();

      // Create default zones if not provided
      if (!zones || zones.length === 0) {
         await this.createDefaultZones(warehouse._id);
      }

      return warehouse;
   }

   // Optimize fulfillment for an order
   async optimizeFulfillment(orderData) {
      const { items, shippingAddress } = orderData;

      // Find warehouses with stock for all items
      const warehouses = await this.findWarehousesWithStock(items);

      if (warehouses.length === 0) {
         throw new Error("No warehouse has sufficient stock for all items");
      }

      // Calculate optimal warehouse based on distance, cost, and availability
      const optimalWarehouse = await this.calculateOptimalWarehouse(warehouses, shippingAddress);

      // Reserve stock in optimal warehouse
      const reservations = [];
      for (const item of items) {
         const reservation = await InventoryService.reserveStock(
            item.productId,
            item.quantity,
            optimalWarehouse._id,
            orderData.orderId
         );
         reservations.push(reservation);
      }

      return {
         warehouse: optimalWarehouse,
         reservations,
         estimatedShippingCost: await this.calculateShippingCost(optimalWarehouse, shippingAddress),
      };
   }

   // Map locations within a warehouse
   async mapLocations(warehouseId) {
      const warehouse = await Warehouse.findById(warehouseId).populate("zones");
      if (!warehouse) {
         throw new Error("Warehouse not found");
      }

      // Get all locations in the warehouse
      const locations = await WarehouseLocation.find({ warehouse: warehouseId })
         .populate("zone")
         .sort({ zone: 1, aisle: 1, shelf: 1, bin: 1 });

      // Create a map of locations by zone
      const locationMap = {};
      for (const location of locations) {
         const zoneName = location.zone?.name || "Unassigned";
         if (!locationMap[zoneName]) {
            locationMap[zoneName] = [];
         }
         locationMap[zoneName].push({
            id: location._id,
            aisle: location.aisle,
            shelf: location.shelf,
            bin: location.bin,
            occupied: location.occupied,
            product: location.product,
         });
      }

      return {
         warehouse: warehouse.name,
         totalLocations: locations.length,
         locationMap,
      };
   }

   // Create default zones for a warehouse
   async createDefaultZones(warehouseId) {
      const defaultZones = [
         { name: "Receiving", type: "receiving" },
         { name: "Storage", type: "storage" },
         { name: "Picking", type: "picking" },
         { name: "Packing", type: "packing" },
         { name: "Shipping", type: "shipping" },
      ];

      const zones = [];
      for (const zoneData of defaultZones) {
         const zone = new WarehouseLocation({
            warehouse: warehouseId,
            ...zoneData,
         });
         await zone.save();
         zones.push(zone);
      }

      // Update warehouse with zones
      await Warehouse.findByIdAndUpdate(warehouseId, { zones: zones.map((z) => z._id) });

      return zones;
   }

   // Find warehouses that have stock for all required items
   async findWarehousesWithStock(items) {
      const warehouses = await Warehouse.find({ active: true });

      const eligibleWarehouses = [];
      for (const warehouse of warehouses) {
         let hasAllItems = true;

         for (const item of items) {
            const stockLevel = await InventoryService.getStockLevels(item.productId, warehouse._id);
            if (stockLevel.available < item.quantity) {
               hasAllItems = false;
               break;
            }
         }

         if (hasAllItems) {
            eligibleWarehouses.push(warehouse);
         }
      }

      return eligibleWarehouses;
   }

   // Calculate optimal warehouse based on various factors
   async calculateOptimalWarehouse(warehouses, shippingAddress) {
      let optimalWarehouse = warehouses[0];
      let bestScore = 0;

      for (const warehouse of warehouses) {
         let score = 0;

         // Distance factor (simplified - in real implementation, use geocoding)
         const distance = this.calculateDistance(warehouse.address, shippingAddress);
         score += (1000 - Math.min(distance, 1000)) / 10; // Closer is better

         // Capacity utilization factor
         const utilization = await this.getWarehouseUtilization(warehouse._id);
         score += (100 - utilization) * 2; // Less utilized is better

         // Processing speed factor (based on historical data)
         const processingSpeed = await this.getWarehouseProcessingSpeed(warehouse._id);
         score += processingSpeed * 5;

         if (score > bestScore) {
            bestScore = score;
            optimalWarehouse = warehouse;
         }
      }

      return optimalWarehouse;
   }

   // Calculate distance between two addresses (simplified)
   calculateDistance(address1, address2) {
      // In a real implementation, use geocoding service
      // For now, return a random distance for demonstration
      return Math.random() * 500; // 0-500 km
   }

   // Get warehouse utilization percentage
   async getWarehouseUtilization(warehouseId) {
      const warehouse = await Warehouse.findById(warehouseId);
      if (!warehouse || !warehouse.capacity) return 0;

      // Calculate current utilization (simplified)
      const locations = await WarehouseLocation.find({ warehouse: warehouseId, occupied: true });
      return (locations.length / warehouse.capacity) * 100;
   }

   // Get warehouse processing speed score (simplified)
   async getWarehouseProcessingSpeed(warehouseId) {
      // In a real implementation, calculate based on historical order processing times
      return Math.random() * 10; // 0-10 score
   }

   // Calculate shipping cost
   async calculateShippingCost(warehouse, shippingAddress) {
      const distance = this.calculateDistance(warehouse.address, shippingAddress);
      // Simplified cost calculation
      return distance * 0.5; // $0.50 per km
   }
}

const warehouseService = new WarehouseService();
export default warehouseService;
