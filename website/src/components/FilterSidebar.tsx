import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

// VITON-HD dataset filter options
const filterOptions = {
  itemType: [
    "dress", "shirt", "blouse", "t-shirt", "top", "sweater", "cardigan",
    "jacket", "coat", "blazer", "skirt", "pants", "jeans", "shorts"
  ],
  color: [
    "black", "white", "gray", "brown", "beige", "red", "pink", "orange",
    "yellow", "green", "blue", "purple", "multicolor"
  ],
  look: [
    "casual", "formal", "party", "business", "vintage", "bohemian", 
    "sporty", "elegant", "minimalist"
  ],
  sleeveLength: [
    "sleeveless", "short sleeve", "3/4 sleeve", "long sleeve", "none"
  ],
  length: [
    "mini", "short", "midi", "knee length", "long", "maxi", "regular"
  ],
  neckline: [
    "round", "v-neck", "scoop", "boat", "off shoulder", "halter", 
    "strapless", "collar", "lapel", "none"
  ],
  prints: [
    "solid", "striped", "polka dot", "floral", "geometric", "animal print",
    "plaid", "abstract", "text"
  ]
};

const colorSwatches: Record<string, string> = {
  black: "#000000",
  white: "#FFFFFF",
  gray: "#808080",
  brown: "#8B4513",
  beige: "#F5F5DC",
  red: "#FF0000",
  pink: "#FFC0CB",
  orange: "#FFA500",
  yellow: "#FFFF00",
  green: "#008000",
  blue: "#0000FF",
  purple: "#800080",
  multicolor: "linear-gradient(45deg, #ff0000, #00ff00, #0000ff)"
};

interface FilterSidebarProps {
  filters: {
    itemType: string[];
    color: string[];
    look: string[];
    sleeveLength: string[];
    length: string[];
    neckline: string[];
    prints: string[];
  };
  setFilters: (filters: any) => void;
  category: string;
}

const FilterSidebar = ({ filters, setFilters, category }: FilterSidebarProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    itemType: true,
    color: true,
    look: false,
    sleeveLength: false,
    length: false,
    neckline: false,
    prints: false
  });

  const toggleFilter = (filterType: keyof typeof filters, value: string) => {
    setFilters((prev: typeof filters) => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      itemType: [],
      color: [],
      look: [],
      sleeveLength: [],
      length: [],
      neckline: [],
      prints: []
    });
  };

  const clearFilterSection = (filterType: keyof typeof filters) => {
    setFilters((prev: typeof filters) => ({
      ...prev,
      [filterType]: []
    }));
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((total, filterArray) => total + filterArray.length, 0);
  };

  const renderFilterSection = (
    title: string,
    filterType: keyof typeof filters,
    options: string[]
  ) => {
    const isOpen = openSections[filterType];
    const activeCount = filters[filterType].length;

    return (
      <Collapsible 
        open={isOpen} 
        onOpenChange={() => toggleSection(filterType)}
        className="border-b border-border/50 last:border-b-0"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto font-medium hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              {title}
              {activeCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {activeCount}
                </span>
              )}
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="px-4 pb-4 space-y-2">
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilterSection(filterType)}
                className="text-xs text-muted-foreground hover:text-foreground mb-2"
              >
                Clear {title}
              </Button>
            )}
            
            {filterType === "color" ? (
              <div className="grid grid-cols-4 gap-2">
                {options.map((color) => (
                  <button
                    key={color}
                    onClick={() => toggleFilter(filterType, color)}
                    className={cn(
                      "group flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200",
                      "hover:bg-accent",
                      filters[filterType].includes(color) && "bg-accent"
                    )}
                  >
                    <div 
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all duration-200",
                        filters[filterType].includes(color) 
                          ? "border-primary scale-110" 
                          : "border-border",
                        color === "white" && "border-border"
                      )}
                      style={{ 
                        background: colorSwatches[color] || color,
                        border: color === "white" ? "2px solid #e5e7eb" : undefined
                      }}
                    />
                    <span className="text-xs text-center leading-tight capitalize">
                      {color}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => toggleFilter(filterType, option)}
                    className={cn(
                      "w-full text-left p-2 rounded-lg transition-colors duration-200",
                      "hover:bg-accent text-sm capitalize",
                      filters[filterType].includes(option) && "bg-accent font-medium"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="w-80 bg-background border-r border-border/50 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-medium">Filters</h2>
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
        
        {getActiveFilterCount() > 0 && (
          <p className="text-sm text-muted-foreground">
            {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} applied
          </p>
        )}
      </div>

      <div className="filter-sections">
        {renderFilterSection("Item Type", "itemType", filterOptions.itemType)}
        {renderFilterSection("Color", "color", filterOptions.color)}
        {renderFilterSection("Look", "look", filterOptions.look)}
        {renderFilterSection("Sleeve Length", "sleeveLength", filterOptions.sleeveLength)}
        {renderFilterSection("Length", "length", filterOptions.length)}
        {renderFilterSection("Neckline", "neckline", filterOptions.neckline)}
        {renderFilterSection("Prints", "prints", filterOptions.prints)}
      </div>
    </div>
  );
};

export default FilterSidebar;