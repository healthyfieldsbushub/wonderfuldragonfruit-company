import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutStats } from "@/components/about/AboutStats";
import { WhatWeDo } from "@/components/about/WhatWeDo";
import { HistoryImpact } from "@/components/about/HistoryImpact";
import { FounderProfile } from "@/components/about/FounderProfile";
import { YouthDevelopment } from "@/components/about/YouthDevelopment";
import { Publications } from "@/components/about/Publications";
import { SocialMediaHub } from "@/components/about/SocialMediaHub";
import { AboutCTA } from "@/components/about/AboutCTA";
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { FAQSection, type FAQItem } from '@/components/seo/FAQSection';

const ABOUT_FAQS: FAQItem[] = [
  {
    question: 'Who is Wonderful Dragon Fruit South Africa (DFSA)?',
    answer:
      'DFSA — also trading as Wonderful Dragonfruit — is South Africa\'s leading commercial dragon fruit nursery and farming network, founded by Max van Heerden in 2008. We supply premium cultivars, training, rooting services and farm consultations to growers across Africa.',
  },
  {
    question: 'Where is DFSA located and which countries do you serve?',
    answer:
      'DFSA is headquartered in South Africa and ships across Africa, including Botswana, Zimbabwe, Namibia, Zambia, Malawi and Uganda. The same organisation, pricing and terms apply in every country we serve.',
  },
  {
    question: 'How long has DFSA been farming dragon fruit?',
    answer:
      'We have been growing, propagating and selling commercial dragon fruit since 2008 — over 17 years of hands-on cultivation, cultivar trials and farmer support.',
  },
  {
    question: 'Do you offer training and farm consultations?',
    answer:
      'Yes. We offer paid one-on-one consultations, group training and on-site farm visits. Visit /consultations or /education to book or learn more.',
  },
  {
    question: 'Can I become a DFSA Association member?',
    answer:
      'Yes. The DFSA Association connects growers, buyers and trainers across Africa with member pricing and trade access. See /association for details.',
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dragon Fruit Farm South Africa | Quality Dragon Fruit Plants Since 2008"
        description="Wonderful Dragon Fruit South Africa (DFSA) founded by Max van Heerden. South Africa's premier dragon fruit nursery supplying premium cultivars to farms across Africa and worldwide since 2008."
        keywords="dragon fruit farm south africa, dragon fruit south africa, DFSA, Max van Heerden, dragon fruit nursery, quality dragon fruit plants"
        url="/about"
      />
      <Header />
      <CartSidebar />
      <div className="container mx-auto px-4 pt-24">
        <Breadcrumbs items={[{ label: 'About DFSA' }]} />
      </div>
      
      <AboutHero />
      <AboutStats />
      <WhatWeDo />
      <HistoryImpact />
      <FounderProfile />
      <YouthDevelopment />
      <Publications />
      <SocialMediaHub />
      <FAQSection
        title="About DFSA — FAQs"
        description="Quick answers about Wonderful Dragon Fruit South Africa, our history, services and reach."
        faqs={ABOUT_FAQS}
      />
      <AboutCTA />
    </div>
  );
};

export default About;
