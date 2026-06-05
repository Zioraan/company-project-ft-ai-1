import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ContactSection } from "../components/sections/ContactSection";
import { HeroSection } from "../components/sections/HeroSection";
import { ServicesSection } from "../components/sections/ServicesSection";
import { WhySection } from "../components/sections/WhySection";

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Nexova",
  description: "Human resources consulting and talent acquisition",
  url: "https://nexova.com",
  foundingDate: "2011",
  address: [
    {
      "@type": "PostalAddress",
      addressCountry: "ES",
      addressLocality: "Valencia",
      addressRegion: "Comunidad Valenciana",
    },
    {
      "@type": "PostalAddress",
      addressCountry: "US",
      addressLocality: "Miami",
      addressRegion: "Florida",
    },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+34-960-123-456",
    contactType: "customer service",
    availableLanguage: ["Spanish", "English"],
  },
  sameAs: [
    "https://linkedin.com/company/nexova",
    "https://instagram.com/nexova",
  ],
};

export default function WebsiteHomePage() {
  return (
    <div className="page">
      <Header />
      <main id="home" className="container home-main">
        <HeroSection />
        <ServicesSection />
        <WhySection />
        <ContactSection />
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
    </div>
  );
}
