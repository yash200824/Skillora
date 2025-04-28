import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import OpportunityCard from "@/components/opportunity-card";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TrainerOpportunities() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [onlyOpenRequirements, setOnlyOpenRequirements] = useState(true);

  // Fetch all requirements
  const { data: requirements, isLoading } = useQuery({
    queryKey: ["/api/requirements"],
  });

  // Filter requirements based on search, mode, and open status
  const filteredRequirements = requirements
    ? requirements.filter((req) => {
        // Filter by open status if checkbox is checked
        if (onlyOpenRequirements && req.status !== "open") {
          return false;
        }
        
        // Filter by mode if selected (and not "all")
        if (selectedMode && selectedMode !== "all" && req.mode !== selectedMode) {
          return false;
        }
        
        // Filter by search query in title or description
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            req.title.toLowerCase().includes(query) ||
            req.description.toLowerCase().includes(query) ||
            (req.skills_required && req.skills_required.some(skill => 
              skill.toLowerCase().includes(query)
            ))
          );
        }
        
        return true;
      })
    : [];

  // Get unique modes for the filter dropdown
  const uniqueModes = requirements
    ? [...new Set(requirements.map((req) => req.mode))]
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-800">Find Opportunities</h2>
            <p className="mt-1 text-sm text-neutral-600">Browse and apply for training requirements from colleges and universities</p>
          </div>
          
          {/* Search and Filter */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Search by title, description, or skills..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  {uniqueModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="only-open"
                  checked={onlyOpenRequirements}
                  onCheckedChange={(checked) => 
                    setOnlyOpenRequirements(checked as boolean)
                  }
                />
                <Label htmlFor="only-open">Show only open opportunities</Label>
              </div>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mb-4 flex items-center">
            <span className="text-sm text-neutral-600">
              {isLoading
                ? "Loading opportunities..."
                : `Showing ${filteredRequirements.length} ${
                    filteredRequirements.length === 1
                      ? "opportunity"
                      : "opportunities"
                  }`}
            </span>
            
            {searchQuery && (
              <Badge variant="secondary" className="ml-2">
                Search: {searchQuery}
                <button
                  className="ml-1 hover:text-neutral-900"
                  onClick={() => setSearchQuery("")}
                >
                  ×
                </button>
              </Badge>
            )}
            
            {selectedMode && selectedMode !== "all" && (
              <Badge variant="secondary" className="ml-2">
                Mode: {selectedMode}
                <button
                  className="ml-1 hover:text-neutral-900"
                  onClick={() => setSelectedMode("all")}
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
          
          {/* Opportunities Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredRequirements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequirements.map((requirement) => (
                <OpportunityCard key={requirement.id} requirement={requirement} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Search className="h-12 w-12 mx-auto text-neutral-300" />
              <h3 className="mt-4 text-lg font-medium text-neutral-800">No opportunities found</h3>
              <p className="mt-2 text-neutral-600">
                {searchQuery || (selectedMode && selectedMode !== "all")
                  ? "Try adjusting your filters or search query"
                  : "There are no open opportunities currently available"}
              </p>
            </div>
          )}
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
