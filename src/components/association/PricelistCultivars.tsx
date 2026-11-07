import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { Leaf, Sparkles, Scale, Sun, Grape, Crown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const cultivarPackages = [
  {
    name: 'Ruby Export Cultivar',
    tagline: 'Premium High Yield Export Variety',
    icon: Crown,
    gradient: 'from-red-500 to-pink-600',
    packages: [
      { type: '150 Ruby Export Package', plants: '150 Plants', price: 'R 7,410' },
      { type: '600 Ruby Commercial Package', plants: '600 Plants', price: 'R 23,400' },
      { type: '1000 Ruby Plantation Package', plants: '1000 Plants', price: 'R 29,900' },
    ],
  },
  {
    name: 'Sweet White Cultivar',
    tagline: 'Exceptional Sweetness',
    icon: Sparkles,
    gradient: 'from-gray-100 to-gray-300',
    packages: [
      { type: '150 Sweet White Package', plants: '150 Plants', price: 'R 7,410' },
      { type: '600 Sweet White Commercial', plants: '600 Plants', price: 'R 23,400' },
      { type: '1000 Sweet White Plantation', plants: '1000 Plants', price: 'R 29,900' },
    ],
  },
  {
    name: 'Vietnamese Giant White',
    tagline: 'Large Premium Fruit',
    icon: Scale,
    gradient: 'from-emerald-400 to-green-600',
    packages: [
      { type: '150 Giant White Package', plants: '150 Plants', price: 'R 10,440' },
      { type: '600 Giant White Commercial', plants: '600 Plants', price: 'R 26,100' },
      { type: '1000 Giant White Plantation', plants: '1000 Plants', price: 'R 46,400' },
    ],
  },
  {
    name: 'Purple Haze Cultivar',
    tagline: 'Deep Color Premium Variety',
    icon: Grape,
    gradient: 'from-purple-500 to-violet-600',
    packages: [
      { type: '150 Purple Haze Package', plants: '150 Plants', price: 'R 10,440' },
      { type: '600 Purple Haze Commercial', plants: '600 Plants', price: 'R 26,100' },
      { type: '1000 Purple Haze Plantation', plants: '1000 Plants', price: 'R 46,400' },
    ],
  },
  {
    name: 'Zamorano Cultivar',
    tagline: 'Robust Commercial Performer',
    icon: Leaf,
    gradient: 'from-lime-500 to-green-600',
    packages: [
      { type: '150 Zamorano Package', plants: '150 Plants', price: 'R 8,265' },
      { type: '600 Zamorano Commercial', plants: '600 Plants', price: 'R 26,100' },
      { type: '1000 Zamorano Plantation', plants: '1000 Plants', price: 'R 33,350' },
    ],
  },
  {
    name: 'Gold (Israel) Cultivar',
    tagline: 'Premium Yellow Dragon Fruit',
    icon: Sun,
    gradient: 'from-yellow-400 to-amber-500',
    packages: [
      { type: '600 Gold Israel Package', plants: '600 Plants', price: 'R 29,900' },
      { type: '1000 Gold Israel Package', plants: '1000 Plants', price: 'R 45,500' },
    ],
  },
];

const cultivarDetails = [
  {
    name: 'Ruby Red (Pink Magenta)',
    subtitle: 'Premium Flagship Cultivar',
    botanical: 'Hylocereus costaricensis hybrid',
    marketClass: 'Premium Export Cultivar',
    overview: 'Ruby Red is our flagship premium dragon fruit cultivar developed by the Wonderful Dragon Fruit South Africa breeding program. It was specifically selected for exceptional sweetness, vibrant magenta flesh colour, and very large fruit size.',
    weight: '800 g – 1.2 kg (Max up to 1.5 kg)',
    sweetness: '18 – 22 Brix',
    pollination: 'Self-pollinating. Recommended: 2–4 beehives per hectare.',
    gradient: 'from-red-500 to-pink-600',
  },
  {
    name: 'Sweet White Dragon Fruit',
    subtitle: 'High-Yield Commercial White',
    botanical: 'Hylocereus undatus',
    marketClass: 'Commercial Cultivar',
    overview: 'A vigorous and reliable commercial cultivar widely cultivated for its consistent yields and refreshing sweetness.',
    weight: '400 g – 700 g (Max up to 900 g)',
    sweetness: '14 – 18 Brix',
    pollination: 'Self-pollinating. Recommended: 2–4 beehives per hectare.',
    gradient: 'from-gray-300 to-gray-500',
  },
  {
    name: 'Vietnamese Giant White',
    subtitle: 'Large Premium Fruit',
    botanical: 'Hylocereus undatus',
    marketClass: 'Premium Commercial',
    overview: 'Renowned for producing large attractive fruit, rapid growth, and dependable flowering cycles.',
    weight: '600 g – 900 g (Max up to 1.2–1.3 kg)',
    sweetness: '15 – 17 Brix',
    pollination: 'Self-pollinating. Recommended: 2–4 beehives per hectare.',
    gradient: 'from-emerald-400 to-green-600',
  },
  {
    name: 'Israel Gold',
    subtitle: 'Premium Specialty Yellow',
    botanical: 'Hylocereus undatus',
    marketClass: 'Premium Specialty',
    overview: 'A premium yellow dragon fruit highly prized for its extreme flavour intensity and unique appearance.',
    weight: '350 g – 550 g (Max up to 800 g)',
    sweetness: '19 – 23 Brix',
    pollination: 'Non-self-pollinating. Cross-pollination is required.',
    gradient: 'from-yellow-400 to-amber-500',
  },
  {
    name: 'Purple Haze – XXL Fruit Sweet',
    subtitle: 'Deep Color Premium Variety',
    botanical: 'Hylocereus hybrid',
    marketClass: 'Premium Market',
    overview: 'A well-known hybrid producing large fruit with deep purple flesh. Heavily sought after in premium markets.',
    weight: '600 g – 900 g (Max up to 1.3 kg)',
    sweetness: '18 – 20 Brix',
    pollination: 'Self-pollinating.',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    name: 'Zamorano',
    subtitle: 'Robust Commercial Performer',
    botanical: 'Hylocereus polyrhizus hybrid',
    marketClass: 'Commercial',
    overview: 'A highly productive commercial hybrid developed in Central America with incredible plant vigor.',
    weight: '450 g – 750 g (Max up to 1 kg)',
    sweetness: '16 – 19 Brix',
    pollination: 'Non-self-pollinating. Cross-pollination significantly improves size.',
    gradient: 'from-lime-500 to-green-600',
  },
];

export function PackagePricing() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div {...fadeIn} className="text-center mb-12">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary font-medium mb-4 text-sm">
            Official Price List — 16 March 2025
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Commercial Dragon Fruit <span className="text-gradient-dragon">Plant Packages</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Invest in top-tier plant material designed for commercial success and high yields. All prices in South African Rand (ZAR).
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {cultivarPackages.map((cultivar, idx) => (
            <motion.div
              key={cultivar.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="h-full border-border/50 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cultivar.gradient} flex items-center justify-center mb-3`}>
                    <cultivar.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{cultivar.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{cultivar.tagline}</p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Package</TableHead>
                        <TableHead className="text-xs text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cultivar.packages.map((pkg) => (
                        <TableRow key={pkg.type}>
                          <TableCell className="text-sm py-2">
                            <div className="font-medium">{pkg.plants}</div>
                          </TableCell>
                          <TableCell className="text-sm py-2 text-right font-semibold text-primary">
                            {pkg.price}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4">
                    <WhatsAppButton
                      message={`Hi! I'm interested in the ${cultivar.name} packages. Please share more details.`}
                      className="w-full"
                      
                    >
                      Enquire Now
                    </WhatsAppButton>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Package Bonuses */}
        <motion.div {...fadeIn} className="max-w-4xl mx-auto mt-12 space-y-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <h3 className="font-display font-bold text-lg mb-3">🎁 Premium Package Bonuses (600 & 1000 Plant Packages)</h3>
              <p className="text-sm text-muted-foreground">
                All 600 and 1000 plant packages include a <strong>Bonus USB Flash Drive</strong> containing: Documentation & Training on Dragon Fruit Farming; Research on plant, fruit, and production; Educational videos from Universities and Farms covering growth, cultivation, harvesting, and production; Detailed recommendations for Fertilizing, Pest Management, and Disease Management. Additionally includes a <strong>Box of Free Sample Testing Varieties (Mixed)</strong> and a <strong>Cultivar Certificate</strong>.
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <h3 className="font-display font-bold text-lg mb-3">🏆 Exclusive 1000 Plant Plantation Package Extras</h3>
              <p className="text-sm text-muted-foreground">
                Includes all the above PLUS: <strong>Full Membership for the African Dragon Fruit Association</strong> and the ability to add <strong>4 numbers per farm</strong> to our platform for enhanced exposure and support.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

export function CultivarGuide() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div {...fadeIn} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Commercial <span className="text-gradient-dragon">Cultivar Guide</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Selecting the right cultivar is the foundation of a highly profitable orchard. Our genetics are rigorously selected for strong plant vigor, reliable production cycles, and superior market appeal.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {cultivarDetails.map((cultivar, idx) => (
            <motion.div
              key={cultivar.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="h-full border-border/50 hover:border-primary/50 transition-all">
                <CardHeader className="pb-3">
                  <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${cultivar.gradient} text-white text-xs font-bold mb-2`}>
                    {cultivar.subtitle}
                  </div>
                  <CardTitle className="text-xl">{cultivar.name}</CardTitle>
                  <p className="text-xs text-muted-foreground italic">{cultivar.botanical}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{cultivar.overview}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Avg. Fruit Weight</p>
                      <p className="text-sm font-semibold">{cultivar.weight}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Sweetness (Brix)</p>
                      <p className="text-sm font-semibold">{cultivar.sweetness}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Pollination</p>
                    <p className="text-sm font-medium">{cultivar.pollination}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
