import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
  Sparkles,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ImageIcon,
  Globe,
  Brain,
  BookOpen,
  Shield,
  Webhook,
  Bot,
  Key,
  MessageSquare,
  Inbox,
  Cpu,
  Truck,
  FileText,
  PenTool,
  Navigation,
  Building2,
  Tag,
  Upload,
  Send,
  FileUp,
  Facebook,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Navigation organized by functional areas
const navItems = [
  // Core Commerce
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Products', url: '/admin/products', icon: Package },
  { title: 'Product Audit', url: '/admin/product-audit', icon: Shield },
  { title: 'Categories', url: '/admin/categories', icon: FolderTree },
  { title: 'Bulk Import', url: '/admin/bulk-import', icon: Upload },
  { title: 'Product Image Folder', url: '/admin/product-images', icon: ImageIcon },
  { title: 'Orders', url: '/admin/orders', icon: ShoppingCart },
  { title: 'Customers', url: '/admin/customers', icon: Users },
  { title: 'Enquiries', url: '/admin/enquiries', icon: Inbox },
  { title: 'Shipping Rates', url: '/admin/shipping-rates', icon: Truck },
  { title: 'Promo Codes', url: '/admin/promo-codes', icon: Tag },
  { title: 'Quotations', url: '/admin/quotations', icon: FileText },
  
  // Content & Marketing
  { title: 'Blog Posts', url: '/admin/blog-posts', icon: PenTool },
  { title: 'Pages', url: '/admin/pages', icon: FileText },
  { title: 'Menus', url: '/admin/menus', icon: Navigation },
  { title: 'Catalogue', url: '/admin/catalogue', icon: BookOpen },
  { title: 'SEO Manager', url: '/admin/seo', icon: Globe },
  { title: 'Geo Content', url: '/admin/geo-content', icon: Globe },
  { title: 'Sitemap', url: '/admin/sitemap', icon: Globe },
  { title: 'robots.txt Audit', url: '/admin/robots-audit', icon: Shield },
  { title: 'SEO Validator', url: '/admin/seo-validator', icon: Shield },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  
  // Directory
  { title: 'Business Listings', url: '/admin/business-listings', icon: Building2 },
  { title: 'Country Distributors', url: '/admin/distributors', icon: Building2 },
  { title: 'Distributor Enquiries', url: '/admin/distributor-enquiries', icon: Inbox },
  { title: 'Farmer Documents', url: '/admin/distributor-documents', icon: FileUp },

  { title: 'Subscriptions', url: '/admin/subscriptions', icon: Tag },
  
  // AI Layer 2 - Central Configuration
  { title: 'AI Configuration', url: '/admin/ai-config', icon: Cpu },
  
  // AI Feature Pages (Layer 3)
  { title: 'AI Agents', url: '/admin/ai-agents', icon: Bot },
  { title: 'AI Assistant', url: '/admin/ai', icon: Sparkles },
  { title: 'AI Control', url: '/admin/ai-control', icon: Bot },
  { title: 'AI Images', url: '/admin/ai-images', icon: ImageIcon },
  { title: 'Code Audit', url: '/admin/code-audit', icon: Shield },
  
  // API Layer 1 - Credential Storage
  { title: 'API Vault', url: '/admin/api-vault', icon: Key },
  
  // Communication
  { title: 'WhatsApp', url: '/admin/whatsapp', icon: MessageSquare },
  { title: 'Social Inbox', url: '/admin/social-inbox', icon: Inbox },
  { title: 'Social Publisher', url: '/admin/social-publisher', icon: Send },
  { title: 'Facebook Pages', url: '/admin/facebook-pages', icon: Facebook },
  { title: 'Chat Settings', url: '/admin/chat-settings', icon: MessageSquare },
  { title: 'Knowledge Base', url: '/admin/knowledge-base', icon: Brain },
  
  // System
  { title: 'Webhooks', url: '/admin/webhooks', icon: Webhook },
  { title: 'API & Integrations', url: '/admin/api-integrations', icon: Key },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const { isLoading, signOut, profile } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/password/session', { credentials: 'include' })
      .then((response) => response.json())
      .then((result) => { if (active) setPasswordVerified(Boolean(result.verified)); })
      .catch(() => { if (active) setPasswordVerified(false); });
    return () => { active = false; };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!passwordVerified) {
    const verifyPassword = async (event: FormEvent) => {
      event.preventDefault();
      setPasswordLoading(true);
      setPasswordError('');
      try {
        const response = await fetch('/api/admin/password/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: adminPassword }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result?.error?.message || 'Admin password verification failed');
        setPasswordVerified(true);
        setAdminPassword('');
      } catch (error) {
        setPasswordError(error instanceof Error ? error.message : 'Admin password verification failed');
      } finally {
        setPasswordLoading(false);
      }
    };
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <form onSubmit={verifyPassword} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">Admin panel password</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter the website admin password to continue. No username is required.</p>
          </div>
          <Input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} autoFocus autoComplete="current-password" placeholder="Admin password" />
          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          <Button type="submit" className="w-full" disabled={passwordLoading || !adminPassword}>
            {passwordLoading ? 'Checking…' : 'Open admin panel'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative z-50 h-screen bg-card border-r transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            {!collapsed && (
              <Link to="/admin" className="font-display text-xl font-bold text-gradient">
                Admin
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex"
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.url || 
                (item.url !== '/admin' && location.pathname.startsWith(item.url));
              
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{item.title}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t">
            <div className={cn(
              "flex items-center gap-3 px-3 py-2",
              collapsed && "justify-center"
            )}>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                {profile?.full_name?.[0] || 'A'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {profile?.full_name || 'Admin'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Password-protected admin
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              onClick={async () => { await fetch('/api/admin/password/logout', { method: 'POST', credentials: 'include' }); await signOut(); }}
              className={cn("w-full mt-2", !collapsed && "justify-start")}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="h-16 flex items-center gap-4 px-4 border-b bg-card lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-display text-xl font-bold text-gradient">Admin</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
