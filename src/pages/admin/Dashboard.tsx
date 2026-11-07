import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BingCrawlWidget from '@/components/admin/BingCrawlWidget';

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  delay?: number;
}

function StatCard({ title, value, change, icon: Icon, delay = 0 }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <div className={`flex items-center text-xs mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span>{Math.abs(change)}% from last month</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        appClient.from('orders').select('total_zar, status, created_at'),
        appClient.from('products').select('id, stock_quantity'),
        appClient.from('customers').select('id'),
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const customers = customersRes.data || [];

      // The data API returns decimal columns as strings; coerce before summing.
      const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_zar) || 0), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const lowStock = products.filter(p => (p.stock_quantity || 0) < 5).length;

      return {
        totalRevenue,
        totalOrders: orders.length,
        pendingOrders,
        totalProducts: products.length,
        lowStock,
        totalCustomers: customers.length,
      };
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data } = await appClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          change={12.5}
          icon={DollarSign}
          delay={0}
        />
        <StatCard
          title="Orders"
          value={stats?.totalOrders?.toString() || '0'}
          change={8.2}
          icon={ShoppingCart}
          delay={0.1}
        />
        <StatCard
          title="Products"
          value={stats?.totalProducts?.toString() || '0'}
          change={-2.4}
          icon={Package}
          delay={0.2}
        />
        <StatCard
          title="Customers"
          value={stats?.totalCustomers?.toString() || '0'}
          change={15.3}
          icon={Users}
          delay={0.3}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders?.length === 0 ? (
                <p className="text-muted-foreground text-sm">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders?.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total_zar)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                          order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Inventory Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pending Orders</span>
                  <span className="font-bold text-yellow-500">{stats?.pendingOrders || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Low Stock Items</span>
                  <span className="font-bold text-red-500">{stats?.lowStock || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Products</span>
                  <span className="font-bold">{stats?.totalProducts || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bing crawl signals */}
      <BingCrawlWidget />
    </div>
  );
}
