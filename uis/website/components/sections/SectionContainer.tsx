import type { ReactNode } from "react";

interface SectionContainerProps {
  id?: string;
  className?: string;
  children: ReactNode;
}

export function SectionContainer({
  id,
  className,
  children,
}: SectionContainerProps) {
  return (
    <section id={id} className={className}>
      <div className="section-container">{children}</div>
    </section>
  );
}
