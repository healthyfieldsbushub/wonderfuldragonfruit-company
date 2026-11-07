import { X, Plus, Minus, ShoppingBag, Sprout } from 'lucide-react';
import { useCart, calculateRootingPrice } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function CartSidebar() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, toggleRooting, subtotal, rootingCost, totalWithRooting, itemCount } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
  };

  // Calculate total plants with rooting to show per-plant price
  const totalPlantsWithRooting = items.filter(i => i.includeRooting).reduce((sum, i) => sum + i.quantity, 0);
  const currentRootingRate = totalPlantsWithRooting > 0 ? calculateRootingPrice(totalPlantsWithRooting) : 30;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-lg glass-card-strong">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Your Cart ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Your cart is empty</p>
            <p className="text-muted-foreground mb-6">Add some dragon fruit cuttings!</p>
            <Button onClick={() => setIsOpen(false)} className="btn-sunset">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-4 p-3 rounded-lg bg-muted/50"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium line-clamp-1">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.sku}</p>
                      <p className="font-semibold text-primary mt-1">{formatPrice(item.price)}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Rooting service toggle */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`rooting-${item.id}`}
                                checked={item.includeRooting || false}
                                onCheckedChange={(checked) => toggleRooting(item.id, checked)}
                                className="data-[state=checked]:bg-green-600"
                              />
                              <label 
                                htmlFor={`rooting-${item.id}`} 
                                className="text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Sprout className="h-3 w-3 text-green-600" />
                                Add rooting
                              </label>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="text-xs">
                              Professional rooting service: flat R30 per cutting. Ready in 3–5 weeks — marked on your invoice.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              
              {rootingCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Sprout className="h-4 w-4 text-green-600" />
                    Rooting Service ({totalPlantsWithRooting} plants @ R{currentRootingRate.toFixed(2)}/ea)
                  </span>
                  <span className="text-green-600">{formatPrice(rootingCost)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span className="text-gradient-sunset">{formatPrice(totalWithRooting)}</span>
              </div>
              
              <p className="text-sm text-muted-foreground">Shipping calculated at checkout</p>
              <Link to="/checkout" onClick={() => setIsOpen(false)}>
                <Button className="w-full btn-sunset text-lg py-6">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
