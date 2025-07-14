import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartDrawer from "./CartDrawer";
import CheckoutModal from "./CheckoutModal";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();
  
  // LLM call using OpenAI Chat Completion API
  async function refineQueryWithLLM(query) {
    // The available options for each filter
    const item_options = ["", "Bikini Top", "Blouse", "Blouson", "Bolero", "Bra Top", "Bustier", "Camisole", "Cape/Shawl", "Cardigan", "Denim Dress", "Fitness Jacket", "Full Zip Jacket", "Full Zip Vest", "Fur Jacket", "Halter Neck Dress", "Hoodie", "Jacket", "Jumper Dress", "Knit Dress", "Knit vest", "Leather Jacket", "Leggings/Treggings", "Offshoulder Dress", "One piece Swimsuit", "Pique Dress", "Pleats Skirt", "Polo Shirts", "Ruffle skirt", "Sarong skirt", "Shirt Dress", "Shirts", "Slip Dress", "Sweat Pants", "Sweater", "Sweatshirt", "T-shirts", "Tank Top", "Trumpet Skirt", "Tube Top", "Tunic Dress", "Turtleneck", "Vest", "Vest Suit", "Wide Pants", "Wrap Dress", "Wrap Skirt", "Y-Shirts", "denim skirt", "flared skirt", "pajama-top"];
    const looks_options = ["", "Casual", "Ethnic", "Feminine", "Marine", "Military", "Office look", "Outdoor Sports", "Party", "Preppy", "Punk", "Resort", "Retro"];
    const colors_options = ["", "Beige", "Black", "Blue", "Brown", "Green", "Grey", "Khaki", "Lavender", "Mint", "Navy", "Orange", "Pink", "Purple", "Red", "Sky Blue", "White", "Wine", "Yellow"];
    const sleeveLength_options = ["", "Cropped Sleeve", "Long Sleeve", "Short Sleeve", "Sleeveless"];
    const length_options = ["", "cropped", "half", "kneelength", "long", "midi", "mini", "normal", "short"];
    const neckLine_options = ["", "Bow Collar", "Collarless", "Halter Neck", "Hood", "Offshoulder", "Round Neck", "Shawl Collar", "Shirt Collar", "Square Neck", "Stand-up Collar", "Tailored Collar", "Turtle Neck", "U Neck", "V Neck"];
    const prints_options = ["", "Camouflage", "Check", "Dot", "Floral", "Gradation", "Leopard", "Paisley", "Skull", "Solid", "Stripe", "Tiedyed", "Zebra", "ZigZag", "graphic", "lettering"];
    const systemPrompt = `You are a helpful assistant for a fashion search engine. Given a user query, map it to the following filter options. Only use the provided options. Return a JSON object with these keys: itemType, look, color, sleeveLength, length, neckline, prints. If a filter is not specified in the query, leave it as an empty string.\n\nOptions:\nitemType: ${item_options.slice(1).join(", ")}\nlook: ${looks_options.slice(1).join(", ")}\ncolor: ${colors_options.slice(1).join(", ")}\nsleeveLength: ${sleeveLength_options.slice(1).join(", ")}\nlength: ${length_options.slice(1).join(", ")}\nneckline: ${neckLine_options.slice(1).join(", ")}\nprints: ${prints_options.slice(1).join(", ")}\n\nExample output: {"itemType": "T-shirts", "look": "Casual", "color": "Black", "sleeveLength": "Short Sleeve", "length": "normal", "neckline": "V Neck", "prints": "lettering"}`;
    const apiKey = "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";
    const payload = {
      model: "gpt-4.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0.0,
      max_tokens: 256
    };
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("OpenAI API error");
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    try {
      // Try to parse the JSON from the LLM response
      const filters = JSON.parse(content);
      return filters;
    } catch (err) {
      // If parsing fails, fallback to empty filters
      return {};
    }
  }

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const filters = await refineQueryWithLLM(searchQuery.trim());
      // Build query string from filters
      const params = new URLSearchParams();
      (Object.entries(filters) as [string, string][]).forEach(([key, value]) => {
        if (typeof value === 'string' && value) params.set(key, value);
      });
      navigate(`/category/all?${params.toString()}`);
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