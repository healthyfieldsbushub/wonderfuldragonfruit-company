import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Link2, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { setZohoRefreshToken } from '@/hooks/use-zoho-sync';

export default function AdminSettings() {
  const [zohoRefreshToken, setZohoToken] = useState('');
  const [isZohoConnected, setIsZohoConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('zoho_refresh_token');
    if (token) {
      setZohoToken(token);
      setIsZohoConnected(true);
    }
  }, []);

  const handleZohoConnect = () => {
    if (!zohoRefreshToken.trim()) {
      toast.error('Please enter a valid refresh token');
      return;
    }
    setZohoRefreshToken(zohoRefreshToken);
    setIsZohoConnected(true);
    toast.success('Zoho CRM connected successfully!');
  };

  const handleZohoDisconnect = () => {
    localStorage.removeItem('zoho_refresh_token');
    setZohoToken('');
    setIsZohoConnected(false);
    toast.success('Zoho CRM disconnected');
  };

  const getZohoAuthUrl = () => {
    const clientId = import.meta.env.VITE_ZOHO_CLIENT_ID || '1000.G8JYUA03KOBLX2OMDTC924YVJBLDMC';
    const redirectUri = encodeURIComponent(window.location.origin + '/admin/settings');
    const scope = encodeURIComponent('ZohoCRM.modules.ALL,ZohoCRM.settings.ALL');
    return `https://accounts.zoho.com/oauth/v2/auth?scope=${scope}&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${redirectUri}&prompt=consent`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">Configure integrations and store settings</p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="store">Store Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {/* Zoho CRM Integration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <span className="text-red-500 font-bold text-sm">Z</span>
                    </div>
                    <div>
                      <CardTitle>Zoho CRM</CardTitle>
                      <CardDescription>Sync customers, orders, and leads</CardDescription>
                    </div>
                  </div>
                  {isZohoConnected && (
                    <span className="flex items-center gap-1 text-sm text-green-500">
                      <Check className="h-4 w-4" />
                      Connected
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zoho-token">Refresh Token</Label>
                  <Input
                    id="zoho-token"
                    type="password"
                    placeholder="Enter your Zoho refresh token"
                    value={zohoRefreshToken}
                    onChange={(e) => setZohoToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your refresh token from the Zoho API Console after OAuth authorization.
                  </p>
                </div>

                <div className="flex gap-2">
                  {!isZohoConnected ? (
                    <>
                      <Button onClick={handleZohoConnect} className="btn-sunset">
                        <Link2 className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={getZohoAuthUrl()} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Get Auth Code
                        </a>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={handleZohoConnect}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update Token
                      </Button>
                      <Button variant="destructive" onClick={handleZohoDisconnect}>
                        Disconnect
                      </Button>
                    </>
                  )}
                </div>

                {isZohoConnected && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Automatic Sync</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      When connected, the following data syncs automatically:
                    </p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• New customers → Zoho Contacts</li>
                      <li>• Orders → Zoho Deals (with status updates)</li>
                      <li>• Contact form submissions → Zoho Leads</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Other Integrations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-500 font-bold text-sm">PF</span>
                  </div>
                  <div>
                    <CardTitle>PayFast</CardTitle>
                    <CardDescription>Payment gateway for South African Rand</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <Check className="h-4 w-4" />
                  Configured via environment secrets
                </span>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-500 font-bold text-sm">CG</span>
                  </div>
                  <div>
                    <CardTitle>The Courier Guy</CardTitle>
                    <CardDescription>Shipping and delivery integration</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <Check className="h-4 w-4" />
                  Configured via environment secrets
                </span>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="store" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Basic store settings and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Store Name</Label>
                  <Input defaultValue="African Vibe" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input defaultValue="orders@proagrisa.co.za" />
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Input defaultValue="ZAR" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Currency</Label>
                  <Input defaultValue="USD" disabled />
                </div>
              </div>
              <Button className="btn-sunset">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure automated email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Order Confirmations</p>
                    <p className="text-sm text-muted-foreground">Send to customers after purchase</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Shipping Updates</p>
                    <p className="text-sm text-muted-foreground">Notify when order ships</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">Alert admins when stock is low</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">New Order Alerts</p>
                    <p className="text-sm text-muted-foreground">Send to admin email</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5" />
                </label>
              </div>
              <Button className="btn-sunset">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
