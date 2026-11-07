import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

export const AboutHero = () => {
  return (
    <section className="relative pt-24 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-dragon-green/20 via-transparent to-dragon-pink/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.1),transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Calendar className="h-4 w-4" />
            Since 2008
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            About{" "}
            <span className="text-gradient-tropical">DFSA</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-4">
            Wonderful Dragon Fruit South Africa (DFSA) focuses on expanding the dragon fruit (pitaya) industry
            in South Africa and across Africa through high-quality planting material, grower training,
            technical support and market access services.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            DFSA began as a small nursery and became one of the first professional dragon fruit nurseries
            in Africa, helping many local and international farmers establish commercial dragon fruit farms.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
