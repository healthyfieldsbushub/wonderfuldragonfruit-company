import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play, Globe, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { useRef } from 'react';
import heroVideo from '@/assets/hero-dragon-fruit-farm.mp4';
import heroFallback from '@/assets/hero-dragon-farm.jpg';

const countries = [
  'South Africa', 'Botswana', 'Zambia', 'Zimbabwe', 'Uganda', 'Namibia', 'Malawi', 'Worldwide Export'
];

const scrollingText = "🐉 DRAGON FRUIT FARMING AFRICA • DFSA • HEALTHY FIELDS • SINCE 2008 • PREMIUM CULTIVARS • WORLDWIDE EXPORT • ";

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.5, 0.85]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <motion.div 
        className="absolute inset-0"
        style={{ scale }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={heroFallback}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
      </motion.div>
      
      {/* Multi-Layer Cinematic Gradient Overlays */}
      <motion.div 
        className="absolute inset-0"
        style={{ opacity: overlayOpacity }}
      >
        {/* Deep vignette with green/pink tones */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(140_60%_15%/0.4)_50%,hsl(150_40%_8%/0.9)_100%)]" />
        
        {/* Cinematic color grade - tropical tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-transparent to-slate-950/80" />
        
        {/* Dramatic side lighting with pink hints */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/50 via-transparent to-pink-950/40" />
        
        {/* Bottom film fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
      </motion.div>

      {/* Animated Film Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Scrolling Text Banner - Top */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-dragon-green via-dragon-pink to-dragon-green py-2 overflow-hidden z-20">
        <div className="flex whitespace-nowrap scroll-text">
          <span className="text-white font-bold text-sm tracking-wider mx-4">
            {scrollingText.repeat(6)}
          </span>
        </div>
      </div>

      {/* Lens Flare Effect - Pink/Green */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(330 80% 60% / 0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(140 60% 50% / 0.1) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Content with Parallax */}
      <motion.div 
        className="relative z-10 container mx-auto px-4 text-center text-white pt-16"
        style={{ y: textY }}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-6xl mx-auto"
        >
          {/* Since Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="inline-flex items-center gap-2 mb-4 px-5 py-2 rounded-full border border-emerald-400/40 bg-emerald-950/40 backdrop-blur-sm"
          >
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium tracking-widest uppercase text-emerald-200">
              Since 2008 • Premium Dragon Fruit Plants South Africa
            </span>
          </motion.div>
          
          {/* Epic Title - DFSA Brand */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display text-3xl md:text-4xl lg:text-5xl xl:text-[3rem] font-bold mb-4 leading-[1.05] tracking-tight"
          >
            <motion.span 
              className="block relative"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <span className="relative z-10 text-white drop-shadow-2xl">Wonderful Dragon Fruit South Africa</span>
            </motion.span>
            <motion.span 
              className="block relative mt-2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <span className="relative z-10" style={{ 
                background: 'linear-gradient(135deg, hsl(140 60% 55%), hsl(90 60% 50%), hsl(330 80% 60%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 30px hsl(140 60% 50% / 0.3))',
              }}>
                Worldwide Commercial Plant Supply
              </span>
              {/* Glow effect behind text */}
              <span className="absolute inset-0 blur-2xl opacity-40" style={{
                background: 'linear-gradient(135deg, hsl(140 60% 55%), hsl(330 80% 60%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Worldwide Commercial Plant Supply
              </span>
            </motion.span>
          </motion.h1>

          {/* DFSA Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20"
          >
            <span className="text-2xl md:text-3xl font-display font-bold text-gradient-tropical">DFSA</span>
            <div className="w-px h-8 bg-white/30" />
            <div className="text-left">
              <p className="text-sm font-semibold text-white/90">Wonderful Dragon Fruit South Africa</p>
              <p className="text-xs text-emerald-300/80">& Healthy Fields</p>
            </div>
          </motion.div>

          {/* Cinematic Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-base md:text-lg lg:text-xl text-white/75 mb-6 max-w-3xl mx-auto font-light leading-relaxed"
          >
            Leading the dragon fruit farming industry since 2008.
            <span className="text-pink-300/90"> We provide high-yield dragon fruit plants, expert consultation, and worldwide export services</span> — 
            from South Africa to Botswana, Zambia, Zimbabwe, Uganda, Namibia, Malawi, and beyond.
          </motion.p>

          {/* Countries Served */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {countries.map((country, index) => (
              <motion.span
                key={country}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + index * 0.05 }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm border border-white/20 text-white/80"
              >
                <Globe className="w-3 h-3 text-emerald-400" />
                {country}
              </motion.span>
            ))}
          </motion.div>

          {/* Epic CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/products">
              <Button 
                size="lg" 
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:via-emerald-300 hover:to-teal-400 text-white text-lg px-10 py-7 rounded-full shadow-2xl shadow-emerald-500/30 transition-all duration-500 hover:scale-105 hover:shadow-emerald-500/50"
              >
                <span className="relative z-10 flex items-center gap-2 font-semibold">
                  Shop Cultivars
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </Button>
            </Link>
            
            <Link to="/category/consulting-business-resources">
              <Button 
                size="lg" 
                className="group relative overflow-hidden bg-gradient-to-r from-pink-500 via-pink-400 to-rose-500 hover:from-pink-400 hover:via-pink-300 hover:to-rose-400 text-white text-lg px-8 py-7 rounded-full shadow-2xl shadow-pink-500/30 transition-all duration-500 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2 font-semibold">
                  <Play className="h-5 w-5" />
                  Book Consultation
                </span>
              </Button>
            </Link>

            <WhatsAppButton 
              message="Hi DFSA! I'm interested in your dragon fruit plants and services. Can you please provide more information?"
              className="text-lg px-8 py-7 rounded-full shadow-2xl shadow-[#25D366]/30 hover:scale-105 transition-all duration-500"
            >
              WhatsApp Us Now
            </WhatsAppButton>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scrolling Text Banner - Bottom */}
      <div className="absolute bottom-24 left-0 right-0 overflow-hidden z-20">
        <div className="flex whitespace-nowrap scroll-text-slow">
          <span className="text-white/20 font-display text-6xl md:text-8xl font-bold tracking-widest mx-8">
            {"DRAGON FRUIT • PITAYA • HEALTHY FIELDS • DFSA • AFRICA • CULTIVARS • ".repeat(4)}
          </span>
        </div>
      </div>

      {/* Cinematic Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      {/* Animated Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-white/40">Explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 bg-emerald-400/80 rounded-full"
          />
        </motion.div>
      </motion.div>

      {/* Side Decorative Elements - Leaf/Dragon Fruit inspired */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4"
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-16 bg-gradient-to-b from-emerald-400/50 to-transparent rounded-full"
            animate={{ scaleY: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4"
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-16 bg-gradient-to-b from-transparent to-pink-400/50 rounded-full"
            animate={{ scaleY: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, delay: i * 0.2 + 0.5, repeat: Infinity }}
          />
        ))}
      </motion.div>
    </section>
  );
}
