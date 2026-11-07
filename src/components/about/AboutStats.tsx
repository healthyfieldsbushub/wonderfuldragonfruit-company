import { motion } from "framer-motion";

const stats = [
  { value: "16+", label: "Years Experience" },
  { value: "110+", label: "Cultivar Varieties" },
  { value: "8+", label: "Countries Served" },
  { value: "1000+", label: "Farmers Supported" },
];

export const AboutStats = () => {
  return (
    <section className="py-12 bg-gradient-to-r from-dragon-green to-dragon-pink">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center text-white"
            >
              <p className="text-4xl md:text-5xl font-display font-bold">{stat.value}</p>
              <p className="text-white/80 text-sm mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
