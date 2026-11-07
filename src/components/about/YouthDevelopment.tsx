import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, Briefcase, Sprout } from "lucide-react";

const initiatives = [
  {
    icon: Users,
    title: "Youth Farms Established",
    description: "DFSA has established numerous youth farms for upcoming dragon fruit farmers, providing training and creating employment opportunities in agriculture."
  },
  {
    icon: GraduationCap,
    title: "Training Programmes",
    description: "Youth projects in KwaZulu-Natal and other provinces train young people to produce fresh dragon fruit, dried fruit and value-added products such as dragon-fruit flower honey."
  },
  {
    icon: Briefcase,
    title: "Training Centre & Outgrower Scheme",
    description: "Dragon Fruit Farming Training Centre & Outgrower Scheme projects in South Africa and Zambia aim to create training hubs and outgrower networks across SADC."
  },
  {
    icon: Sprout,
    title: "Smallholder Support",
    description: "Dedicated programmes for youth and smallholders to establish profitable dragon fruit operations with full technical backing."
  }
];

export const YouthDevelopment = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-dragon-dark to-dragon-dark/90 text-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Youth Development & <span className="text-dragon-lime">Training</span>
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Empowering the next generation of African farmers through comprehensive training 
            and support programmes across the continent.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {initiatives.map((initiative, index) => (
            <motion.div
              key={initiative.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dragon-lime to-dragon-green flex items-center justify-center mx-auto mb-4">
                    <initiative.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2 text-white">{initiative.title}</h3>
                  <p className="text-sm text-white/70">{initiative.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
