import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    id: 1,
    name: 'J. van der Merwe',
    role: 'Commercial Grower',
    location: 'Limpopo, South Africa',
    avatar: '',
    rating: 5,
    text: 'The 1000-plant Ruby package was the best investment for our Limpopo farm. The DFSA team provided technical support that saved us months of trial and error.',
  },
  {
    id: 2,
    name: 'Thabo Molefe',
    role: 'Small-Scale Farmer',
    location: 'Mpumalanga, South Africa',
    avatar: '',
    rating: 5,
    text: 'The rooting service is excellent! All my cuttings arrived healthy and ready to plant. Customer support answered all my questions within hours.',
  },
  {
    id: 3,
    name: 'Sarah Ndlovu',
    role: 'Export Business Owner',
    location: 'KwaZulu-Natal, South Africa',
    avatar: '',
    rating: 5,
    text: 'Quality cultivars that produce fruit meeting export standards. Working with DFSA has transformed our export business. Highly recommended!',
  },
  {
    id: 4,
    name: 'P. Molefe',
    role: 'Farm Manager',
    location: 'Gaborone, Botswana',
    avatar: '',
    rating: 5,
    text: 'Excellent plant quality and professional shipping to Gaborone. The survival rate of the cuttings exceeded our expectations. DFSA provided detailed planting guides for our climate.',
  },
  {
    id: 5,
    name: 'M. Phiri',
    role: 'Agricultural Consultant',
    location: 'Lusaka, Zambia',
    avatar: '',
    rating: 5,
    text: 'I recommend DFSA to all my clients across southern Africa. Their knowledge of dragon fruit cultivation in African conditions is unmatched. True industry experts!',
  },
  {
    id: 6,
    name: 'David Moyo',
    role: 'Emerging Farmer',
    location: 'Harare, Zimbabwe',
    avatar: '',
    rating: 5,
    text: 'The commercial farm package gave me everything I needed to start. From soil preparation advice to ongoing support - professional service all the way.',
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            What Our <span className="text-gradient-tropical">Farmers Say</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of successful dragon fruit farmers across Africa who trust DFSA 
            for quality cultivars, expert advice, and reliable service.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 hover:border-dragon-pink/50 transition-colors duration-300 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Quote className="h-8 w-8 text-dragon-pink/30 flex-shrink-0" />
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-sahara-gold text-sahara-gold" />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} />
                      <AvatarFallback className="bg-gradient-tropical text-white font-semibold">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      <p className="text-xs text-dragon-green">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { value: '500+', label: 'Happy Farmers' },
            { value: '8+', label: 'African Countries' },
            { value: '15+', label: 'Years Experience' },
            { value: '99%', label: 'Satisfaction Rate' },
          ].map((stat, index) => (
            <div key={index} className="space-y-2">
              <p className="text-3xl md:text-4xl font-bold text-gradient-tropical">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
