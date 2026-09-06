import { Link } from "wouter";
import { ArrowLeft, Mail } from "lucide-react";

export function PrivacyPage() {
  return <InfoPage title="Privacy" intro="How LIBrepair handles information submitted through this website." sections={[
    ["Information you provide", "Account details, vehicle information, appointment requests, messages, and payment-related records may be collected when you use the platform."],
    ["How it is used", "Information is used to operate your account, coordinate requested services, process supported payments, send service communications, and maintain business records."],
    ["Your choices", "You may contact support to ask about your information or request an appropriate correction. Some records may need to be retained for legal, security, or transaction purposes."],
  ]} />;
}

export function TermsPage() {
  return <InfoPage title="Terms of Use" intro="Important conditions for using LIBrepair's website and booking tools." sections={[
    ["Service requests", "Submitting a request does not by itself guarantee availability, a final price, or completion time. Details are confirmed after the request is reviewed."],
    ["Estimates and fees", "Displayed starting prices and booking fees are informational. Parts, labor, taxes, travel, and the vehicle's condition may affect the final amount."],
    ["Customer responsibilities", "Provide accurate contact, vehicle, location, and issue details. Do not submit unlawful, misleading, or harmful content through the platform."],
  ]} />;
}

export function SupportPage() {
  return <InfoPage title="Support" intro="For help with an account, booking, payment record, vehicle listing, or service request, contact the support team." sections={[
    ["Email support", "Send the email address associated with your account and a short description of the issue. Do not include passwords or complete payment-card details."],
  ]} support />;
}

function InfoPage({ title, intro, sections, support = false }: { title: string; intro: string; sections: string[][]; support?: boolean }) {
  return <main className="min-h-screen px-6 py-12 md:py-20" style={{ background: "var(--color-bg)", color: "var(--color-white)" }}>
    <div className="max-w-3xl mx-auto">
      <Link to="/"><span className="inline-flex items-center gap-2 text-sm mb-12" style={{ color: "var(--color-silver)" }}><ArrowLeft size={16}/> Back to home</span></Link>
      <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-red)" }}>LIBrepair</p>
      <h1 className="text-4xl md:text-6xl font-bold mb-5" style={{ fontFamily: "Rajdhani" }}>{title}</h1>
      <p className="text-lg leading-relaxed mb-10" style={{ color: "var(--color-silver)" }}>{intro}</p>
      <div className="space-y-4">
        {sections.map(([heading, text]) => <section key={heading} className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>{heading}</h2>
          <p className="leading-relaxed" style={{ color: "var(--color-silver)" }}>{text}</p>
        </section>)}
      </div>
      {support && <a href="mailto:libsupport@librepair.com" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg mt-8 font-semibold text-white" style={{ background: "var(--color-red)" }}><Mail size={17}/> Email support</a>}
      <p className="text-xs mt-10" style={{ color: "var(--color-muted)" }}>Last updated September 6, 2026.</p>
    </div>
  </main>;
}

export function NotFoundPage() {
  return <main className="min-h-screen grid place-items-center px-6 text-center" style={{ background: "var(--color-bg)", color: "var(--color-white)" }}>
    <div><p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--color-red)" }}>404</p><h1 className="text-5xl font-bold mt-3 mb-4" style={{ fontFamily: "Rajdhani" }}>Page not found</h1><p className="mb-7" style={{ color: "var(--color-silver)" }}>The page may have moved or the address may be incomplete.</p><Link to="/"><button className="px-6 py-3 rounded-lg font-semibold text-white" style={{ background: "var(--color-red)" }}>Return home</button></Link></div>
  </main>;
}
