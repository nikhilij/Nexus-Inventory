import Link from 'next/link';
import {
  HiCube,
  HiShoppingCart,
  HiTruck,
  HiUsers,
  HiChartBar,
  HiExclamationTriangle,
  HiArrowUp,
  HiArrowDown,
  HiClock,
} from 'react-icons/hi2';

// Mock data for demonstration since we don't have a real database connection
async function getDashboardData() {
  // In a real implementation, this would fetch from the database
  return {
    stats: {
      totalProducts: 1247,
      totalInventoryValue: 284750,
      lowStockItems: 23,
      pendingOrders: 8,
      activeWarehouses: 3,
      totalSuppliers: 45,
    },
    recentActivity: [
      {
        id: 1,
        type: 'inbound',
        message: 'Received 50 units of SKU-001 at Main Warehouse',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        icon: HiArrowUp,
        color: 'text-green-600'
      },
      {
        id: 2,
        type: 'outbound',
        message: 'Shipped 25 units of SKU-045 from Store #1',
        timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
        icon: HiArrowDown,
        color: 'text-blue-600'
      },
      {
        id: 3,
        type: 'adjustment',
        message: 'Stock adjustment: +5 units of SKU-123',
        timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
        icon: HiChartBar,
        color: 'text-yellow-600'
      },
      {
        id: 4,
        type: 'alert',
        message: 'Low stock alert: SKU-789 (2 units remaining)',
        timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
        icon: HiExclamationTriangle,
        color: 'text-red-600'
      },
    ],
    lowStockItems: [
      { id: 1, sku: 'SKU-789', name: 'Wireless Headphones', currentStock: 2, minStock: 10, warehouse: 'Main Warehouse' },
      { id: 2, sku: 'SKU-456', name: 'Bluetooth Speaker', currentStock: 5, minStock: 15, warehouse: 'Store #1' },
      { id: 3, sku: 'SKU-234', name: 'Phone Case', currentStock: 1, minStock: 20, warehouse: 'Distribution Center' },
    ],
    pendingOrders: [
      { id: 1, orderNumber: 'PO-2024-001', supplier: 'TechSupply Co.', total: 15420, expectedDate: '2024-01-25' },
      { id: 2, orderNumber: 'PO-2024-002', supplier: 'ElectroGoods Ltd.', total: 8950, expectedDate: '2024-01-27' },
    ]
  };
}

function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'text-blue-600', href }) {
  const content = (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↗' : '↘'} {trendValue}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-r ${color === 'text-blue-600' ? 'from-blue-50 to-blue-100' : 
          color === 'text-green-600' ? 'from-green-50 to-green-100' :
          color === 'text-yellow-600' ? 'from-yellow-50 to-yellow-100' :
          color === 'text-red-600' ? 'from-red-50 to-red-100' : 'from-slate-50 to-slate-100'}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatRelativeTime(date) {
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">
            Welcome back! Here&apos;s what&apos;s happening with your inventory today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Total Products"
            value={data.stats.totalProducts.toLocaleString()}
            icon={HiCube}
            color="text-blue-600"
            href="/products"
          />
          <StatCard
            title="Inventory Value"
            value={formatCurrency(data.stats.totalInventoryValue)}
            icon={HiChartBar}
            trend="up"
            trendValue="12%"
            color="text-green-600"
            href="/inventory"
          />
          <StatCard
            title="Low Stock Items"
            value={data.stats.lowStockItems}
            icon={HiExclamationTriangle}
            color="text-red-600"
            href="/inventory?filter=low-stock"
          />
          <StatCard
            title="Pending Orders"
            value={data.stats.pendingOrders}
            icon={HiShoppingCart}
            color="text-yellow-600"
            href="/orders"
          />
          <StatCard
            title="Warehouses"
            value={data.stats.activeWarehouses}
            icon={HiTruck}
            color="text-blue-600"
            href="/warehouses"
          />
          <StatCard
            title="Suppliers"
            value={data.stats.totalSuppliers}
            icon={HiUsers}
            color="text-slate-600"
            href="/suppliers"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <Link 
                href="/activity" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`p-2 rounded-lg bg-slate-100 ${activity.color}`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{activity.message}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <HiClock className="w-3 h-3" />
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Low Stock Alerts</h2>
              <Link 
                href="/inventory?filter=low-stock" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {data.lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50">
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-600">SKU: {item.sku}</p>
                    <p className="text-xs text-slate-500">{item.warehouse}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      {item.currentStock} / {item.minStock}
                    </p>
                    <p className="text-xs text-slate-500">Current / Min</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Pending Purchase Orders</h2>
            <Link 
              href="/orders" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all orders
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 font-medium text-slate-900">Order Number</th>
                  <th className="text-left py-3 font-medium text-slate-900">Supplier</th>
                  <th className="text-left py-3 font-medium text-slate-900">Total</th>
                  <th className="text-left py-3 font-medium text-slate-900">Expected Date</th>
                  <th className="text-left py-3 font-medium text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100">
                    <td className="py-3 font-medium text-blue-600">
                      <Link href={`/orders/${order.id}`} className="hover:text-blue-700">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 text-slate-900">{order.supplier}</td>
                    <td className="py-3 text-slate-900">{formatCurrency(order.total)}</td>
                    <td className="py-3 text-slate-900">{order.expectedDate}</td>
                    <td className="py-3">
                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/products/new" 
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-shadow"
          >
            <div className="p-2 bg-blue-50 rounded-lg">
              <HiCube className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Add Product</p>
              <p className="text-sm text-slate-600">Create new inventory item</p>
            </div>
          </Link>

          <Link 
            href="/orders/new" 
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-shadow"
          >
            <div className="p-2 bg-green-50 rounded-lg">
              <HiShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Create Order</p>
              <p className="text-sm text-slate-600">New purchase order</p>
            </div>
          </Link>

          <Link 
            href="/inventory/adjust" 
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-shadow"
          >
            <div className="p-2 bg-yellow-50 rounded-lg">
              <HiChartBar className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Adjust Stock</p>
              <p className="text-sm text-slate-600">Update inventory levels</p>
            </div>
          </Link>

          <Link 
            href="/suppliers/new" 
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-shadow"
          >
            <div className="p-2 bg-purple-50 rounded-lg">
              <HiUsers className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Add Supplier</p>
              <p className="text-sm text-slate-600">Register new vendor</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}