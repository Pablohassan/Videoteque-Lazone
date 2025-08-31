import { Button } from "@/components/ui/button";
import { Play, Info } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

interface HeroSectionProps {
  onOpenOrderForm?: () => void;
}

export function HeroSection({ onOpenOrderForm }: HeroSectionProps) {
  return (
    <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBanner})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-accent to-primary bg-clip-text text-transparent">
          VideoTek
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto">
          Regarder notre top sellection, recherchez un film ou
          commandez le directement avec le bouton
        </p>
        <Button
          className="btn-hero text-lg px-8 py-3 m-4"
          style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)" }}
          onClick={onOpenOrderForm}
        >
          Commander mon putin de film !
        </Button>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* <Button className="btn-hero text-lg px-8 py-3"
            style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)" }}
          >
            <Play className="h-5 w-5 mr-2" />
            Explorer le catalogue
          </Button>
          <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
            <Info className="h-5 w-5 mr-2" />
            En savoir plus
          </Button> */}
        </div>
      </div>
    </section>
  );
}