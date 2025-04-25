"use client";

import { Badge } from "@/dashboard/components/ui/badge";
import { Button } from "@/dashboard/components/ui/button";
import { Card, CardContent } from "@/dashboard/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/dashboard/components/ui/dialog";
import { Input } from "@/dashboard/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/dashboard/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/dashboard/components/ui/tabs";
import {
  Check,
  Loader2,
  Search,
  SlidersHorizontal,
  SortAsc,
  SortDesc,
  Tag,
} from "lucide-react";
import { useState } from "react";
import type { Index, SearchResult } from "../lib/api";
import { searchIndex } from "../lib/api";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  index: Index;
  apiKey: string;
}

export function SearchModal({
  isOpen,
  onClose,
  index,
  apiKey,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const rawFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== "" && value != null
        )
      );
      const searchParams = {
        query,
        filter: rawFilters,
        sortBy: sortField ? [`${sortField}:${sortDirection}`] : undefined,
        offset: (page - 1) * 10,
        limit: 10,
      };

      const results = await searchIndex(apiKey, index.name, searchParams);
      setResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFacetClick = (field: string, value: string) => {
    handleFilterChange(field, value);
    handleSearch();
  };

  const renderHighlightedText = (text: string) => {
    return { __html: text };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto p-6 flex flex-col">
        <DialogHeader className="h-fit mb-0">
          <DialogTitle className="text-2xl font-bold">
            Search in &apos;{index.name}&apos;
          </DialogTitle>
          <DialogDescription>
            Find and filter content across your index
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="flex gap-2 mb-6">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Enter search query..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="pl-9 h-10"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-10"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            {Object.keys(filters).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm text-gray-500 pt-1">
                  Active filters:
                </span>
                {Object.entries(filters).map(
                  ([field, value]) =>
                    value && (
                      <Badge
                        key={field}
                        variant="secondary"
                        className="px-3 py-1"
                      >
                        <span className="font-medium mr-1">{field}:</span>{" "}
                        {value}
                        <button
                          className="ml-2 hover:text-red-500"
                          onClick={() => {
                            handleFilterChange(field, "");
                            handleSearch();
                          }}
                        >
                          ×
                        </button>
                      </Badge>
                    )
                )}
                {Object.keys(filters).some((key) => filters[key]) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilters({});
                      handleSearch();
                    }}
                    className="text-sm text-gray-500"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            )}

            {results && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                  <p className="text-sm font-medium">
                    {results.nbHits} results found in {results.processingTimeMs}
                    ms
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPage(page - 1);
                        handleSearch();
                      }}
                      disabled={page === 1 || isLoading}
                      className="h-8"
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-medium px-2">
                      Page {page} of {Math.max(results.totalPages || 1, 1)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPage(page + 1);
                        handleSearch();
                      }}
                      disabled={
                        !results.totalPages ||
                        page >= results.totalPages ||
                        isLoading
                      }
                      className="h-8"
                    >
                      Next
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {results.hits.length > 0 ? (
                    results.hits.map((hit) => (
                      <Card key={hit.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 gap-3">
                            {Object.entries(hit).map(([key, value]) => {
                              if (key === "_highlight" || key === "id")
                                return null;

                              const highlight =
                                hit._highlight && hit._highlight[key];

                              return (
                                <div key={key} className="border-b pb-2">
                                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1 block">
                                    {key}
                                  </span>
                                  <div className="text-sm">
                                    {highlight ? (
                                      <span
                                        className="text-sm"
                                        dangerouslySetInnerHTML={renderHighlightedText(
                                          highlight
                                        )}
                                      />
                                    ) : (
                                      <span className="text-sm">
                                        {String(value)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">
                        No results found for your query
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Try adjusting your search terms or filters
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="md:border-l md:pl-6">
            <Card className="bg-gray-50 p-4 rounded-lg sticky top-4">
              <Tabs defaultValue="filters" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="filters" className="flex-1">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </TabsTrigger>
                  <TabsTrigger value="sort" className="flex-1">
                    {sortDirection === "asc" ? (
                      <SortAsc className="h-4 w-4 mr-2" />
                    ) : (
                      <SortDesc className="h-4 w-4 mr-2" />
                    )}
                    Sort
                  </TabsTrigger>
                  {results?.facetDistribution && (
                    <TabsTrigger value="facets" className="flex-1">
                      <Tag className="h-4 w-4 mr-2" />
                      Facets
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="filters" className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">
                    Filter by fields
                  </h3>
                  <div className="space-y-4">
                    {index.config.fields.map((field) => (
                      <div key={field} className="space-y-1">
                        <label className="text-sm font-medium">{field}</label>
                        <Input
                          placeholder={`Filter by ${field}...`}
                          value={filters[field] || ""}
                          onChange={(e) =>
                            handleFilterChange(field, e.target.value)
                          }
                          className="text-sm"
                        />
                      </div>
                    ))}
                    {index.config.fields.length > 0 && (
                      <Button
                        onClick={handleSearch}
                        variant="secondary"
                        className="w-full mt-4"
                      >
                        Apply Filters
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="sort" className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort by field</label>
                    <Select value={sortField} onValueChange={setSortField}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {index.config.storeFields.map((field) => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Direction</label>
                    <div className="flex gap-2">
                      <Button
                        variant={
                          sortDirection === "asc" ? "default" : "outline"
                        }
                        className={`flex-1 ${
                          sortDirection === "asc" ? "bg-blue-600" : ""
                        }`}
                        onClick={() => setSortDirection("asc")}
                      >
                        <SortAsc className="h-4 w-4 mr-2" /> Ascending
                      </Button>
                      <Button
                        variant={
                          sortDirection === "desc" ? "default" : "outline"
                        }
                        className={`flex-1 ${
                          sortDirection === "desc" ? "bg-blue-600" : ""
                        }`}
                        onClick={() => setSortDirection("desc")}
                      >
                        <SortDesc className="h-4 w-4 mr-2" /> Descending
                      </Button>
                    </div>
                  </div>

                  {sortField && (
                    <Button
                      onClick={handleSearch}
                      variant="secondary"
                      className="w-full mt-4"
                    >
                      Apply Sorting
                    </Button>
                  )}
                </TabsContent>

                {results?.facetDistribution && (
                  <TabsContent value="facets" className="space-y-6">
                    {Object.entries(results.facetDistribution).map(
                      ([field, values]) => (
                        <div key={field} className="space-y-2">
                          <h3 className="text-sm font-medium">{field}</h3>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(values).map(([value, count]) => (
                              <Badge
                                key={value}
                                variant={
                                  filters[field] === value
                                    ? "default"
                                    : "outline"
                                }
                                className={`cursor-pointer hover:bg-gray-100 ${
                                  filters[field] === value
                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                    : ""
                                }`}
                                onClick={() => handleFacetClick(field, value)}
                              >
                                {filters[field] === value && (
                                  <Check className="h-3 w-3 mr-1" />
                                )}
                                {value} ({count})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    )}

                    {results.facetStats &&
                      Object.entries(results.facetStats).map(
                        ([field, stats]) => (
                          <div
                            key={field}
                            className="bg-gray-50 p-3 rounded-lg space-y-2"
                          >
                            <h3 className="text-sm font-medium">
                              {field} Statistics
                            </h3>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="bg-white p-2 rounded border">
                                <p className="text-gray-500 text-xs">Minimum</p>
                                <p className="font-medium">{stats.min}</p>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <p className="text-gray-500 text-xs">Maximum</p>
                                <p className="font-medium">{stats.max}</p>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <p className="text-gray-500 text-xs">Average</p>
                                <p className="font-medium">
                                  {stats.avg.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                  </TabsContent>
                )}
              </Tabs>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
