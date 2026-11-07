import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, BookOpen } from "lucide-react";

const publications = [
  {
    title: "Dragon Fruit Farming in South Africa – 5-Year Business Plan",
    author: "Dragon Fruit Association of Africa",
    description: "A full market, technical and financial plan including association benefits for prospective dragon fruit farmers.",
    type: "Business Plan"
  },
  {
    title: "Dragon Fruit Farming – 5-Year Investment Analysis",
    author: "Wonderful Dragonfruit",
    description: "Focuses on partnering with Wonderful Dragonfruit and DFSA to access superior plant material and markets.",
    type: "Investment Guide"
  },
  {
    title: "Dragon Fruit SA Business Proposal – DFSA International",
    author: "DFSA",
    description: "Historic proposal outlining DFSA's founding date (2008), varieties list and multi-hectare expansion model.",
    type: "Business Proposal"
  },
  {
    title: "Youth Farms Project KZN Dragon Fruit Initiative",
    author: "DFSA Youth Programme",
    description: "Youth-oriented project document for establishing dragon fruit farms in KwaZulu-Natal province.",
    type: "Youth Project"
  },
  {
    title: "Dragon Fruit Farming Training Centre & Outgrower Scheme",
    author: "DFSA & Partners",
    description: "Comprehensive plan for establishing training centres and outgrower networks across SADC region.",
    type: "Training Programme"
  }
];

const externalResources = [
  {
    title: "Wonderful Dragon Fruit South Africa (DFSA) – Main Information",
    url: "https://southafrica.co.za/dragon-fruit-south-africa.html",
    description: "Comprehensive information about dragon fruit farming in South Africa"
  },
  {
    title: "DFSA Membership, Youth Farms & Forum",
    url: "https://southafrica.co.za/membership-dragon-fruit-sa.html",
    description: "Join the DFSA community, access forums and youth farming programmes"
  },
  {
    title: "DFSA Blog & Information",
    url: "https://dragonfruitfarmsweetfruits.wordpress.com",
    description: "Latest news, tips and updates from Dragon Fruit Farm"
  }
];

export const Publications = () => {
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
            Publications & <span className="text-gradient-tropical">Resources</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access business plans, investment guides and training materials to help you 
            start and grow your dragon fruit farming operation.
          </p>
        </motion.div>

        {/* Publications Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {publications.map((pub, index) => (
            <motion.div
              key={pub.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full glass-card hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dragon-pink to-dragon-green flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {pub.type}
                      </span>
                      <h3 className="font-semibold mt-2 mb-1 line-clamp-2">{pub.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">By {pub.author}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{pub.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* External Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h3 className="font-display text-xl font-bold mb-6 text-center">
            <BookOpen className="h-5 w-5 inline-block mr-2 text-primary" />
            External Resources
          </h3>
          <div className="space-y-4">
            {externalResources.map((resource, index) => (
              <a
                key={resource.title}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="glass-card hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-sm">{resource.title}</h4>
                      <p className="text-xs text-muted-foreground">{resource.description}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-primary flex-shrink-0" />
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
