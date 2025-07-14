import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const placeholderImage = "/placeholder.svg";

const categories = [
  {
    id: 1,
    name: "Dresses",
    image: placeholderImage,
    description: "Elegant dresses for every occasion",
    itemCount: "120+ styles"
  },
  {
    id: 2,
    name: "Tops",
    image: placeholderImage,
    description: "Contemporary blouses and shirts",
    itemCount: "85+ styles"
  },
  {
    id: 3,
    name: "Outerwear",
    image: placeholderImage,
    description: "Sophisticated coats and jackets",
    itemCount: "45+ styles"
  },
  {
    id: 4,
    name: "Skirts",
    image: placeholderImage,
    description: "Modern silhouettes and cuts",
    itemCount: "60+ styles"
  }
];

const CategoryGrid = () => {
  const navigate = useNavigate();
  const { ref: sectionRef, isVisible } = useScrollAnimation();

  const handleViewCollection = (categoryName: string) => {
    const categoryRoute = categoryName.toLowerCase();
    navigate(`/category/${categoryRoute}`);
  };

  return (
    <section className="py-20 px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="section-heading fade-in-up">
            Shop by Category
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto fade-in-up fade-in-up-delay-1">
            Discover our carefully curated collections, each piece selected for its 
            exceptional quality and timeless appeal.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category, index) => (
            <div 
              key={category.id}
              className={`category-card group fade-in-up fade-in-up-delay-${index % 3 + 1}`}
            >
              <div className="aspect-[4/5] mb-6 overflow-hidden rounded-lg">
                <img 
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-heading font-medium">{category.name}</h3>
                  <span className="text-sm text-muted-foreground">{category.itemCount}</span>
                </div>
                
                <p className="text-muted-foreground leading-relaxed">
                  {category.description}
                </p>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 btn-ripple focus-ring hover-scale"
                  onClick={() => handleViewCollection(category.name)}
                  aria-label={`Browse ${category.name} collection with ${category.itemCount}`}
                >
                  View Collection
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
