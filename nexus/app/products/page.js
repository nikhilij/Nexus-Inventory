import Link from 'next/link';
import {
  HiPlus,
  HiCube,
  HiTag,
  HiExclamationTriangle,
} from 'react-icons/hi2';
import {
  HiSearch,
  HiFilter,
  HiBadgeCheck,
} from 'react-icons/hi';

// Mock data for demonstration
async function getProducts(searchParams = {}) {
  // In a real implementation, this would call the API or database
  return {
    data: [
      {
        _id: '1',
        name: 'Wireless Bluetooth Headphones',
        sku: 'WBH-001',
        barcode: '123456789012',
        category: 'Electronics',
        brand: 'AudioTech',
        price: 79.99,
        cost: 45.00,
        minStock: 10,
        isActive: true,
        images: [{ url: '/api/placeholder-image', isPrimary: true }],
        suppliers: [{ supplierId: { name: 'TechSupply Co.' } }],
        createdAt: new Date('2024-01-15'),
      },
      {
        _id: '2',
        name: 'USB-C Charging Cable',
        sku: 'USB-C-002',
        barcode: '123456789013',
        category: 'Accessories',
        brand: 'ConnectPro',
        price: 19.99,
        cost: 8.50,
        minStock: 50,
        isActive: true,
        images: [],
        suppliers: [{ supplierId: { name: 'CableCorp Ltd.' } }],
        createdAt: new Date('2024-01-10'),
      },
      {
        _id: '3',
        name: 'Smartphone Case - Clear',
        sku: 'CASE-003',
        barcode: '123456789014',
        category: 'Accessories',
        brand: 'ProtectPlus',
        price: 24.99,
        cost: 12.00,
        minStock: 25,
        isActive: false,
        images: [{ url: '/api/placeholder-image', isPrimary: true }],
        suppliers: [{ supplierId: { name: 'AccessoryWorld' } }],
        createdAt: new Date('2024-01-05'),
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 3,
      pages: 1,
    },
  };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function ProductCard({ product }) {
  const margin = product.price && product.cost 
    ? ((product.price - product.cost) / product.price) * 100 
    : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          {product.images.length > 0 ? (
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <HiCube className="w-6 h-6 text-blue-600" />
            </div>
          ) : (
            <HiCube className="w-6 h-6 text-slate-400" />
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 truncate">
                <Link 
                  href={`/products/${product._id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {product.name}
                </Link>
              </h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <HiTag className="w-4 h-4" />
                  {product.sku}
                </span>
                {product.brand && (
                  <span>{product.brand}</span>
                )}
                {product.category && (
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                    {product.category}
                  </span>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {product.isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <HiBadgeCheck className="w-3 h-3" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                  <HiExclamationTriangle className="w-3 h-3" />
                  Inactive
                </span>
              )}
            </div>
          </div>

          {/* Pricing and Margin */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div>
              <span className="text-slate-600">Price:</span>
              <span className="font-medium text-slate-900 ml-1">
                {formatCurrency(product.price)}
              </span>
            </div>
            <div>
              <span className="text-slate-600">Cost:</span>
              <span className="font-medium text-slate-900 ml-1">
                {formatCurrency(product.cost)}
              </span>
            </div>
            <div>
              <span className="text-slate-600">Margin:</span>
              <span className={`font-medium ml-1 ${margin > 30 ? 'text-green-600' : margin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                {margin.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Supplier and Date */}
          <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
            <span>
              Supplier: {product.suppliers[0]?.supplierId?.name || 'No supplier'}
            </span>
            <span>
              Added {formatDate(product.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ProductsPage({ searchParams }) {
  const products = await getProducts(searchParams);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-slate-600 mt-2">
              Manage your product catalog and inventory items
            </p>
          </div>
          <Link 
            href="/products/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <HiPlus className="w-4 h-4" />
            Add Product
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search products by name, SKU, or barcode..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="accessories">Accessories</option>
              <option value="clothing">Clothing</option>
            </select>

            {/* Status Filter */}
            <select className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* More Filters Button */}
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              <HiFilter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-600">
            Showing {products.data.length} of {products.pagination.total} products
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Sort by:</span>
            <select className="text-sm border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="name">Name</option>
              <option value="sku">SKU</option>
              <option value="price">Price</option>
              <option value="created">Date Added</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          {products.data.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* Empty State */}
        {products.data.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <HiCube className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No products found</h3>
            <p className="text-slate-600 mb-6">
              Get started by adding your first product to the catalog.
            </p>
            <Link 
              href="/products/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <HiPlus className="w-4 h-4" />
              Add Product
            </Link>
          </div>
        )}

        {/* Pagination */}
        {products.pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
              Previous
            </button>
            {Array.from({ length: products.pagination.pages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  i + 1 === products.pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}