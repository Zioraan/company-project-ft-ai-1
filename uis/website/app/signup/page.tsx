import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { TalentSignupForm } from "../../components/TalentSignupForm";

export default function SignupPage() {
  return (
    <div className="page">
      <Header />
      <main className="container signup-main">
        <section className="notice" aria-label="Company hiring notice">
          Are you a company looking for talent? Write to us at
          contacto@nexova.com
        </section>

        <section className="hero">
          <h1 id="form-title">Join our talent pool</h1>
          <p>
            Complete your profile so our selection team can evaluate your fit
            for current and future opportunities.
          </p>
        </section>

        <TalentSignupForm />

        <p className="section">
          <Link href="/">Back to home</Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
