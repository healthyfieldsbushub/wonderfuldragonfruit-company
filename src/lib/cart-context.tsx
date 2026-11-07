import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { trackAddToCart } from './analytics';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
  size?: string;
  includeRooting?: boolean;
}

// Professional rooting service: flat R30 per cutting (3–5 week turnaround).
export function calculateRootingPrice(totalPlants: number): number {
  return 30;
}

function calculateTotalRootingCost(items: CartItem[]): number {
  const itemsWithRooting = items.filter(item => item.includeRooting);
  if (itemsWithRooting.length === 0) return 0;
  
  const totalPlantsWithRooting = itemsWithRooting.reduce((sum, item) => sum + item.quantity, 0);
  const pricePerPlant = calculateRootingPrice(totalPlantsWithRooting);
  return totalPlantsWithRooting * pricePerPlant;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: { id: string; name: string; price: number; image: string; sku: string; size?: string }, includeRooting?: boolean) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  toggleRooting: (productId: string, includeRooting: boolean) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  rootingCost: number;
  totalWithRooting: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  lastAdded: CartItem | null;
  setLastAdded: (item: CartItem | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart');
      // Sanitize restored items: price must always be a number so cart
      // math never string-concatenates.
      return saved ? JSON.parse(saved).map((item: CartItem) => ({ ...item, price: Number(item.price) || 0, quantity: Number(item.quantity) || 1 })) : [];
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: { id: string; name: string; price: number; image: string; sku: string; size?: string }, includeRooting = false) => {
    setItems(prev => {
      // Same cultivar in two cutting sizes should appear as separate cart lines.
      const existing = prev.find(item => item.productId === product.id && item.size === (product.size || "20-30cm"));
      if (existing) {
        return prev.map(item =>
          item.productId === product.id && item.size === (product.size || "20-30cm")
            ? { ...item, quantity: item.quantity + 1, includeRooting: includeRooting || item.includeRooting }
            : item
        );
      }
      return [...prev, {
        id: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        // Coerce to number: price_zar can arrive as a string from the API
        // and string + math silently corrupts the cart total.
        price: Number(product.price) || 0,
        quantity: 1,
        image: product.image,
        sku: product.sku,
        size: product.size || "20-30cm",
        includeRooting,
      }];
    });
    trackAddToCart({ id: product.id, name: product.name, price: Number(product.price) || 0, sku: product.sku, quantity: 1 });
    setIsOpen(true);
    // Trigger the add-to-cart recommendation modal.
    setLastAdded({
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      quantity: 1,
      image: product.image,
      sku: product.sku,
      size: product.size || "20-30cm",
      includeRooting,
    });
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(itemId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const toggleRooting = (productId: string, includeRooting: boolean) => {
    setItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, includeRooting } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const rootingCost = calculateTotalRootingCost(items);
  const totalWithRooting = subtotal + rootingCost;

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      toggleRooting,
      clearCart,
      itemCount,
      subtotal,
      rootingCost,
      totalWithRooting,
      isOpen,
  setIsOpen,
  lastAdded,
  setLastAdded,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
