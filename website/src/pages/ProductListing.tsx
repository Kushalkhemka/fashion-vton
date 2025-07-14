import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Grid, List } from "lucide-react";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import CatalogFilterSidebar from "@/components/catalog/CatalogFilterSidebar";
import RuixenUploadInput from "@/components/ui/ruixen-upload-input";
import { Button } from "@/components/ui/button";
import { apiPost, apiUrl } from "@/config/api";
import {
  CatalogFilters,
  FilterOptions,
  Product,
  emptyFilters,
  fetchCatalog,
  filtersFromSearchParams,
  filtersToSearchParams,
  productMatchesFilters,
} from "@/lib/catalog";

const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    itemType: [],
    look: [],
    color: [],
    sleeveLength: [],
    length: [],
    neckline: [],
    prints: [],
  });
  const [filters, setFilters] = useState<CatalogFilters>(() => filtersFromSearchParams(searchParams));
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState("");
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);

  const pageSize = 24;

  useEffect(() => {
    setFilters(filtersFromSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    setIsLoading(true);
    fetchCatalog()
      .then((catalog) => {
        setAllProducts(catalog.products);
        setFilterOptions(catalog.filterOptions);
        setLoadError("");
      })
      .catch((error: Error) => {
        setLoadError(error.message || "Catalog API request failed.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const filteredProducts = useMemo(
    () => allProducts.filter((product) => productMatchesFilters(product, filters)),
    [allProducts, filters],
  );
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  const updateFilters = (nextFilters: CatalogFilters) => {
    setFilters(nextFilters);
    setSearchParams(filtersToSearchParams(nextFilters));
  };

  const handleViewSimilar = async (product: Product) => {
    setShowSimilarModal(true);
    setSimilarLoading(true);
    setSimilarError("");
    try {
      const data = await apiPost<{ similar: string[] }>("/api/recommendations/similar", {
        fileName: product.fileName,
      });
      setSimilarProducts(
        data.similar
          .map((fileName) => allProducts.find((candidate) => candidate.fileName === fileName))
          .filter(Boolean) as Product[],
      );
    } catch (error) {
      setSimilarProducts([]);
      setSimilarError(error instanceof Error ? error.message : "Could not fetch similar products.");
    } finally {
      setSimilarLoading(false);
    }
  };

  const handleTryOnClick = (product: Product) => {
    setTryOnProduct(product);
    setTryOnOpen(true);
    setTryOnResult(null);
  };

  const handleModelImageUpload = async (file: File) => {
    if (!tryOnProduct) return;

    setTryOnLoading(true);
    setTryOnResult(null);
    try {
      const formData = new FormData();
      formData.append("model_image", file);
      formData.append("cloth_image", tryOnProduct.fileName);
      const response = await fetch(apiUrl("/api/tryon"), {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success" || !result.output_image) {
        throw new Error(result.message || "Try-on failed.");
      }
      setTryOnResult(result.output_image);
    } catch (error) {
      setTryOnResult(null);
      alert(error instanceof Error ? error.message : "Try-on failed.");
    } finally {
      setTryOnLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="flex min-h-[calc(100vh-5rem)]">
          <CatalogFilterSidebar filters={filters} options={filterOptions} onChange={updateFilters} />
          <main className="flex-1 p-6 lg:p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-heading font-light mb-2">All Products</h1>
                <p className="text-muted-foreground">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
                  <Grid className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {loadError && (
              <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {loadError}
              </div>
            )}

            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="aspect-[3/4] bg-muted rounded-lg mb-4" />
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !loadError && filteredProducts.length > 0 && (
              <>
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
                  {paginatedProducts.map((product, index) => (
                    <ProductCard
                      key={product.fileName}
                      product={product}
                      viewMode={viewMode}
                      index={index}
                      onViewSimilar={handleViewSimilar}
                      onTryOn={handleTryOnClick}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <Button variant="outline" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
                      Previous
                    </Button>
                    <span className="text-sm">Page {page} of {totalPages}</span>
                    <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}

            {!isLoading && !loadError && filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <h3 className="text-xl font-heading mb-4">No products found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your filters to see more results</p>
                <Button onClick={() => updateFilters({ ...emptyFilters })}>Clear All Filters</Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {showSimilarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg">
            <button className="absolute right-3 top-2 text-2xl" onClick={() => setShowSimilarModal(false)}>
              &times;
            </button>
            <h2 className="mb-4 text-2xl font-bold">Similar Recommendations</h2>
            {similarLoading && <div className="py-8 text-center">Loading...</div>}
            {similarError && <div className="py-8 text-center text-red-500">{similarError}</div>}
            {!similarLoading && !similarError && similarProducts.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                {similarProducts.map((product, index) => (
                  <ProductCard key={`${product.fileName}-similar`} product={product} viewMode="grid" index={index} />
                ))}
              </div>
            )}
            {!similarLoading && !similarError && similarProducts.length === 0 && (
              <div className="py-8 text-center">No similar products found.</div>
            )}
          </div>
        </div>
      )}

      {tryOnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <button className="absolute right-3 top-2 text-2xl" onClick={() => setTryOnOpen(false)}>
              &times;
            </button>
            <h2 className="mb-4 text-xl font-bold">Virtual Try-On</h2>
            {!tryOnResult && !tryOnLoading && <RuixenUploadInput onFileSelect={handleModelImageUpload} />}
            {tryOnLoading && <div className="mt-4 text-center">Processing...</div>}
            {tryOnResult && tryOnProduct && (
              <div className="flex flex-col items-center">
                <img src={tryOnResult} alt="Try-On Result" className="mb-4 w-full max-w-md rounded-lg" />
                <div className="flex gap-4">
                  <img src={tryOnProduct.modelImages[0]} alt="Model" className="w-32 rounded" />
                  <img src={tryOnProduct.clothImage} alt="Cloth" className="w-32 rounded" />
                </div>
                <Button className="mt-4" onClick={() => setTryOnOpen(false)}>Close</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductListing;
