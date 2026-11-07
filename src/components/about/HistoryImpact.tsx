import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, TrendingUp, Globe, Award } from "lucide-react";

const milestones = [
  { year: "2008", title: "Founded", description: "DFSA established as the first organisation to import dragon fruit planting material into Africa" },
  { year: "2012", title: "100+ Varieties", description: "Expanded collection to over 100 dragon fruit cultivars from around the world" },
  { year: "2015", title: "Export Operations", description: "Began exporting plants to neighbouring African countries including Botswana, Zimbabwe, Zambia" },
  { year: "2018", title: "10 Year Anniversary", description: "Celebrated a decade of dragon fruit excellence and industry development" },
  { year: "2020", title: "Commercial Partnerships", description: "Launched commercial farm packages for large-scale operations" },
  { year: "2024", title: "Worldwide Export", description: "Now shipping premium cultivars to farmers worldwide with university research partnerships" },
];

const impactStats = [
  { icon: TrendingUp, value: "Hundreds", label: "Hectares under production in SA" },
  { icon: Globe, value: "6+", label: "African countries with DFSA farms" },
  { icon: Award, value: "#1", label: "High-value crop in Africa" },
];

export const HistoryImpact = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Our <span className="text-gradient-tropical">History & Impact</span>
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            DFSA dates back to 2008 and is described as the first organisation to import dragon fruit 
            planting material into Africa, working with universities on cultivar, pest and disease research.
            It has helped grow the South African industry from a niche crop to hundreds of hectares under production.
          </p>
        </motion.div>

        {/* Impact Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {impactStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-2xl font-display font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-dragon-green via-dragon-pink to-dragon-green hidden md:block" />

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-8 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <Card className="glass-card inline-block">
                    <CardContent className="p-6">
                      <span className="text-2xl font-display font-bold text-primary">{milestone.year}</span>
                      <h3 className="font-semibold mt-1">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="hidden md:flex w-4 h-4 rounded-full bg-primary border-4 border-background shadow-lg z-10" />
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
