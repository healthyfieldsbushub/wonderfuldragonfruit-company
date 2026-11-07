import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Building2, MapPin, Phone, Mail, Globe, Check, CreditCard, Loader2, Star } from "lucide-react";
import { appClient } from "@/integrations/manus/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface Country {
  id: string;
  name: string;
  code: string;
  flag_emoji: string | null;
}

interface Province {
  id: string;
  name: string;
  country_id: string;
}

interface City {
  id: string;
  name: string;
  province_id: string;
}

const categories = [
  "Dragon Fruit Farm",
  "Agricultural Supplier",
  "Equipment Dealer",
  "Nursery",
  "Export Company",
  "Processing Facility",
  "Distribution",
  "Consulting Services",
  "Research Institution",
  "Other"
];

const subscriptionPrice = 200; // R200/month

export default function BusinessRegister() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  const [formData, setFormData] = useState({
    businessName: "",
    category: "",
    description: "",
    countryId: "",
    provinceId: "",
    cityId: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  });

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (formData.countryId) {
      fetchProvinces(formData.countryId);
      setFormData(prev => ({ ...prev, provinceId: "", cityId: "" }));
    }
  }, [formData.countryId]);

  useEffect(() => {
    if (formData.provinceId) {
      fetchCities(formData.provinceId);
      setFormData(prev => ({ ...prev, cityId: "" }));
    }
  }, [formData.provinceId]);

  const fetchCountries = async () => {
    const { data } = await appClient
      .from("african_countries")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (data) setCountries(data);
  };

  const fetchProvinces = async (countryId: string) => {
    const { data } = await appClient
      .from("provinces")
      .select("*")
      .eq("country_id", countryId)
      .eq("is_active", true)
      .order("name");
    if (data) setProvinces(data);
  };

  const fetchCities = async (provinceId: string) => {
    const { data } = await appClient
      .from("cities")
      .select("*")
      .eq("province_id", provinceId)
      .eq("is_active", true)
      .order("name");
    if (data) setCities(data);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to register your business");
      navigate("/login");
      return;
    }

    if (!formData.businessName || !formData.category || !formData.countryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Create the business listing
      const { data: listing, error: listingError } = await appClient
        .from("business_listings")
        .insert({
          user_id: user.id,
          business_name: formData.businessName,
          slug: generateSlug(formData.businessName),
          category: formData.category,
          description: formData.description,
          country_id: formData.countryId || null,
          province_id: formData.provinceId || null,
          city_id: formData.cityId || null,
          address: formData.address,
          phone: formData.phone,
          email: formData.email || user.email,
          website: formData.website,
          subscription_status: "pending",
          is_active: false,
        })
        .select()
        .single();

      if (listingError) throw listingError;

      // Get the subscription plan
      const { data: plan } = await appClient
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .single();

      if (!plan) throw new Error("No subscription plan available");

      // Create subscription record
      const { data: subscription, error: subError } = await appClient
        .from("business_subscriptions")
        .insert({
          business_id: listing.id,
          plan_id: plan.id,
          user_id: user.id,
          status: "pending",
          amount_paid_zar: subscriptionPrice,
        })
        .select()
        .single();

      if (subError) throw subError;

      // Initiate Yoco payment
      const returnUrl = `${window.location.origin}/directory?registered=success&business=${listing.id}`;
      const cancelUrl = `${window.location.origin}/directory/register?cancelled=true`;

      const response = await appClient.functions.invoke("yoco-payment", {
        body: {
          orderId: listing.id,
          amount: subscriptionPrice,
          currency: "ZAR",
          successUrl: returnUrl,
          cancelUrl: cancelUrl,
          customerEmail: user.email,
          metadata: {
            type: "business_subscription",
            businessId: listing.id,
            subscriptionId: subscription.id,
          },
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success || !response.data?.redirectUrl) {
        throw new Error(response.data?.error || "Payment initialization failed");
      }

      // Redirect to Yoco checkout
      window.location.href = response.data.redirectUrl;

    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to register business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <Badge variant="outline" className="mb-4">
              <Star className="h-3 w-3 mr-1" />
              African Farming Directory
            </Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4 text-gradient-dragon">
              Register Your Business
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join the premier directory for dragon fruit and agricultural businesses across Africa.
              Get discovered by customers, partners, and investors.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Registration Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2"
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Business Information
                  </CardTitle>
                  <CardDescription>
                    Fill in your business details to get listed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name *</Label>
                          <Input
                            id="businessName"
                            value={formData.businessName}
                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                            placeholder="Your Farm or Business Name"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Tell us about your business, products, and services..."
                          rows={4}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Location */}
                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Location
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Country *</Label>
                          <Select
                            value={formData.countryId}
                            onValueChange={(value) => setFormData({ ...formData, countryId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.id} value={country.id}>
                                  {country.flag_emoji} {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Province/State</Label>
                          <Select
                            value={formData.provinceId}
                            onValueChange={(value) => setFormData({ ...formData, provinceId: value })}
                            disabled={!formData.countryId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select province" />
                            </SelectTrigger>
                            <SelectContent>
                              {provinces.map((prov) => (
                                <SelectItem key={prov.id} value={prov.id}>{prov.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Select
                            value={formData.cityId}
                            onValueChange={(value) => setFormData({ ...formData, cityId: value })}
                            disabled={!formData.provinceId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {cities.map((city) => (
                                <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="123 Farm Road"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Info */}
                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        Contact Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+27 XX XXX XXXX"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Business Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="info@yourbusiness.com"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://www.yourbusiness.com"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full btn-sunset"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Continue to Payment - R{subscriptionPrice}/month
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pricing Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-card sticky top-24">
                <CardHeader className="text-center">
                  <Badge className="mx-auto mb-2 bg-primary">Monthly Plan</Badge>
                  <CardTitle className="text-3xl font-bold">
                    R{subscriptionPrice}
                    <span className="text-lg font-normal text-muted-foreground">/month</span>
                  </CardTitle>
                  <CardDescription>
                    Get your business listed and discovered
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      "Full business profile listing",
                      "Photo gallery (up to 10 images)",
                      "Contact form integration",
                      "Search visibility",
                      "Verified business badge",
                      "Featured placement option",
                      "Analytics dashboard",
                      "Priority support"
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Separator className="my-6" />
                  <div className="text-center text-sm text-muted-foreground">
                    <p>Secure payment via Yoco</p>
                    <p className="mt-1">Cancel anytime</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 Wonderful Dragon Fruit South Africa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
