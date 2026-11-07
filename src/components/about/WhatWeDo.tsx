import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Wrench, 
  Leaf, 
  Users, 
  Award,
  MapPin,
  Microscope,
  ShieldCheck,
  Network
} from "lucide-react";

const services = [
  {
    icon: Wrench,
    title: "Technical Support & Farm Establishment",
    description: "Assistance with site selection, trellising systems, irrigation design and full 5-year production plans for new and existing dragon fruit farms (1–5 ha and larger).",
    details: "Detailed guidelines on water use, fertilisation programmes, pest and disease management and post-harvest handling."
  },
  {
    icon: Leaf,
    title: "Plant Material Supply & Certification",
    description: "Supply of premium, often self-pollinating dragon fruit varieties (Ruby, Purple Haze, Zamorano, Sweet White, Gold Israel and others) with variety certificates.",
    details: "Plants are treated and prepared to high phytosanitary standards before dispatch for local and export markets."
  },
  {
    icon: Network,
    title: "Grower Platform, Forum & Market Linkages",
    description: "DFSA membership platform and free forum where farmers share cultivation practices, export statistics, pest and disease experience and business tips.",
    details: "Platform for free advertising, linking dragon fruit farmers with potential buyers."
  },
  {
    icon: Award,
    title: "Association Membership Benefits",
    description: "Technical guidance from planting through harvest, farm visits, disease diagnosis and treatment recommendations.",
    details: "Access to both organic and conventional crop-protection inputs."
  }
];

export const WhatWeDo = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            What <span className="text-gradient-tropical">We Do</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            DFSA and the broader Dragon Fruit Association of Africa support growers in South Africa 
            and neighbouring countries with complete production guidelines, business planning and access to buyers.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full glass-card hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dragon-green to-dragon-pink flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <service.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold mb-2">{service.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                      <p className="text-xs text-muted-foreground/80">{service.details}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
