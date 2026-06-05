interface ServiceCard {
  title: string;
  bullets: string[];
}

import { SectionContainer } from "./SectionContainer";

const SERVICES: ServiceCard[] = [
  {
    title: "Executive Headhunting",
    bullets: [
      "Search and selection of executive and mid-management profiles",
      "Personalized process with replacement guarantee",
    ],
  },
  {
    title: "Customer Support Outsourcing",
    bullets: [
      "Specialized teams for technology companies",
      "Continuous training and dedicated supervision",
    ],
  },
  {
    title: "Corporate Training",
    bullets: [
      "Soft skills and leadership programs",
      "In-person and online courses adapted to each organization",
    ],
  },
];

export function ServicesSection() {
  return (
    <SectionContainer id="services" className="section">
      <h2>Services</h2>
      <div className="grid-3">
        {SERVICES.map((service) => (
          <article className="card" key={service.title}>
            <h3>{service.title}</h3>
            <ul>
              {service.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </SectionContainer>
  );
}
