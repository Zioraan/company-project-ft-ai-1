import Link from "next/link";

export function Header() {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link className="brand" href="/">
          Nexova
        </Link>
        <nav className="nav" aria-label="Primary">
          <Link href="/#services">Services</Link>
          <Link href="/#why">Why Nexova</Link>
          <Link href="/#contact">Contact</Link>
          <Link href="/signup">Talent</Link>
        </nav>
      </div>
    </header>
  );
}
