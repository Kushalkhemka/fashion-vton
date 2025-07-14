import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartDrawer from "./CartDrawer";
import CheckoutModal from "./CheckoutModal";
import { useNavigate } from "react-router-dom";
import { apiPost } from "@/config/api";
import { CatalogFilters, filtersToSearchParams } from "@/lib/catalog";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();
  
  async function refineQueryWithLLM(query: string): Promise<CatalogFilters> {
    const response = await apiPost<{ filters: CatalogFilters }>("/api/search/parse", { query });
    return response.filters;
  }

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const filters = await refineQueryWithLLM(searchQuery.trim());
      const params = filtersToSearchParams(filters);
      navigate(`/category/all?${params.toString()}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Search parsing failed.");
    } finally {
      setSearchLoading(false);
    }
  };

  const { state } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold tracking-widest text-primary">
              VITON
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              New Arrivals
            </a>
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Dresses
            </a>
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Tops
            </a>
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Outerwear
            </a>
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Sale
            </a>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center space-x-2 w-96">
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              placeholder="Search for products, e.g. black t-shirt, floral dress..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              disabled={searchLoading}
            />
            <Button type="submit" variant="outline" disabled={searchLoading}>
              {searchLoading ? "Searching..." : <Search className="h-4 w-4" />}
            </Button>
          </form>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover-scale"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-4 w-4" />
              {state.totalItems > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 animate-scale-in"
                >
                  {state.totalItems}
                </Badge>
              )}
            </Button>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#" className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors">
                New Arrivals
              </a>
              <a href="#" className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors">
                Dresses
              </a>
              <a href="#" className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors">
                Tops
              </a>
              <a href="#" className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors">
                Outerwear
              </a>
              <a href="#" className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors">
                Sale
              </a>
              <div className="px-3 py-2">
                <Button variant="outline" className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <CartDrawer 
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => setIsCheckoutOpen(true)}
      />
      
      <CheckoutModal 
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </header>
  );
};

export default Header;
