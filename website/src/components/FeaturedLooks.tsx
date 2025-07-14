import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const placeholderImage = "/placeholder.svg";

const looks = [
  {
    id: 1,
    name: "Effortless Casual",
    image: placeholderImage,
    description: "Perfect for weekend brunches and casual meetups",
    pieces: ["Silk Blouse", "High-waist Jeans", "Statement Accessories"],
    price: "From $240"
  },
  {
    id: 2,
    name: "Evening Elegance",
    image: placeholderImage,
    description: "Sophisticated styling for special occasions",
    pieces: ["Midi Dress", "Statement Jewelry", "Classic Heels"],
    price: "From $320"
  },
  {
    id: 3,
    name: "Professional Chic",
    image: placeholderImage,
    description: "Polished looks for the modern workplace",
    pieces: ["Blazer", "Tailored Trousers", "Classic Blouse"],
    price: "From $280"
  },
  {
    id: 4,
    name: "Bohemian Dreams",
    image: placeholderImage,
    description: "Free-spirited style with artistic flair",
    pieces: ["Flowy Dress", "Layered Jewelry", "Vintage Accessories"],
    price: "From $190"
  }
];

const FeaturedLooks = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % looks.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + looks.length) % looks.length);
  };

  return (
    <section className="py-20 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="section-heading fade-in-up">
            Featured Looks
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto fade-in-up fade-in-up-delay-1">
            Styled by our fashion experts, these curated looks showcase how to 
            effortlessly combine pieces for any occasion.
          </p>
        </div>
        
        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {looks.map((look) => (
                <div key={look.id} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Image */}
                    <div className="aspect-[3/4] overflow-hidden rounded-lg elegant-shadow">
                      <img 
                        src={look.image}
                        alt={look.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-3xl font-heading font-medium mb-4">
                          {look.name}
                        </h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          {look.description}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                          This Look Includes
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {look.pieces.map((piece, index) => (
                            <span 
                              key={index}
                              className="px-3 py-1 bg-accent/50 text-accent-foreground rounded-full text-sm"
                            >
                              {piece}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4">
                        <span className="text-2xl font-heading font-medium">
                          {look.price}
                        </span>
                        <div className="flex gap-3">
                          <Button variant="outline">
                            Shop This Look
                          </Button>
                          <Button variant="hero">
                            Try Virtually
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button 
              variant="outline" 
              size="icon"
              onClick={prevSlide}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-2">
              {looks.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-primary w-8' 
                      : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={nextSlide}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedLooks;
