import { useEffect } from 'react';

export function LocalBusinessSchema() {
  useEffect(() => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': 'https://www.wonderfuldragonfruit.company/#organization',
      name: 'Wonderful Dragon Fruit South Africa',
      alternateName: ['DFSA', 'Wonderful Dragon Fruit South Africa', 'Wonderful Dragon Fruit South Africa', 'Healthy Fields'],
      url: 'https://www.wonderfuldragonfruit.company',
      logo: 'https://www.wonderfuldragonfruit.company/images/dfsa-logo.png',
      image: 'https://www.wonderfuldragonfruit.company/og-image.png',
      description: 'Premium dragon fruit cultivars, plants, and farming consultations. Establishing farms across Africa since 2008. Worldwide plant export.',
      foundingDate: '2008',
      founder: {
        '@type': 'Person',
        name: 'Max van Heerden',
        jobTitle: 'Founder & Lead Consultant',
      },
      telephone: '+27-83-447-4639',
      email: 'admin@proagrisa.co.za',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'ZA',
        addressRegion: 'South Africa',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: -25.7479,
        longitude: 28.2293,
      },
      areaServed: [
        { '@type': 'Country', name: 'South Africa' },
        { '@type': 'Country', name: 'Botswana' },
        { '@type': 'Country', name: 'Zambia' },
        { '@type': 'Country', name: 'Zimbabwe' },
        { '@type': 'Country', name: 'Uganda' },
        { '@type': 'Country', name: 'Namibia' },
        { '@type': 'Country', name: 'Malawi' },
      ],
      priceRange: 'R30 - R35,000',
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '17:00',
      },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+27-83-447-4639',
          contactType: 'sales',
          areaServed: 'ZA',
          availableLanguage: ['English', 'Afrikaans'],
        },
        {
          '@type': 'ContactPoint',
          telephone: '+1-351-777-2848',
          contactType: 'customer service',
          areaServed: 'Worldwide',
          availableLanguage: 'English',
        },
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Dragon Fruit Plants & Services',
        itemListElement: [
          {
            '@type': 'OfferCatalog',
            name: 'Dragon Fruit Cultivars',
            description: '100+ premium dragon fruit varieties',
          },
          {
            '@type': 'OfferCatalog',
            name: 'Farming Consultations',
            description: 'Professional dragon fruit farming consultations',
          },
          {
            '@type': 'OfferCatalog',
            name: 'Rooting Services',
            description: 'Professional plant rooting with 95%+ success rate',
          },
        ],
      },
    };

    let el = document.getElementById('json-ld-localbusiness') as HTMLScriptElement;
    if (!el) {
      el = document.createElement('script');
      el.id = 'json-ld-localbusiness';
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(jsonLd);

    return () => { el?.remove(); };
  }, []);

  return null;
}
