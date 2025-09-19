import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Product } from '@/lib/models';

// GET /api/products/[id] - Get a specific product
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }
    
    const product = await Product.findOne({ _id: id, companyId })
      .populate('suppliers.supplierId', 'name code contact')
      .lean();
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
    
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update a specific product
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    const { companyId } = body;
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }
    
    // Check if product exists
    const existingProduct = await Product.findOne({ _id: id, companyId });
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check for duplicate SKU if changed
    if (body.sku && body.sku.toUpperCase() !== existingProduct.sku) {
      const duplicateSku = await Product.findOne({
        companyId,
        sku: body.sku.toUpperCase(),
        _id: { $ne: id },
      });
      
      if (duplicateSku) {
        return NextResponse.json(
          { error: 'A product with this SKU already exists' },
          { status: 409 }
        );
      }
    }
    
    // Check for duplicate barcode if changed
    if (body.barcode && body.barcode !== existingProduct.barcode) {
      const duplicateBarcode = await Product.findOne({
        companyId,
        barcode: body.barcode,
        _id: { $ne: id },
      });
      
      if (duplicateBarcode) {
        return NextResponse.json(
          { error: 'A product with this barcode already exists' },
          { status: 409 }
        );
      }
    }
    
    // Update product
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, companyId },
      { 
        ...body,
        sku: body.sku ? body.sku.toUpperCase() : existingProduct.sku,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate('suppliers.supplierId', 'name code');
    
    return NextResponse.json(updatedProduct);
    
  } catch (error) {
    console.error('Product PUT error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation error', details: messages },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete a specific product
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }
    
    // Check if product exists
    const product = await Product.findOne({ _id: id, companyId });
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if product has inventory (soft delete if it does)
    const { InventoryItem } = await import('@/lib/models');
    const hasInventory = await InventoryItem.exists({ productId: id });
    
    if (hasInventory) {
      // Soft delete by marking as inactive
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: id, companyId },
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );
      
      return NextResponse.json({
        message: 'Product deactivated (has inventory history)',
        product: updatedProduct,
      });
    } else {
      // Hard delete if no inventory
      await Product.findOneAndDelete({ _id: id, companyId });
      
      return NextResponse.json({
        message: 'Product deleted successfully',
      });
    }
    
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}