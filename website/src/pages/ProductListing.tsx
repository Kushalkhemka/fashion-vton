import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import FilterSidebar from "@/components/FilterSidebar";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Grid, List, ChevronDown, ChevronUp } from "lucide-react";
import { FileUploadButton } from "@/components/ui/file-upload-button";
import RuixenUploadInput from "@/components/ui/ruixen-upload-input";

// Filter options (from main.py)
const item_options = ["", "Bikini Top", "Blouse", "Blouson", "Bolero", "Bra Top", "Bustier", "Camisole", "Cape/Shawl", "Cardigan", "Denim Dress", "Fitness Jacket", "Full Zip Jacket", "Full Zip Vest", "Fur Jacket", "Halter Neck Dress", "Hoodie", "Jacket", "Jumper Dress", "Knit Dress", "Knit vest", "Leather Jacket", "Leggings/Treggings", "Offshoulder Dress", "One piece Swimsuit", "Pique Dress", "Pleats Skirt", "Polo Shirts", "Ruffle skirt", "Sarong skirt", "Shirt Dress", "Shirts", "Slip Dress", "Sweat Pants", "Sweater", "Sweatshirt", "T-shirts", "Tank Top", "Trumpet Skirt", "Tube Top", "Tunic Dress", "Turtleneck", "Vest", "Vest Suit", "Wide Pants", "Wrap Dress", "Wrap Skirt", "Y-Shirts", "denim skirt", "flared skirt", "pajama-top"];
const looks_options = ["", "Casual", "Ethnic", "Feminine", "Marine", "Military", "Office look", "Outdoor Sports", "Party", "Preppy", "Punk", "Resort", "Retro"];
const colors_options = ["", "Beige", "Black", "Blue", "Brown", "Green", "Grey", "Khaki", "Lavender", "Mint", "Navy", "Orange", "Pink", "Purple", "Red", "Sky Blue", "White", "Wine", "Yellow"];
const sleeveLength_options = ["", "Cropped Sleeve", "Long Sleeve", "Short Sleeve", "Sleeveless"];
const length_options = ["", "cropped", "half", "kneelength", "long", "midi", "mini", "normal", "short"];
const neckLine_options = ["", "Bow Collar", "Collarless", "Halter Neck", "Hood", "Offshoulder", "Round Neck", "Shawl Collar", "Shirt Collar", "Square Neck", "Stand-up Collar", "Tailored Collar", "Turtle Neck", "U Neck", "V Neck"];
const prints_options = ["", "Camouflage", "Check", "Dot", "Floral", "Gradation", "Leopard", "Paisley", "Skull", "Solid", "Stripe", "Tiedyed", "Zebra", "ZigZag", "graphic", "lettering"];

// Add type for tag dict
interface TagDict {
  item?: string;
  looks?: string;
  colors?: string;
  sleeveLength?: string;
  length?: string;
  neckLine?: string;
  prints?: string;
}

function getTagDict(tagInfo: any[]): TagDict {
  const dict: TagDict = {};
  for (const tag of tagInfo) {
    dict[tag.tag_name] = tag.tag_category;
  }
  return dict;
}

function passesHardFilter(candidateTags: TagDict, filters: any) {
  return (
    (!filters.itemType || candidateTags.item === filters.itemType) &&
    (!filters.look || candidateTags.looks === filters.look) &&
    (!filters.color || candidateTags.colors === filters.color) &&
    (!filters.sleeveLength || candidateTags.sleeveLength === filters.sleeveLength) &&
    (!filters.length || candidateTags.length === filters.length) &&
    (!filters.neckline || candidateTags.neckLine === filters.neckline) &&
    (!filters.prints || candidateTags.prints === filters.prints)
  );
}

// Color swatch mapping for UI
const colorSwatchMap: Record<string, string> = {
  Black: "#000000",
  White: "#FFFFFF",
  Gray: "#888888",
  Brown: "#8B4513",
  Beige: "#F5F5DC",
  Red: "#FF0000",
  Pink: "#FFC0CB",
  Orange: "#FFA500",
  Yellow: "#FFFF00",
  Green: "#008000",
  Blue: "#0000FF",
  Purple: "#800080",
  "Sky Blue": "#87CEEB",
  Navy: "#000080",
  Lavender: "#E6E6FA",
  Mint: "#AAF0D1",
  Khaki: "#F0E68C",
  Wine: "#722F37",
  Multicolor: "linear-gradient(135deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)",
};

const ProductListing = () => {
  // Remove category and categoryTitle logic
  // const { category = "all" } = useParams<{ category: string }>();
  const [allProducts, setAllProducts] = useState([]); // All products from metadata
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filters, setFilters] = useState({
    itemType: "",
    look: "",
    color: "",
    sleeveLength: "",
    length: "",
    neckline: "",
    prints: ""
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [filterSections, setFilterSections] = useState({
    itemType: true,
    color: true,
    look: false,
    sleeveLength: false,
    length: false,
    neckline: false,
    prints: false,
  });
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  // Similar modal state
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState("");
  const [similarQueryProduct, setSimilarQueryProduct] = useState<any>(null);

  // Try-On modal state
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [tryOnProduct, setTryOnProduct] = useState<any>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, allProducts]);

  // Load metadata and build product list
  useEffect(() => {
    setIsLoading(true);
    fetch("/vitonhd_train_tagged.json")
      .then(res => res.json())
      .then(data => {
        const clothDir = "/cloth/";
        const imageDir = "/image/";
        const products = data.data
          .filter(entry => !entry.file_name.startsWith("._"))
          .map(entry => {
            const fileName = entry.file_name;
            const tagDict = getTagDict(entry.tag_info);
            return {
              id: fileName.replace('.jpg', ''),
              name: tagDict.item || fileName,
              price: 100, // Placeholder
              modelImages: [imageDir + fileName],
              clothImage: clothDir + fileName,
              category: entry.category_name,
              itemType: tagDict.item || '',
              color: tagDict.colors || '',
              look: tagDict.looks || '',
              sleeveLength: tagDict.sleeveLength || '',
              length: tagDict.length || '',
              neckline: tagDict.neckLine || '',
              prints: tagDict.prints || '',
            };
          });
        setAllProducts(products);
        setIsLoading(false);
      });
  }, []);

  // Filter products when filters or category change
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      let filtered = allProducts;
      // Remove category filtering
      // Only apply sidebar filters
      filtered = filtered.filter(product =>
        passesHardFilter({
          item: product.itemType,
          looks: product.look,
          colors: product.color,
          sleeveLength: product.sleeveLength,
          length: product.length,
          neckLine: product.neckline,
          prints: product.prints
        } as TagDict, filters)
      );
      setFilteredProducts(filtered);
      setIsLoading(false);
    }, 200);
  }, [filters, allProducts]);

  // Remove categoryTitle
  // const categoryTitle = category === "all" ? "All Products" : 
  //   category.charAt(0).toUpperCase() + category.slice(1);

  // Handler for View Similar
  const handleViewSimilar = async (product: any) => {
    setShowSimilarModal(true);
    setSimilarLoading(true);
    setSimilarError("");
    setSimilarQueryProduct(product);
    try {
      const res = await fetch("http://localhost:5001/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: product.modelImages[0].split("/").pop() })
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      // Find product objects for the returned file names
      const similar = data.similar
        .map((fname: string) => allProducts.find((p: any) => p.modelImages[0].endsWith(fname)))
        .filter(Boolean);
      setSimilarProducts(similar);
    } catch (e) {
      setSimilarError("Could not fetch similar products.");
      setSimilarProducts([]);
    }
    setSimilarLoading(false);
  };

  const handleTryOnClick = (product: any) => {
    setTryOnProduct(product);
    setTryOnOpen(true);
    setTryOnResult(null);
  };

  const handleModelImageUpload = async (file: File) => {
    setTryOnLoading(true);
    setTryOnResult(null);
    try {
      const formData = new FormData();
      formData.append('model_image', file);
      let clothFilename = tryOnProduct.clothImage.split('/').pop();
      formData.append('cloth_image', clothFilename);
      const response = await fetch('http://localhost:5002/tryon', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      console.log('Try-On API result:', result); // Debug log
      if (result.status === 'success' && result.output_image) {
        // Poll for the image to be available (up to 5 tries, 1 minute apart)
        const imageUrl = result.output_image;
        let tries = 0;
        const maxTries = 20;
        const pollInterval = 10000; // 1 minute
        const pollForImage = () => {
          tries++;
          const img = new window.Image();
          img.onload = () => {
            setTryOnResult(imageUrl);
            setTryOnLoading(false);
          };
          img.onerror = () => {
            if (tries < maxTries) {
              setTimeout(pollForImage, pollInterval);
            } else {
              setTryOnLoading(false);
              alert('Try-On image not available after several minutes. Please try again later.');
            }
          };
          img.src = imageUrl;
        };
        pollForImage();
      } else {
        setTryOnResult(null);
        setTryOnLoading(false);
        alert(result.message || 'Try-On failed.');
      }
    } catch (err) {
      setTryOnResult(null);
      setTryOnLoading(false);
      alert('Try-On failed. ' + (err?.message || ''));
    }
  };

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="flex">
          {/* Filter Sidebar */}
          <div className="w-64 p-4 border-r border-border/30 bg-white/95">
            <div className="mb-4 font-bold text-lg">Filters</div>
            {/* Item Type Section */}
            <div className="mb-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setFilterSections(s => ({ ...s, itemType: !s.itemType }))}>
                <span className="font-semibold">Item Type</span>
                {filterSections.itemType ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              {filterSections.itemType && (
                <div className="mt-2 space-y-1">
                  {item_options.slice(1).map(opt => (
                    <div
                      key={opt}
                      className={`px-2 py-1 rounded cursor-pointer ${filters.itemType === opt ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'}`}
                      onClick={() => setFilters(f => ({ ...f, itemType: filters.itemType === opt ? '' : opt }))}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Color Section */}
            <div className="mb-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setFilterSections(s => ({ ...s, color: !s.color }))}>
                <span className="font-semibold">Color</span>
                {filterSections.color ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              {filterSections.color && (
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {colors_options.slice(1).map(opt => (
                    <div
                      key={opt}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer ${filters.color === opt ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'}`}
                      style={{ background: colorSwatchMap[opt] || '#eee' }}
                      title={opt}
                      onClick={() => setFilters(f => ({ ...f, color: filters.color === opt ? '' : opt }))}
                    >
                      {filters.color === opt && <span className="w-3 h-3 bg-white rounded-full border border-orange-500" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Look Section */}
            <div className="mb-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setFilterSections(s => ({ ...s, look: !s.look }))}>
                <span className="font-semibold">Look</span>
                {filterSections.look ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              {filterSections.look && (
                <div className="mt-2 space-y-1">
                  {looks_options.slice(1).map(opt => (
                    <div
                      key={opt}
                      className={`px-2 py-1 rounded cursor-pointer ${filters.look === opt ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'}`}
                      onClick={() => setFilters(f => ({ ...f, look: filters.look === opt ? '' : opt }))}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Sleeve Length Section */}
            <div className="mb-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setFilterSections(s => ({ ...s, sleeveLength: !s.sleeveLength }))}>
                <span className="font-semibold">Sleeve Length</span>
                {filterSections.sleeveLength ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              {filterSections.sleeveLength && (
                <div className="mt-2 space-y-1">
                  {sleeveLength_options.slice(1).map(opt => (
                    <div
                      key={opt}
                      className={`px-2 py-1 rounded cursor-pointer ${filters.sleeveLength === opt ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'}`}
                      onClick={() => setFilters(f => ({ ...f, sleeveLength: filters.sleeveLength === opt ? '' : opt }))}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Length Section */}
            <div className="mb-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setFilterSections(s => ({ ...s, length: !s.length }))}>
                <span className="font-semibold">Length</span>
                {filterSections.length ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              {filterSections.length && (
                <div className="mt-2 space-y-1">
                  {length_options.slice(1).map(opt => (
                    <div
                      key={opt}
                      className={`px-2 py-1 rounded cursor-pointer ${filters.length === opt ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'}`}
                      onClick={() => setFilters(f => ({ ...f, length: filters.length === opt ? '' : opt }))}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Neckline Section */}
            <div className="mb-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setFilterSections(s => ({ ...s, neckline: !s.neckline }))}>
                <span className="font-semibold">Neckline</span>
                {filterSections.neckline ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              {filterSections.neckline && (
                <div className="mt-2 space-y-1">
                  {neckLine_options.slice(1).map(opt => (
                    <div
                      key={opt}
                      className={`px-2 py-1 rounded cursor-pointer ${filters.neckline === opt ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'}`}
                      onClick={() => setFilters(f => ({ ...f, neckline: filters.neckline === opt ? '' : opt }))}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Prints Section */}
            <div className="mb-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setFilterSections(s => ({ ...s, prints: !s.prints }))}>
                <span className="font-semibold">Prints</span>
                {filterSections.prints ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              {filterSections.prints && (
                <div className="mt-2 space-y-1">
                  {prints_options.slice(1).map(opt => (
                    <div
                      key={opt}
                      className={`px-2 py-1 rounded cursor-pointer ${filters.prints === opt ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'}`}
                      onClick={() => setFilters(f => ({ ...f, prints: filters.prints === opt ? '' : opt }))}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="mt-2 w-full bg-gray-200 rounded p-1" onClick={() => setFilters({ itemType: "", look: "", color: "", sleeveLength: "", length: "", neckline: "", prints: "" })}>Clear All Filters</button>
          </div>
          {/* Main Content */}
          <div className="flex-1 p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-heading font-light mb-2">
                  All Products
                </h1>
                <p className="text-muted-foreground">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-muted rounded-lg mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            )}
            {/* Products Grid */}
            {!isLoading && (
              <>
                <div 
                  className={`
                    ${viewMode === "grid" 
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                      : "space-y-4"
                    }
                  `}
                >
                  {paginatedProducts.map((product, index) => (
                    <ProductCard 
                      key={product.id}
                      product={product}
                      viewMode={viewMode}
                      index={index}
                      onViewSimilar={handleViewSimilar}
                      onTryOn={handleTryOnClick}
                    />
                  ))}
                </div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8 gap-4 items-center">
                    <button
                      className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </button>
                    <span className="text-sm">Page {page} of {totalPages}</span>
                    <button
                      className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
                {/* Similar Modal */}
                {showSimilarModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative">
                      <button className="absolute top-2 right-2 text-2xl" onClick={() => setShowSimilarModal(false)}>&times;</button>
                      <h2 className="text-2xl font-bold mb-4">Similar Recommendations</h2>
                      {similarLoading && <div className="text-center py-8">Loading...</div>}
                      {similarError && <div className="text-center text-red-500 py-8">{similarError}</div>}
                      {!similarLoading && !similarError && similarProducts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                          {similarProducts.map((product, idx) => (
                            <ProductCard
                              key={product.id + "-sim"}
                              product={product}
                              viewMode="grid"
                              index={idx}
                            />
                          ))}
                        </div>
                      )}
                      {!similarLoading && !similarError && similarProducts.length === 0 && (
                        <div className="text-center py-8">No similar products found.</div>
                      )}
                    </div>
                  </div>
                )}
                {/* Try-On Modal */}
                {tryOnOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
                      <button className="absolute top-2 right-2 text-2xl" onClick={() => setTryOnOpen(false)}>&times;</button>
                      <h2 className="text-xl font-bold mb-4">Virtual Try-On</h2>
                      {/* Image uploader shown if no result yet */}
                      {!tryOnResult && !tryOnLoading && (
                        <RuixenUploadInput onFileSelect={handleModelImageUpload} />
                      )}
                      {tryOnLoading && <div className="mt-4 text-center">Processing...</div>}
                      {tryOnResult && (
                        <div className="flex flex-col items-center">
                          {tryOnResult.startsWith('/output/') || tryOnResult.startsWith('http') ? (
                          <img src={tryOnResult} alt="Try-On Result" className="w-full max-w-md rounded-lg mb-4" />
                          ) : (
                            <img src={`data:image/jpeg;base64,${tryOnResult}`} alt="Try-On Result" className="w-full max-w-md rounded-lg mb-4" />
                          )}
                          <div className="flex gap-4">
                            <img src={tryOnProduct.modelImages[0]} alt="Product" className="w-32 rounded" />
                            <img src={tryOnProduct.clothImage} alt="Cloth" className="w-32 rounded" />
                          </div>
                          <Button className="mt-4" onClick={() => setTryOnOpen(false)}>Close</Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            {/* Empty State */}
            {!isLoading && filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <h3 className="text-xl font-heading mb-4">No products found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters to see more results
                </p>
                <Button onClick={() => setFilters({
                  itemType: "",
                  look: "",
                  color: "",
                  sleeveLength: "",
                  length: "",
                  neckline: "",
                  prints: ""
                })}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListing;