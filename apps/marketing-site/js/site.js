const LANGUAGE_KEY = "nexova-language";
const FALLBACK_LANGUAGE = "en";

const translations = {
  en: {
    skipToMain: "Skip to main content",
    navHome: "Home",
    navServices: "Services",
    navTalent: "Talent",
    navContact: "Contact",
    heroBadge: "Human-centered recruiting for growth",
    heroTitle: "We build exceptional teams for growing companies",
    heroSubtitle:
      "Human resources consulting and talent acquisition firm with over 10 years helping technology, retail, and financial services companies find and develop the best talent.",
    heroCta: "Join our talent pool",
    menuOpen: "Menu",
    menuClose: "Close",
    switchLanguage: "Switch language",
    servicesTitle: "Services",
    service1Title: "Executive Headhunting",
    service1Item1: "Search and selection of executive and mid-management profiles",
    service1Item2: "Personalized process with replacement guarantee",
    service2Title: "Customer Support Outsourcing",
    service2Item1: "Specialized teams for technology companies",
    service2Item2: "Continuous training and dedicated supervision",
    service3Title: "Corporate Training",
    service3Item1: "Soft skills and leadership programs",
    service3Item2: "In-person and online courses adapted to each organization",
    whyTitle: "Why Nexova",
    whyItem1: "12 years of experience in the Latin American market",
    whyItem2: "Regional presence: Spain and United States",
    whyItem3: "+500 successful selection processes completed",
    whyItem4: "Sector specialization in technology, retail, and finance",
    processTitle: "How our process works",
    process1: "1. We align role requirements and business goals",
    process2: "2. We source, evaluate, and shortlist high-fit profiles",
    process3: "3. We support onboarding and retention with measurable follow-up",
    resultsTitle: "Proof in numbers",
    resultsStat1Label: "Experience",
    resultsStat1Value: "12 years",
    resultsStat2Label: "Selection processes",
    resultsStat2Value: "+500",
    resultsStat3Label: "Regional presence",
    resultsStat3Value: "Spain + US",
    resultsStat4Label: "Specialized sectors",
    resultsStat4Value: "3 core industries",
    faqTitle: "Frequently asked questions",
    faqQ1: "How quickly will Nexova review my profile?",
    faqA1:
      "Our selection team reviews submissions continuously and prioritizes profiles based on active and upcoming searches.",
    faqQ2: "Can I apply if I am currently employed?",
    faqA2:
      "Yes. The form is designed for both active and passive job seekers who want to explore future opportunities.",
    faqQ3: "In which markets does Nexova operate?",
    faqA3:
      "Nexova operates from Valencia and Miami, supporting companies with regional and cross-border hiring needs.",
    contactTitle: "Contact",
    contactEmailLabel: "Email",
    contactValenciaLabel: "Valencia",
    contactMiamiLabel: "Miami",
    footerCopy: "© 2025 Nexova. All rights reserved.",
    companyNotice:
      "Are you a company looking for talent? Write to us at contacto@nexova.com",
    formTitle: "Join our talent pool",
    formSubtitle:
      "Complete your profile so our selection team can evaluate your fit for current and future opportunities.",
    formInstructions: "Fields marked with * are required.",
    legendPersonal: "Personal details",
    legendProfessional: "Professional profile",
    legendConsent: "Data policy",
    labelFullName: "Full name",
    labelEmail: "Email",
    labelPhone: "Phone",
    labelCountry: "Country of residence",
    labelExperience: "Years of experience",
    labelSector: "Sector of interest",
    labelEnglish: "English level",
    labelAvailability: "Availability",
    labelLinkedin: "LinkedIn (profile URL)",
    labelComments: "Additional comments",
    labelPolicy: "I accept the data policy",
    helpPhone: "Example: +34 612 345 678",
    helpLinkedin: "Optional, but recommended.",
    optionCountryDefault: "Select an option",
    optionCountrySpain: "Spain",
    optionCountryUs: "United States",
    optionCountryOther: "Other",
    optionSectorDefault: "Select an option",
    optionSectorTech: "Technology",
    optionSectorRetail: "Retail",
    optionSectorFinance: "Financial Services",
    optionSectorConsulting: "Consulting",
    optionSectorOther: "Other",
    optionEnglishDefault: "Select an option",
    optionEnglishBasic: "Basic",
    optionEnglishIntermediate: "Intermediate",
    optionEnglishAdvanced: "Advanced",
    optionEnglishNative: "Native",
    availabilityImmediate: "Immediate",
    availabilityOneMonth: "1 month",
    availabilityTwoThree: "2-3 months",
    availabilityExploring: "Just exploring",
    submitButton: "Submit application",
    backToHome: "Back to home",
    successTitle: "Thank you for your interest in Nexova!",
    successBody1:
      "We have received your information. Our selection team will review it and contact you if your profile matches any of our current or future opportunities.",
    successBody2:
      "In the meantime, follow us on LinkedIn to stay updated on our vacancies and professional development content."
  },
  es: {
    skipToMain: "Saltar al contenido principal",
    navHome: "Inicio",
    navServices: "Servicios",
    navTalent: "Talento",
    navContact: "Contacto",
    heroBadge: "Reclutamiento humano para crecer",
    heroTitle: "Construimos equipos excepcionales para empresas en crecimiento",
    heroSubtitle:
      "Firma de consultoria de recursos humanos y adquisicion de talento con mas de 10 anos ayudando a empresas de tecnologia, retail y servicios financieros a encontrar y desarrollar el mejor talento.",
    heroCta: "Unete a nuestra red de talento",
    menuOpen: "Menu",
    menuClose: "Cerrar",
    switchLanguage: "Cambiar idioma",
    servicesTitle: "Servicios",
    service1Title: "Headhunting Ejecutivo",
    service1Item1: "Busqueda y seleccion de perfiles ejecutivos y de mandos medios",
    service1Item2: "Proceso personalizado con garantia de reemplazo",
    service2Title: "Outsourcing de Atencion al Cliente",
    service2Item1: "Equipos especializados para empresas de tecnologia",
    service2Item2: "Capacitacion continua y supervision dedicada",
    service3Title: "Formacion Corporativa",
    service3Item1: "Programas de habilidades blandas y liderazgo",
    service3Item2: "Cursos presenciales y online adaptados a cada organizacion",
    whyTitle: "Por que Nexova",
    whyItem1: "12 anos de experiencia en el mercado latinoamericano",
    whyItem2: "Presencia regional: Espana y Estados Unidos",
    whyItem3: "+500 procesos de seleccion exitosos",
    whyItem4: "Especializacion sectorial en tecnologia, retail y finanzas",
    processTitle: "Como funciona nuestro proceso",
    process1: "1. Alineamos el perfil buscado con los objetivos del negocio",
    process2: "2. Buscamos, evaluamos y preseleccionamos perfiles de alto ajuste",
    process3: "3. Acompanamos onboarding y retencion con seguimiento medible",
    resultsTitle: "Resultados en cifras",
    resultsStat1Label: "Experiencia",
    resultsStat1Value: "12 anos",
    resultsStat2Label: "Procesos de seleccion",
    resultsStat2Value: "+500",
    resultsStat3Label: "Presencia regional",
    resultsStat3Value: "Espana + EE. UU.",
    resultsStat4Label: "Sectores especializados",
    resultsStat4Value: "3 industrias clave",
    faqTitle: "Preguntas frecuentes",
    faqQ1: "Con que rapidez Nexova revisara mi perfil?",
    faqA1:
      "Nuestro equipo de seleccion revisa postulaciones de forma continua y prioriza perfiles segun busquedas activas y proximas.",
    faqQ2: "Puedo postularme si actualmente estoy trabajando?",
    faqA2:
      "Si. El formulario esta pensado para profesionales en busqueda activa o pasiva que quieren explorar nuevas oportunidades.",
    faqQ3: "En que mercados opera Nexova?",
    faqA3:
      "Nexova opera desde Valencia y Miami, apoyando a empresas con necesidades de contratacion regionales y transfronterizas.",
    contactTitle: "Contacto",
    contactEmailLabel: "Correo",
    contactValenciaLabel: "Valencia",
    contactMiamiLabel: "Miami",
    footerCopy: "© 2025 Nexova. All rights reserved.",
    companyNotice:
      "Eres una empresa que busca talento? Escribenos a contacto@nexova.com",
    formTitle: "Unete a nuestra red de talento",
    formSubtitle:
      "Completa tu perfil para que nuestro equipo de seleccion pueda evaluar tu encaje en oportunidades actuales y futuras.",
    formInstructions: "Los campos marcados con * son obligatorios.",
    legendPersonal: "Datos personales",
    legendProfessional: "Perfil profesional",
    legendConsent: "Politica de datos",
    labelFullName: "Nombre completo",
    labelEmail: "Correo electronico",
    labelPhone: "Telefono",
    labelCountry: "Pais de residencia",
    labelExperience: "Anos de experiencia",
    labelSector: "Sector de interes",
    labelEnglish: "Nivel de ingles",
    labelAvailability: "Disponibilidad",
    labelLinkedin: "LinkedIn (URL del perfil)",
    labelComments: "Comentarios adicionales",
    labelPolicy: "Acepto la politica de datos",
    helpPhone: "Ejemplo: +34 612 345 678",
    helpLinkedin: "Opcional, pero recomendado.",
    optionCountryDefault: "Selecciona una opcion",
    optionCountrySpain: "Espana",
    optionCountryUs: "Estados Unidos",
    optionCountryOther: "Otro",
    optionSectorDefault: "Selecciona una opcion",
    optionSectorTech: "Tecnologia",
    optionSectorRetail: "Retail",
    optionSectorFinance: "Servicios financieros",
    optionSectorConsulting: "Consultoria",
    optionSectorOther: "Otro",
    optionEnglishDefault: "Selecciona una opcion",
    optionEnglishBasic: "Basico",
    optionEnglishIntermediate: "Intermedio",
    optionEnglishAdvanced: "Avanzado",
    optionEnglishNative: "Nativo",
    availabilityImmediate: "Inmediata",
    availabilityOneMonth: "1 mes",
    availabilityTwoThree: "2-3 meses",
    availabilityExploring: "Solo explorando",
    submitButton: "Enviar postulacion",
    backToHome: "Volver al inicio",
    successTitle: "Gracias por tu interes en Nexova!",
    successBody1:
      "Hemos recibido tu informacion. Nuestro equipo de seleccion la revisara y te contactara si tu perfil coincide con oportunidades actuales o futuras.",
    successBody2:
      "Mientras tanto, siguenos en LinkedIn para mantenerte al dia sobre vacantes y contenidos de desarrollo profesional."
  }
};

function getLanguage() {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (saved && Object.hasOwn(translations, saved)) {
    return saved;
  }
  return FALLBACK_LANGUAGE;
}

function setLanguage(language) {
  const nextLanguage = Object.hasOwn(translations, language)
    ? language
    : FALLBACK_LANGUAGE;

  localStorage.setItem(LANGUAGE_KEY, nextLanguage);
  document.documentElement.lang = nextLanguage;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const translated = translations[nextLanguage][key];
    if (typeof translated === "string") {
      element.textContent = translated;
    }
  });

  document.querySelectorAll("[data-lang-switch]").forEach((button) => {
    const isActive = button.dataset.langSwitch === nextLanguage;
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    button.classList.toggle("border-cyan-300/70", isActive);
    button.classList.toggle("border-cyan-300/40", !isActive);
  });

  document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
    button.setAttribute("aria-label", translations[nextLanguage].switchLanguage);
  });

  document.querySelectorAll("[data-lang-toggle-label]").forEach((label) => {
    label.textContent = nextLanguage.toUpperCase();
  });

  const mobileMenuToggle = document.querySelector("[data-mobile-menu-toggle]");
  const mobileMenuLabel = document.querySelector("[data-mobile-menu-label]");
  if (mobileMenuToggle && mobileMenuLabel) {
    const isExpanded = mobileMenuToggle.getAttribute("aria-expanded") === "true";
    mobileMenuLabel.textContent = isExpanded
      ? translations[nextLanguage].menuClose
      : translations[nextLanguage].menuOpen;
  }

  document.dispatchEvent(
    new CustomEvent("nexova-language-change", {
      detail: { language: nextLanguage }
    })
  );
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-lang-switch]").forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.langSwitch);
    });
  });

  document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const currentLanguage = getLanguage();
      const nextLanguage = currentLanguage === "en" ? "es" : "en";
      setLanguage(nextLanguage);
    });
  });

  const mobileMenuToggle = document.querySelector("[data-mobile-menu-toggle]");
  const mobileMenu = document.getElementById("mobile-primary-menu");
  const mobileMenuLabel = document.querySelector("[data-mobile-menu-label]");

  function closeMobileMenu() {
    if (!mobileMenuToggle || !mobileMenu) {
      return;
    }
    mobileMenuToggle.setAttribute("aria-expanded", "false");
    mobileMenu.hidden = true;

    const language = getLanguage();
    if (mobileMenuLabel) {
      mobileMenuLabel.textContent = translations[language].menuOpen;
    }
  }

  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener("click", () => {
      const isExpanded = mobileMenuToggle.getAttribute("aria-expanded") === "true";
      const nextExpanded = !isExpanded;

      mobileMenuToggle.setAttribute("aria-expanded", nextExpanded ? "true" : "false");
      mobileMenu.hidden = !nextExpanded;

      const language = getLanguage();
      if (mobileMenuLabel) {
        mobileMenuLabel.textContent = nextExpanded
          ? translations[language].menuClose
          : translations[language].menuOpen;
      }
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        closeMobileMenu();
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024) {
        closeMobileMenu();
      }
    });
  }

  setLanguage(getLanguage());
});

window.NEXOVA_I18N = {
  getLanguage,
  setLanguage,
  translations
};
