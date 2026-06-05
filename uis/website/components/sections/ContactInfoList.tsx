interface ContactInfoItem {
  label: string;
  value: string;
  href?: string;
}

const CONTACT_ITEMS: ContactInfoItem[] = [
  {
    label: "Email",
    value: "contacto@nexova.com",
    href: "mailto:contacto@nexova.com",
  },
  {
    label: "Valencia",
    value: "+34 960 123 456",
    href: "tel:+34960123456",
  },
  {
    label: "Miami",
    value: "+1 305 555 0191",
    href: "tel:+13055550191",
  },
];

function ContactInfoCard({ label, value, href }: ContactInfoItem) {
  const content = href ? (
    <a href={href} aria-label={`${label} contact`}>
      {value}
    </a>
  ) : (
    value
  );

  return (
    <article className="card">
      <h3>{label}</h3>
      <p>{content}</p>
    </article>
  );
}

export function ContactInfoList() {
  return (
    <div className="grid-3" role="list" aria-label="Contact channels">
      {CONTACT_ITEMS.map((item) => (
        <div key={item.label} role="listitem">
          <ContactInfoCard {...item} />
        </div>
      ))}
    </div>
  );
}
