import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Search, Eye, Loader2, Package, Truck, CheckCircle, FileText, Download, Sprout, Mail, Trash2, Pencil, StickyNote } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateInvoicePDF } from '@/lib/invoice-generator';
import { sendRootingReadyEmail } from '@/lib/api';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500',
  processing: 'bg-blue-500/20 text-blue-500',
  paid: 'bg-green-500/20 text-green-500',
  shipped: 'bg-purple-500/20 text-purple-500',
  delivered: 'bg-green-600/20 text-green-600',
  cancelled: 'bg-red-500/20 text-red-500',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500',
  paid: 'bg-green-500/20 text-green-500',
  failed: 'bg-red-500/20 text-red-500',
  refunded: 'bg-orange-500/20 text-orange-500',
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<string | null>(null);
  const [isSendingRootingEmail, setIsSendingRootingEmail] = useState<string | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [editingTracking, setEditingTracking] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', search, statusFilter],
    queryFn: async () => {
      let query = appClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (search) {
        query = query.or(`order_number.ilike.%${search}%,guest_email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ['order-items', selectedOrder?.id],
    enabled: !!selectedOrder,
    queryFn: async () => {
      const { data, error } = await appClient
        .from('order_items')
        .select('*')
        .eq('order_id', selectedOrder.id);
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'shipped') {
        updates.shipped_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { error } = await appClient
        .from('orders')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateOrderDetailsMutation = useMutation({
    mutationFn: async ({ id, notes, tracking_number }: { id: string; notes: string; tracking_number: string }) => {
      const updates: any = { notes, tracking_number };
      // Auto-set shipped status if tracking number is added and status is paid/processing
      const { error } = await appClient
        .from('orders')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order details updated');
      setIsEditingDetails(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateRootingStatusMutation = useMutation({
    mutationFn: async ({ id, rootingStatus }: { id: string; rootingStatus: string }) => {
      const { error } = await appClient
        .from('orders')
        .update({ rooting_status: rootingStatus } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Rooting status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete order items first
      const { error: itemsError } = await appClient
        .from('order_items')
        .delete()
        .eq('order_id', id);
      if (itemsError) throw itemsError;
      
      // Delete payments
      const { error: paymentsError } = await appClient
        .from('payments')
        .delete()
        .eq('order_id', id);
      // Ignore if no payments exist
      
      // Delete order
      const { error } = await appClient
        .from('orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order deleted');
      setDeleteOrderId(null);
      setSelectedOrder(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDownloadInvoice = async (order: any) => {
    setIsGeneratingInvoice(order.id);
    try {
      const { data: items, error } = await appClient
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
      
      if (error) throw error;
      
      generateInvoicePDF(order, items || []);
      toast.success('Invoice downloaded!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate invoice');
    } finally {
      setIsGeneratingInvoice(null);
    }
  };

  const handleSendRootingReadyEmail = async (order: any) => {
    const email = order.guest_email || (order.shipping_address as any)?.email;
    if (!email) {
      toast.error('No email address found for this order');
      return;
    }
    
    setIsSendingRootingEmail(order.id);
    try {
      const result = await sendRootingReadyEmail(order.id, email);
      if (result.success) {
        toast.success('Rooting ready notification sent!');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setIsSendingRootingEmail(null);
    }
  };

  const hasRootingService = (order: any) => {
    return order.notes && order.notes.includes('Rooting Service:');
  };

  const openOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setEditingNotes(order.notes || '');
    setEditingTracking(order.tracking_number || '');
    setIsEditingDetails(false);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders, tracking & notes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : orders?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No orders found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">
                        {(order.shipping_address as any)?.name || order.guest_email || 'Guest'}
                      </p>
                      {order.guest_email && (
                        <p className="text-xs text-muted-foreground">{order.guest_email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.total_zar)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[order.status] || ''}`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${paymentStatusColors[order.payment_status] || 'bg-muted text-muted-foreground'}`}>
                      {order.payment_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {order.tracking_number ? (
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{order.tracking_number}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openOrderDetails(order)}
                        title="View & Edit"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadInvoice(order)}
                        disabled={isGeneratingInvoice === order.id}
                        title="Download Invoice"
                      >
                        {isGeneratingInvoice === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4 text-primary" />
                        )}
                      </Button>
                      {hasRootingService(order) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSendRootingReadyEmail(order)}
                          disabled={isSendingRootingEmail === order.id}
                          title="Send Rooting Ready Notification"
                        >
                          {isSendingRootingEmail === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sprout className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeleteOrderId(order.id)}
                        title="Delete Order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Order {selectedOrder?.order_number}</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${paymentStatusColors[selectedOrder?.payment_status] || 'bg-muted text-muted-foreground'}`}>
                  💳 {selectedOrder?.payment_status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${statusColors[selectedOrder?.status] || ''}`}>
                  {selectedOrder?.status}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer & Shipping Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Customer Info</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Name:</strong> {(selectedOrder.shipping_address as any)?.name || '—'}</p>
                    <p><strong>Email:</strong> {selectedOrder.guest_email || '—'}</p>
                    <p><strong>Phone:</strong> {(selectedOrder.shipping_address as any)?.phone || '—'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Shipping Address</h4>
                  {selectedOrder.shipping_address ? (
                    <p className="text-sm text-muted-foreground">
                      {(selectedOrder.shipping_address as any).name}<br />
                      {(selectedOrder.shipping_address as any).address}<br />
                      {(selectedOrder.shipping_address as any).city}, {(selectedOrder.shipping_address as any).province}<br />
                      {(selectedOrder.shipping_address as any).postalCode}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No address</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {orderItems?.map((item) => (
                    <div key={item.id} className="flex justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.product_sku} · Qty: {item.quantity} × {formatCurrency(item.unit_price_zar)}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.total_price_zar)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rooting Status Section */}
              {hasRootingService(selectedOrder) && (
                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-secondary" />
                    Rooting Service Status
                  </h4>
                  <Select
                    value={selectedOrder.rooting_status || 'pending'}
                    onValueChange={(rootingStatus) => {
                      updateRootingStatusMutation.mutate({ id: selectedOrder.id, rootingStatus });
                      setSelectedOrder({ ...selectedOrder, rooting_status: rootingStatus });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select rooting status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tracking & Notes Section */}
              <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    Tracking & Notes
                  </h4>
                  {!isEditingDetails && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingDetails(true)}>
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  )}
                </div>

                {isEditingDetails ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Tracking Number</Label>
                      <Input
                        value={editingTracking}
                        onChange={(e) => setEditingTracking(e.target.value)}
                        placeholder="Enter tracking number..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Notes</Label>
                      <Textarea
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        placeholder="Add order notes, shipping updates, etc..."
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="btn-sunset"
                        onClick={() => {
                          updateOrderDetailsMutation.mutate({
                            id: selectedOrder.id,
                            notes: editingNotes,
                            tracking_number: editingTracking,
                          });
                          setSelectedOrder({
                            ...selectedOrder,
                            notes: editingNotes,
                            tracking_number: editingTracking,
                          });
                        }}
                        disabled={updateOrderDetailsMutation.isPending}
                      >
                        {updateOrderDetailsMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingDetails(false);
                          setEditingNotes(selectedOrder.notes || '');
                          setEditingTracking(selectedOrder.tracking_number || '');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Tracking:</strong>{' '}
                      {selectedOrder.tracking_number || <span className="text-muted-foreground">Not set</span>}
                    </p>
                    <p>
                      <strong>Notes:</strong>{' '}
                      {selectedOrder.notes ? (
                        <span className="whitespace-pre-wrap">{selectedOrder.notes}</span>
                      ) : (
                        <span className="text-muted-foreground">No notes</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal_zar)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping ({selectedOrder.shipping_method || '—'})</span>
                  <span>{formatCurrency(selectedOrder.shipping_cost_zar || 0)}</span>
                </div>
                {(selectedOrder.promo_discount_zar > 0 || selectedOrder.discount_zar > 0) && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount {selectedOrder.promo_code && `(${selectedOrder.promo_code})`}</span>
                    <span>-{formatCurrency(selectedOrder.promo_discount_zar || selectedOrder.discount_zar || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total_zar)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Select
                  value={selectedOrder.status}
                  onValueChange={(status) => {
                    updateStatusMutation.mutate({ id: selectedOrder.id, status });
                    setSelectedOrder({ ...selectedOrder, status });
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  disabled={isGeneratingInvoice === selectedOrder.id}
                  className="btn-sunset"
                >
                  {isGeneratingInvoice === selectedOrder.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Invoice
                    </>
                  )}
                </Button>

                {hasRootingService(selectedOrder) && (
                  <Button
                    onClick={() => handleSendRootingReadyEmail(selectedOrder)}
                    disabled={isSendingRootingEmail === selectedOrder.id}
                    variant="outline"
                    className="border-secondary text-secondary hover:bg-secondary/10"
                  >
                    {isSendingRootingEmail === selectedOrder.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Sprout className="h-4 w-4 mr-2" />
                        Rooting Ready
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant="destructive"
                  onClick={() => setDeleteOrderId(selectedOrder.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={() => setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the order and all its items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrderId && deleteOrderMutation.mutate(deleteOrderId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrderMutation.isPending ? 'Deleting...' : 'Delete Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
