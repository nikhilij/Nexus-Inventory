#!/usr/bin/env node

/**
 * Seed script for Nexus Inventory Management System
 * 
 * This script creates sample data to demonstrate the models and functionality.
 * Run with: node scripts/seed.js
 */

import mongoose from 'mongoose';
import connectDB from '../lib/mongoose.js';
import {
  Company,
  User,
  Product,
  Warehouse,
  InventoryItem,
  Supplier,
  PurchaseOrder,
  StockMovement,
} from '../lib/models/index.js';

async function createSeedData() {
  try {
    console.log('🌱 Starting seed process...');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Company.deleteMany({}),
      User.deleteMany({}),
      Product.deleteMany({}),
      Warehouse.deleteMany({}),
      InventoryItem.deleteMany({}),
      Supplier.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      StockMovement.deleteMany({}),
    ]);

    // Create demo company
    console.log('🏢 Creating demo company...');
    const company = await Company.create({
      name: 'Demo Electronics Store',
      slug: 'demo-electronics',
      email: 'contact@demo-electronics.com',
      phone: '+1-555-0123',
      address: {
        street: '123 Commerce Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        zipCode: '94102',
      },
      website: 'https://demo-electronics.com',
      settings: {
        currency: 'USD',
        timezone: 'America/Los_Angeles',
        lowStockThreshold: 10,
      },
      subscription: {
        plan: 'growth',
        status: 'active',
      },
    });

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      name: 'John Admin',
      email: 'admin@demo-electronics.com',
      password: 'password123', // Will be hashed by the model
      role: 'admin',
      companyId: company._id,
      emailVerified: true,
    });

    // Create manager user
    const managerUser = await User.create({
      name: 'Jane Manager',
      email: 'manager@demo-electronics.com',
      password: 'password123',
      role: 'manager',
      companyId: company._id,
      emailVerified: true,
    });

    // Create warehouses
    console.log('🏭 Creating warehouses...');
    const mainWarehouse = await Warehouse.create({
      name: 'Main Warehouse',
      code: 'MAIN',
      description: 'Primary distribution center',
      type: 'warehouse',
      address: {
        street: '456 Industrial Ave',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        zipCode: '94103',
      },
      contact: {
        phone: '+1-555-0124',
        email: 'warehouse@demo-electronics.com',
        manager: 'Bob Warehouse',
      },
      isDefault: true,
      capacity: {
        maxItems: 10000,
        maxWeight: 50000,
        unit: 'cubic_meters',
      },
      zones: [
        {
          name: 'Receiving',
          code: 'REC',
          type: 'receiving',
          isActive: true,
        },
        {
          name: 'Storage A',
          code: 'STA',
          type: 'storage',
          isActive: true,
        },
        {
          name: 'Shipping',
          code: 'SHIP',
          type: 'shipping',
          isActive: true,
        },
      ],
      companyId: company._id,
      createdBy: adminUser._id,
    });

    const storeWarehouse = await Warehouse.create({
      name: 'Retail Store #1',
      code: 'STORE1',
      description: 'Downtown retail location',
      type: 'store',
      address: {
        street: '789 Market Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        zipCode: '94105',
      },
      contact: {
        phone: '+1-555-0125',
        email: 'store1@demo-electronics.com',
        manager: 'Alice Store',
      },
      companyId: company._id,
      createdBy: adminUser._id,
    });

    // Create suppliers
    console.log('🏪 Creating suppliers...');
    const techSupplier = await Supplier.create({
      name: 'TechSupply Co.',
      code: 'TECH001',
      description: 'Premium electronics supplier',
      contact: {
        email: 'orders@techsupply.com',
        phone: '+1-555-0200',
        website: 'https://techsupply.com',
        contactPerson: {
          name: 'Mike Sales',
          title: 'Account Manager',
          email: 'mike@techsupply.com',
          phone: '+1-555-0201',
        },
      },
      addresses: [{
        type: 'primary',
        street: '123 Supplier Blvd',
        city: 'San Jose',
        state: 'CA',
        country: 'USA',
        zipCode: '95110',
        isPrimary: true,
      }],
      paymentTerms: 'net_30',
      rating: 4.5,
      isPreferred: true,
      isApproved: true,
      status: 'active',
      categories: ['Electronics', 'Audio', 'Mobile'],
      companyId: company._id,
      createdBy: adminUser._id,
    });

    const accessorySupplier = await Supplier.create({
      name: 'AccessoryWorld',
      code: 'ACC001',
      contact: {
        email: 'sales@accessoryworld.com',
        phone: '+1-555-0300',
      },
      addresses: [{
        type: 'primary',
        street: '456 Accessory Lane',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        zipCode: '90210',
        isPrimary: true,
      }],
      paymentTerms: 'net_15',
      rating: 4.2,
      isApproved: true,
      status: 'active',
      categories: ['Accessories', 'Cases', 'Cables'],
      companyId: company._id,
      createdBy: adminUser._id,
    });

    // Create products
    console.log('📱 Creating products...');
    const products = await Product.create([
      {
        name: 'Wireless Bluetooth Headphones',
        sku: 'WBH-001',
        barcode: '123456789012',
        description: 'Premium wireless headphones with noise cancellation',
        category: 'Electronics',
        brand: 'AudioTech',
        cost: 45.00,
        price: 79.99,
        minStock: 10,
        reorderPoint: 15,
        reorderQuantity: 50,
        weight: { value: 0.3, unit: 'kg' },
        suppliers: [{
          supplierId: techSupplier._id,
          supplierSku: 'TECH-WBH-001',
          cost: 45.00,
          leadTime: 7,
          isPreferred: true,
        }],
        companyId: company._id,
        createdBy: adminUser._id,
      },
      {
        name: 'USB-C Charging Cable',
        sku: 'USB-C-002',
        barcode: '123456789013',
        description: '3-foot USB-C to USB-A charging cable',
        category: 'Accessories',
        brand: 'ConnectPro',
        cost: 8.50,
        price: 19.99,
        minStock: 50,
        reorderPoint: 75,
        reorderQuantity: 200,
        weight: { value: 0.1, unit: 'kg' },
        suppliers: [{
          supplierId: accessorySupplier._id,
          supplierSku: 'ACC-USBC-002',
          cost: 8.50,
          leadTime: 3,
          isPreferred: true,
        }],
        companyId: company._id,
        createdBy: adminUser._id,
      },
      {
        name: 'Smartphone Case - Clear',
        sku: 'CASE-003',
        barcode: '123456789014',
        description: 'Transparent protective case for smartphones',
        category: 'Accessories',
        brand: 'ProtectPlus',
        cost: 12.00,
        price: 24.99,
        minStock: 25,
        reorderPoint: 30,
        reorderQuantity: 100,
        weight: { value: 0.05, unit: 'kg' },
        suppliers: [{
          supplierId: accessorySupplier._id,
          supplierSku: 'ACC-CASE-003',
          cost: 12.00,
          leadTime: 5,
          isPreferred: true,
        }],
        companyId: company._id,
        createdBy: adminUser._id,
      },
      {
        name: 'Wireless Power Bank',
        sku: 'PWR-004',
        barcode: '123456789015',
        description: '10000mAh wireless charging power bank',
        category: 'Electronics',
        brand: 'PowerTech',
        cost: 25.00,
        price: 49.99,
        minStock: 15,
        reorderPoint: 20,
        reorderQuantity: 75,
        weight: { value: 0.4, unit: 'kg' },
        suppliers: [{
          supplierId: techSupplier._id,
          supplierSku: 'TECH-PWR-004',
          cost: 25.00,
          leadTime: 10,
          isPreferred: true,
        }],
        companyId: company._id,
        createdBy: adminUser._id,
      },
    ]);

    // Create inventory items
    console.log('📦 Creating inventory items...');
    const inventoryItems = [];
    
    for (const product of products) {
      // Main warehouse inventory
      const mainInventory = await InventoryItem.create({
        productId: product._id,
        warehouseId: mainWarehouse._id,
        quantity: Math.floor(Math.random() * 100) + 20, // Random quantity 20-120
        unitCost: product.cost,
        location: {
          zone: 'STA',
          aisle: 'A1',
          shelf: '01',
          bin: '001',
        },
        qualityStatus: 'good',
        companyId: company._id,
        lastUpdatedBy: adminUser._id,
      });
      inventoryItems.push(mainInventory);

      // Store inventory (smaller quantities)
      const storeInventory = await InventoryItem.create({
        productId: product._id,
        warehouseId: storeWarehouse._id,
        quantity: Math.floor(Math.random() * 20) + 5, // Random quantity 5-25
        unitCost: product.cost,
        qualityStatus: 'good',
        companyId: company._id,
        lastUpdatedBy: managerUser._id,
      });
      inventoryItems.push(storeInventory);
    }

    // Create some stock movements
    console.log('📋 Creating stock movements...');
    await StockMovement.create([
      {
        productId: products[0]._id,
        toWarehouseId: mainWarehouse._id,
        type: 'inbound',
        reason: 'purchase_order',
        quantity: 50,
        beforeQuantity: 0,
        afterQuantity: 50,
        unitCost: products[0].cost,
        referenceNumber: 'PO-2024-001',
        processedBy: adminUser._id,
        companyId: company._id,
      },
      {
        productId: products[1]._id,
        fromWarehouseId: mainWarehouse._id,
        toWarehouseId: storeWarehouse._id,
        type: 'transfer',
        reason: 'transfer_order',
        quantity: 20,
        beforeQuantity: 100,
        afterQuantity: 80,
        unitCost: products[1].cost,
        referenceNumber: 'TRF-2024-001',
        processedBy: managerUser._id,
        companyId: company._id,
      },
      {
        productId: products[2]._id,
        fromWarehouseId: storeWarehouse._id,
        type: 'outbound',
        reason: 'sales_order',
        quantity: 5,
        beforeQuantity: 15,
        afterQuantity: 10,
        unitCost: products[2].cost,
        referenceNumber: 'SO-2024-001',
        processedBy: managerUser._id,
        companyId: company._id,
      },
    ]);

    // Create a purchase order
    console.log('🛒 Creating purchase order...');
    await PurchaseOrder.create({
      orderNumber: 'PO-2024-002',
      supplierId: techSupplier._id,
      warehouseId: mainWarehouse._id,
      supplierDetails: {
        name: techSupplier.name,
        email: techSupplier.contact.email,
        phone: techSupplier.contact.phone,
      },
      items: [
        {
          productId: products[0]._id,
          sku: products[0].sku,
          name: products[0].name,
          quantity: 100,
          unitCost: 45.00,
          totalCost: 4500.00,
          supplierSku: 'TECH-WBH-001',
        },
        {
          productId: products[3]._id,
          sku: products[3].sku,
          name: products[3].name,
          quantity: 50,
          unitCost: 25.00,
          totalCost: 1250.00,
          supplierSku: 'TECH-PWR-004',
        },
      ],
      subtotal: 5750.00,
      taxAmount: 460.00,
      totalAmount: 6210.00,
      status: 'approved',
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      approvedBy: adminUser._id,
      approvedAt: new Date(),
      companyId: company._id,
      createdBy: managerUser._id,
    });

    console.log('✅ Seed data created successfully!');
    console.log(`Company: ${company.name} (${company._id})`);
    console.log(`Admin User: ${adminUser.email}`);
    console.log(`Manager User: ${managerUser.email}`);
    console.log(`Products: ${products.length}`);
    console.log(`Warehouses: 2`);
    console.log(`Suppliers: 2`);
    console.log(`Inventory Items: ${inventoryItems.length}`);

  } catch (error) {
    console.error('❌ Error creating seed data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSeedData();
}

export default createSeedData;