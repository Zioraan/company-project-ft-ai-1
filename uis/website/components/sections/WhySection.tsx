import { SectionContainer } from "./SectionContainer";

const WHY_ITEMS = [
  "12 years of experience in the Latin American market",
  "Regional presence: Spain and United States",
  "+500 successful selection processes completed",
  "Sector specialization in technology, retail, and finance",
] as const;

export function WhySection() {
  return (
    <SectionContainer id="why" className="section">
      <h2>Why Nexova</h2>
      <div className="grid-3">
        {WHY_ITEMS.map((item) => (
          <article className="card" key={item}>
            <p>{item}</p>
          </article>
        ))}
      </div>
    </SectionContainer>
  );
}
