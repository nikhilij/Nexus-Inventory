import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Product } from '@/lib/models';

// GET /api/products - List products with filtering and pagination
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }
    
    // Build query
    const query = { companyId };
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { barcode: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }
    
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (isActive !== null) query.isActive = isActive === 'true';
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('suppliers.supplierId', 'name code')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);
    
    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { companyId } = body;
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    const requiredFields = ['name', 'sku'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Check for duplicate SKU within company
    const existingProduct = await Product.findOne({
      companyId,
      sku: body.sku.toUpperCase(),
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 409 }
      );
    }
    
    // Check for duplicate barcode if provided
    if (body.barcode) {
      const existingBarcode = await Product.findOne({
        companyId,
        barcode: body.barcode,
      });
      
      if (existingBarcode) {
        return NextResponse.json(
          { error: 'A product with this barcode already exists' },
          { status: 409 }
        );
      }
    }
    
    // Create product
    const product = new Product({
      ...body,
      sku: body.sku.toUpperCase(),
    });
    
    await product.save();
    
    // Populate for response
    await product.populate('suppliers.supplierId', 'name code');
    
    return NextResponse.json(product, { status: 201 });
    
  } catch (error) {
    console.error('Products POST error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation error', details: messages },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}