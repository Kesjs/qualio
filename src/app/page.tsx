import { Navbar }     from "@/components/landing/Navbar";
import { Hero }        from "@/components/landing/Hero";
import { LogoStrip }   from "@/components/landing/LogoStrip";
import { HowItWorks }  from "@/components/landing/HowItWorks";
import { Features }    from "@/components/landing/Features";
import { Pricing }     from "@/components/landing/Pricing";
import { FAQ }         from "@/components/landing/FAQ";
import { CTA }         from "@/components/landing/CTA";
import { Footer }      from "@/components/landing/Footer";
import { Reveal }      from "@/components/ui/Reveal";

export default function HomePage() {
  return (
    <div style={{ overflowX: "hidden" }}>
      <Navbar />
      <main>
        <Hero />
        <Reveal blur delay={0.2} yOffset={20}>
          <LogoStrip />
        </Reveal>
        <Reveal blur yOffset={40}>
          <HowItWorks />
        </Reveal>
        <Reveal blur yOffset={40}>
          <Features />
        </Reveal>
        <Reveal blur yOffset={40}>
          <Pricing />
        </Reveal>
        <Reveal blur yOffset={40}>
          <FAQ />
        </Reveal>
        <Reveal blur yOffset={40}>
          <CTA />
        </Reveal>
      </main>
      <Reveal blur yOffset={40}>
        <Footer />
      </Reveal>
    </div>
  );
}
