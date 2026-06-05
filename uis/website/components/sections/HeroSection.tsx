import Link from "next/link";
import { SectionContainer } from "./SectionContainer";

export function HeroSection() {
  return (
    <SectionContainer className="hero">
      <p>Human-centered recruiting for growth</p>
      <h1>We build exceptional teams for growing companies</h1>
      <p>
        Human resources consulting and talent acquisition firm with over 10
        years helping technology, retail, and financial services companies find
        and develop the best talent.
      </p>
      <Link className="button" href="/signup">
        Join our talent pool
      </Link>
    </SectionContainer>
  );
}
