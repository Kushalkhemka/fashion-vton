import { Button } from "@/components/ui/button";
import { useParallax } from "@/hooks/useScrollAnimation";

const HeroSection = () => {
  const parallaxOffset = useParallax(0.3);
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/placeholder.svg')",
          transform: `translateY(${parallaxOffset}px)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="hero-text fade-in-up text-foreground mb-6 text-5xl md:text-6xl font-extrabold leading-tight">
            Timeless
            <span className="text-gradient block">Fashion</span>
            Redefined
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed fade-in-up fade-in-up-delay-1">
            Discover our curated collection of contemporary fashion pieces that blend 
            sophistication with modern style. Every piece tells a story.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 fade-in-up fade-in-up-delay-2">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-lg px-8 py-4 btn-ripple focus-ring"
              aria-label="Browse our new fashion collection"
            >
              Shop Collection
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 btn-ripple focus-ring"
              aria-label="Try on clothes virtually using AI"
            >
              Virtual Try-On
            </Button>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 fade-in-up fade-in-up-delay-3">
        <div className="w-px h-16 bg-gradient-to-b from-transparent to-muted-foreground/50"></div>
        <p className="text-sm text-muted-foreground mt-2 text-center">Scroll</p>
      </div>
    </section>
  );
};

export default HeroSection;
