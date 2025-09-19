import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { StockMovement, InventoryItem, Product, Warehouse } from '@/lib/models';
import mongoose from 'mongoose';

// GET /api/stock-movements - List stock movements with filtering
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const productId = searchParams.get('productId');
    const warehouseId = searchParams.get('warehouseId');
    const type = searchParams.get('type');
    const reason = searchParams.get('reason');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }
    
    // Build query
    const query = { companyId };
    
    if (productId) query.productId = productId;
    if (type) query.type = type;
    if (reason) query.reason = reason;
    
    if (warehouseId) {
      query.$or = [
        { fromWarehouseId: warehouseId },
        { toWarehouseId: warehouseId },
      ];
    }
    
    if (startDate || endDate) {
      query.processedAt = {};
      if (startDate) query.processedAt.$gte = new Date(startDate);
      if (endDate) query.processedAt.$lte = new Date(endDate);
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [movements, total] = await Promise.all([
      StockMovement.find(query)
        .populate('productId', 'name sku')
        .populate('fromWarehouseId', 'name code')
        .populate('toWarehouseId', 'name code')
        .populate('processedBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ processedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockMovement.countDocuments(query)
    ]);
    
    return NextResponse.json({
      data: movements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Stock movements GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock movements' },
      { status: 500 }
    );
  }
}

// POST /api/stock-movements - Create a new stock movement
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      companyId, 
      productId, 
      type, 
      reason, 
      quantity, 
      fromWarehouseId, 
      toWarehouseId, 
      processedBy 
    } = body;
    
    // Validate required fields
    if (!companyId || !productId || !type || !reason || !quantity || !processedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be positive' },
        { status: 400 }
      );
    }
    
    // Validate warehouse requirements based on movement type
    if (type === 'transfer' && (!fromWarehouseId || !toWarehouseId)) {
      return NextResponse.json(
        { error: 'Transfer movements require both from and to warehouse' },
        { status: 400 }
      );
    }
    
    if (type === 'outbound' && !fromWarehouseId) {
      return NextResponse.json(
        { error: 'Outbound movements require from warehouse' },
        { status: 400 }
      );
    }
    
    if (type === 'inbound' && !toWarehouseId) {
      return NextResponse.json(
        { error: 'Inbound movements require to warehouse' },
        { status: 400 }
      );
    }
    
    // Start transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Verify product exists
      const product = await Product.findOne({ _id: productId, companyId }).session(session);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Handle different movement types
      let fromInventory = null;
      let toInventory = null;
      let beforeQuantity = 0;
      let afterQuantity = 0;
      
      if (fromWarehouseId) {
        // Find or create from inventory item
        fromInventory = await InventoryItem.findOne({
          companyId,
          productId,
          warehouseId: fromWarehouseId,
        }).session(session);
        
        if (!fromInventory) {
          throw new Error('Source inventory not found');
        }
        
        beforeQuantity = fromInventory.quantity;
        
        // Check if sufficient quantity available
        if (fromInventory.availableQuantity < quantity) {
          throw new Error('Insufficient quantity available');
        }
        
        // Update from inventory
        fromInventory.quantity -= quantity;
        fromInventory.availableQuantity = Math.max(0, fromInventory.quantity - fromInventory.reservedQuantity);
        fromInventory.lastUpdatedBy = processedBy;
        await fromInventory.save({ session });
        
        afterQuantity = fromInventory.quantity;
      }
      
      if (toWarehouseId) {
        // Find or create to inventory item
        toInventory = await InventoryItem.findOne({
          companyId,
          productId,
          warehouseId: toWarehouseId,
        }).session(session);
        
        if (!toInventory) {
          // Create new inventory item
          toInventory = new InventoryItem({
            companyId,
            productId,
            warehouseId: toWarehouseId,
            quantity: 0,
            lastUpdatedBy: processedBy,
          });
        }
        
        if (!fromWarehouseId) {
          beforeQuantity = toInventory.quantity;
        }
        
        // Update to inventory
        toInventory.quantity += quantity;
        toInventory.availableQuantity = Math.max(0, toInventory.quantity - toInventory.reservedQuantity);
        toInventory.lastUpdatedBy = processedBy;
        
        // Set additional properties if provided
        if (body.unitCost) toInventory.unitCost = body.unitCost;
        if (body.batch) toInventory.batch = body.batch;
        if (body.lotNumber) toInventory.lotNumber = body.lotNumber;
        if (body.expiryDate) toInventory.expiryDate = body.expiryDate;
        if (body.toLocation) toInventory.location = body.toLocation;
        
        await toInventory.save({ session });
        
        if (!fromWarehouseId) {
          afterQuantity = toInventory.quantity;
        }
      }
      
      // Create stock movement record
      const stockMovement = new StockMovement({
        ...body,
        beforeQuantity,
        afterQuantity,
        status: 'completed',
      });
      
      await stockMovement.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      
      // Populate response
      await stockMovement.populate([
        { path: 'productId', select: 'name sku' },
        { path: 'fromWarehouseId', select: 'name code' },
        { path: 'toWarehouseId', select: 'name code' },
        { path: 'processedBy', select: 'name email' },
      ]);
      
      return NextResponse.json(stockMovement, { status: 201 });
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    
  } catch (error) {
    console.error('Stock movement POST error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Insufficient')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation error', details: messages },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create stock movement' },
      { status: 500 }
    );
  }
}