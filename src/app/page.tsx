import { Navbar }     from "@/components/landing/Navbar";
import { Hero }        from "@/components/landing/Hero";
import { LogoStrip }   from "@/components/landing/LogoStrip";
import { HowItWorks }  from "@/components/landing/HowItWorks";
import { Features }    from "@/components/landing/Features";
import { Pricing }     from "@/components/landing/Pricing";
import { FAQ }         from "@/components/landing/FAQ";
import { CTA }         from "@/components/landing/CTA";
import { Footer }      from "@/components/landing/Footer";
import { Proofs }       from "@/components/landing/Proofs";

export default function HomePage() {
  return (
    <div className="landing-page" style={{ overflowX: "hidden", background: "#000000", minHeight: "100vh" }}>
      <Navbar />
      <main>
        <Hero />
        <LogoStrip />
        <HowItWorks />
        <Features />
        <Proofs />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
