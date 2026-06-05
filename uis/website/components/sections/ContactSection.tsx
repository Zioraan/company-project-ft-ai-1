import { SectionContainer } from "./SectionContainer";
import { ContactInfoList } from "./ContactInfoList";

export function ContactSection() {
  return (
    <SectionContainer id="contact" className="section">
      <h2>Contact</h2>
      <ContactInfoList />
    </SectionContainer>
  );
}
