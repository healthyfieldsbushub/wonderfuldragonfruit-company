import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';
import { useAuth } from '@/lib/auth-context';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Sprout,
  Loader2,
  Search,
  ShoppingBag,
  MapPin,
  Calendar,
  ChevronRight,
  Leaf,
  AlertCircle,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-600', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-500/20 text-blue-600', icon: Package },
  paid: { label: 'Paid', color: 'bg-green-500/20 text-green-600', icon: CheckCircle },
  shipped: { label: 'Shipped', color: 'bg-purple-500/20 text-purple-600', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-600/20 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-600', icon: AlertCircle },
};

const rootingStatusConfig: Record<string, { label: string; color: string; progress: number }> = {
  pending: { label: 'Awaiting Start', color: 'bg-yellow-500', progress: 10 },
  in_progress: { label: 'Rooting in Progress', color: 'bg-blue-500', progress: 50 },
  ready: { label: 'Ready for Pickup/Shipping', color: 'bg-green-500', progress: 100 },
  shipped: { label: 'Shipped', color: 'bg-purple-500', progress: 100 },
};

export default function MyOrders() {
  const { user, isLoading: authLoading } = useAuth();
  const [guestEmail, setGuestEmail] = useState('');
  const [guestOrderNumber, setGuestOrderNumber] = useState('');
  const [guestAccessToken, setGuestAccessToken] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchOrderNumber, setSearchOrderNumber] = useState('');
  const [searchAccessToken, setSearchAccessToken] = useState('');

  // Fetch orders for logged-in users
  const { data: userOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await appClient
        .from('orders')
        .select('*')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch orders for guest users via secure edge function (requires email + order number OR access token)
  const { data: guestOrders, isLoading: guestLoading } = useQuery({
    queryKey: ['guest-orders', searchEmail, searchOrderNumber, searchAccessToken],
    enabled: !!searchEmail && (!!searchOrderNumber || !!searchAccessToken) && !user,
    queryFn: async () => {
      const { data, error } = await appClient.functions.invoke('guest-order-lookup', {
        body: {
          email: searchEmail,
          orderNumber: searchOrderNumber || undefined,
          accessToken: searchAccessToken || undefined,
        },
      });
      if (error) throw error;
      return data?.orders ?? [];
    },
  });

  // Fetch order items for display
  const orders = user ? userOrders : guestOrders;

  const { data: allOrderItems } = useQuery({
    queryKey: ['order-items', orders?.map((o: any) => o.id)],
    enabled: !!user && !!orders && orders.length > 0,
    queryFn: async () => {
      const orderIds = orders!.map((o: any) => o.id);
      const { data, error } = await appClient
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (error) throw error;
      return data;
    },
  });

  const handleGuestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchEmail(guestEmail.trim().toLowerCase());
    setSearchOrderNumber(guestOrderNumber.trim());
    setSearchAccessToken(guestAccessToken.trim());
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getOrderItems = (order: any) => {
    // Logged-in users: items fetched separately. Guests: items embedded by edge function.
    if (user) return allOrderItems?.filter((item) => item.order_id === order.id) || [];
    return order.order_items || [];
  };

  const hasRootingService = (order: any) => {
    return order.notes && order.notes.includes('Rooting Service:');
  };

  const parseRootingDetails = (notes: string) => {
    const match = notes.match(/(\d+) plants @ R([\d.]+)\/plant/);
    if (match) {
      return { plants: parseInt(match[1]), rate: parseFloat(match[2]) };
    }
    return null;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLoading = ordersLoading || guestLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              My Orders
            </h1>
            <p className="text-muted-foreground">
              Track your orders and rooting service status
            </p>
          </div>

          {/* Guest Email Search */}
          {!user && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Find Your Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGuestSearch} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Email used at checkout"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="text"
                    placeholder="Order number (e.g. ORD-20260101-ABC123)"
                    value={guestOrderNumber}
                    onChange={(e) => setGuestOrderNumber(e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="Or paste access token from your confirmation email"
                    value={guestAccessToken}
                    onChange={(e) => setGuestAccessToken(e.target.value)}
                  />
                  <Button
                    type="submit"
                    disabled={guestLoading || !guestEmail || (!guestOrderNumber && !guestAccessToken)}
                    className="w-full"
                  >
                    {guestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find My Orders'}
                  </Button>
                </form>
                <p className="text-sm text-muted-foreground mt-3">
                  For your security, we require your order number or access token (sent in your order confirmation email) in addition to your email.{' '}
                  <Link to="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>{' '}
                  for faster access to all your orders.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* No Orders State */}
          {!isLoading && (!orders || orders.length === 0) && (user || searchEmail) && (
            <Card className="text-center py-12">
              <CardContent>
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
                <p className="text-muted-foreground mb-6">
                  {user
                    ? "You haven't placed any orders yet."
                    : `No orders found for ${searchEmail}`}
                </p>
                <Button asChild>
                  <Link to="/products">Browse Products</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Orders List */}
          {orders && orders.length > 0 && (
            <div className="space-y-6">
              {orders.map((order, index) => {
                const items = getOrderItems(order);
                const status = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const hasRooting = hasRootingService(order);
                const rootingDetails = hasRooting ? parseRootingDetails(order.notes) : null;
                const rootingStatus = order.rooting_status 
                  ? rootingStatusConfig[order.rooting_status] 
                  : rootingStatusConfig.pending;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden">
                      {/* Order Header */}
                      <div className="bg-muted/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm text-muted-foreground">
                            Order #{order.order_number}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(order.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          {hasRooting && (
                            <Badge variant="outline" className="border-secondary text-secondary">
                              <Sprout className="h-3 w-3 mr-1" />
                              Rooting Service
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardContent className="p-4">
                        {/* Rooting Status Section */}
                        {hasRooting && (
                          <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-secondary/20">
                            <div className="flex items-center gap-2 mb-3">
                              <Leaf className="h-5 w-5 text-secondary" />
                              <h4 className="font-semibold text-secondary">Rooting Service Status</h4>
                            </div>

                            {rootingDetails && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {rootingDetails.plants} plants being rooted @ {formatCurrency(rootingDetails.rate)}/plant
                              </p>
                            )}

                            {/* Progress Bar */}
                            <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${rootingStatus.progress}%` }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className={`h-full ${rootingStatus.color} rounded-full`}
                              />
                            </div>

                            {/* Status Steps */}
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span className={order.rooting_status === 'pending' || !order.rooting_status ? 'text-secondary font-medium' : ''}>
                                Pending
                              </span>
                              <span className={order.rooting_status === 'in_progress' ? 'text-secondary font-medium' : ''}>
                                In Progress
                              </span>
                              <span className={order.rooting_status === 'ready' ? 'text-secondary font-medium' : ''}>
                                Ready
                              </span>
                              <span className={order.rooting_status === 'shipped' ? 'text-secondary font-medium' : ''}>
                                Shipped
                              </span>
                            </div>

                            <p className="text-sm mt-3 font-medium text-secondary">
                              Current: {rootingStatus.label}
                            </p>

                            {order.rooting_status !== 'ready' && order.rooting_status !== 'shipped' && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Estimated completion: 3-6 weeks from order date
                              </p>
                            )}
                          </div>
                        )}

                        {/* Order Items */}
                        <Accordion type="single" collapsible>
                          <AccordionItem value="items" className="border-none">
                            <AccordionTrigger className="py-2 hover:no-underline">
                              <span className="text-sm font-medium">
                                {items.length} item{items.length !== 1 ? 's' : ''} • {formatCurrency(order.total_zar)}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3 pt-2">
                                {items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                                  >
                                    <div>
                                      <p className="font-medium">{item.product_name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Qty: {item.quantity} × {formatCurrency(item.unit_price_zar)}
                                      </p>
                                    </div>
                                    <p className="font-medium">{formatCurrency(item.total_price_zar)}</p>
                                  </div>
                                ))}

                                <Separator />

                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(order.subtotal_zar)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>{formatCurrency(order.shipping_cost_zar || 0)}</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                                    <span>Total</span>
                                    <span className="text-primary">{formatCurrency(order.total_zar)}</span>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        {/* Shipping Address */}
                        {order.shipping_address && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <MapPin className="h-4 w-4" />
                              Shipping to:
                            </div>
                            <p className="text-sm">
                              {(order.shipping_address as any).name}<br />
                              {(order.shipping_address as any).address}<br />
                              {(order.shipping_address as any).city}, {(order.shipping_address as any).province} {(order.shipping_address as any).postalCode}
                            </p>
                          </div>
                        )}

                        {/* Tracking */}
                        {order.tracking_number && (
                          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Tracking: {order.tracking_number}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Help Section */}
          <Card className="mt-8">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Contact us for any questions about your order or rooting service.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" asChild>
                  <a href="mailto:orders@proagrisa.co.za">Email Support</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://wa.me/27834474639" target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}