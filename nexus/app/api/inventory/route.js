import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { InventoryItem, Product, Warehouse } from '@/lib/models';

// GET /api/inventory - List inventory items with filtering
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const warehouseId = searchParams.get('warehouseId');
    const productId = searchParams.get('productId');
    const lowStock = searchParams.get('lowStock') === 'true';
    const expiringSoon = searchParams.get('expiringSoon') === 'true';
    const qualityStatus = searchParams.get('qualityStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }
    
    // Build query
    const query = { companyId, isActive: true };
    
    if (warehouseId) query.warehouseId = warehouseId;
    if (productId) query.productId = productId;
    if (qualityStatus) query.qualityStatus = qualityStatus;
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    let items = await InventoryItem.find(query)
      .populate('productId', 'name sku barcode minStock category')
      .populate('warehouseId', 'name code')
      .populate('lastCountedBy', 'name')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Apply additional filters that require populated data
    if (lowStock) {
      items = items.filter(item => 
        item.productId && item.quantity <= (item.productId.minStock || 0)
      );
    }
    
    if (expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      items = items.filter(item => 
        item.expiryDate && 
        new Date(item.expiryDate) <= thirtyDaysFromNow &&
        new Date(item.expiryDate) > new Date()
      );
    }
    
    const total = await InventoryItem.countDocuments(query);
    
    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Inventory GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Create or update inventory item
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { companyId, productId, warehouseId, quantity } = body;
    
    if (!companyId || !productId || !warehouseId) {
      return NextResponse.json(
        { error: 'Company ID, Product ID, and Warehouse ID are required' },
        { status: 400 }
      );
    }
    
    if (quantity < 0) {
      return NextResponse.json(
        { error: 'Quantity cannot be negative' },
        { status: 400 }
      );
    }
    
    // Verify product and warehouse exist
    const [product, warehouse] = await Promise.all([
      Product.findOne({ _id: productId, companyId }),
      Warehouse.findOne({ _id: warehouseId, companyId }),
    ]);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }
    
    // Check if inventory item already exists
    let inventoryItem = await InventoryItem.findOne({
      companyId,
      productId,
      warehouseId,
    });
    
    if (inventoryItem) {
      // Update existing item
      inventoryItem.quantity = quantity;
      inventoryItem.availableQuantity = Math.max(0, quantity - inventoryItem.reservedQuantity);
      inventoryItem.lastUpdatedBy = body.updatedBy;
      
      if (body.unitCost) inventoryItem.unitCost = body.unitCost;
      if (body.batch) inventoryItem.batch = body.batch;
      if (body.lotNumber) inventoryItem.lotNumber = body.lotNumber;
      if (body.expiryDate) inventoryItem.expiryDate = body.expiryDate;
      if (body.location) inventoryItem.location = body.location;
      
      await inventoryItem.save();
    } else {
      // Create new item
      inventoryItem = new InventoryItem({
        ...body,
        availableQuantity: quantity,
      });
      
      await inventoryItem.save();
    }
    
    // Populate for response
    await inventoryItem.populate([
      { path: 'productId', select: 'name sku barcode' },
      { path: 'warehouseId', select: 'name code' },
      { path: 'lastUpdatedBy', select: 'name' },
    ]);
    
    return NextResponse.json(inventoryItem, { status: inventoryItem.isNew ? 201 : 200 });
    
  } catch (error) {
    console.error('Inventory POST error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation error', details: messages },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create/update inventory' },
      { status: 500 }
    );
  }
}