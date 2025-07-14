import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/lib/catalog";

interface ProductCardProps {
  product: Product;
  viewMode: "grid" | "list";
  index: number;
  onViewSimilar?: (product: Product) => void;
  onTryOn?: (product: Product) => void;
}

const ProductCard = ({ product, viewMode, index, onViewSimilar, onTryOn }: ProductCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const { dispatch } = useCart();
  const primaryImage = product.modelImages?.[0] || product.clothImage || "/placeholder.svg";

  const slideshowImages = [
    ...(product.modelImages?.length ? product.modelImages : [primaryImage]),
    ...(product.clothImage ? [product.clothImage] : [])
  ];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev - 1 + slideshowImages.length) % slideshowImages.length);
    setImageLoaded(false);
  };
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev + 1) % slideshowImages.length);
    setImageLoaded(false);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddingToCart(true);
    
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: primaryImage,
        color: product.color,
      }
    });

    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });

    setTimeout(() => {
      setIsAddingToCart(false);
    }, 600);
  };

  if (viewMode === "list") {
    return (
      <div 
        className={cn(
          "group flex gap-6 p-6 bg-card rounded-lg border border-border/50",
          "hover:shadow-lg transition-all duration-300 fade-in-up",
          `fade-in-up-delay-${(index % 3) + 1}`
        )}
      >
        <div className="w-32 h-40 flex-shrink-0 overflow-hidden rounded-lg relative">
          <img
            src={slideshowImages[slideIndex]}
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              "group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          {slideshowImages.length > 1 && (
            <>
              <button className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 z-10" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 z-10" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-heading font-medium line-clamp-2">
                {product.name}
              </h3>
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={cn(
                  "p-2 rounded-full transition-colors duration-200",
                  isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="text-xs">
                {product.itemType}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {product.look}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {product.color}
              </Badge>
            </div>
            
            <p className="text-2xl font-semibold text-primary mb-4">
              ${product.price}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              className="flex-1 hover-scale" 
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); onTryOn && onTryOn(product); }}>
              <Sparkles className="h-4 w-4 mr-2" />
              Virtual Try-On
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group bg-card rounded-lg overflow-hidden border border-border/20",
        "hover:shadow-xl transition-all duration-500 cursor-pointer fade-in-up",
        `fade-in-up-delay-${(index % 4) + 1}`
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={slideshowImages[slideIndex]}
          alt={product.name}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            "group-hover:scale-110",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
        />
        {slideshowImages.length > 1 && (
          <>
            <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 z-10" onClick={handlePrev}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 z-10" onClick={handleNext}>
              <ChevronRight className="h-5 w-5" />
            </button>
            {/* Dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {slideshowImages.map((_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${i === slideIndex ? 'bg-primary' : 'bg-muted-foreground/40'}`}></span>
              ))}
            </div>
          </>
        )}
        
        {/* Image overlay with quick actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
          <div className="absolute top-4 right-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
              className={cn(
                "p-2 bg-white/90 backdrop-blur-sm rounded-full transition-all duration-200",
                "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0",
                isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
            </button>
          </div>
          
          {/* Quick action buttons */}
          <div className="absolute bottom-4 left-4 right-4 space-y-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-100">
            <Button 
              size="sm" 
              className="w-full bg-white/95 text-foreground hover:bg-white border-0"
              onClick={(e) => { e.stopPropagation(); onTryOn && onTryOn(product); }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Virtual Try-On
            </Button>
          </div>
        </div>
        
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
      </div>
      
      <div className="p-4">
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="secondary" className="text-xs">
            {product.itemType}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {product.look}
          </Badge>
        </div>
        
        <h3 className="font-heading font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold text-primary">
            ${product.price}
          </span>
          <span className="text-sm text-muted-foreground capitalize">
            {product.color}
          </span>
        </div>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 hover-scale"
          onClick={handleAddToCart}
          disabled={isAddingToCart}
        >
          {isAddingToCart ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
          ) : (
            <ShoppingCart className="h-4 w-4 mr-2" />
          )}
          {isAddingToCart ? 'Adding...' : 'Add to Cart'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="w-full mt-2"
          onClick={() => onViewSimilar && onViewSimilar(product)}
        >
          View Similar
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
