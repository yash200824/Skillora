import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Database, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SeedDatabaseButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/seed-database");
      return await res.json();
    },
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Sample data has been added to the database.",
        variant: "default",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to seed database. Please try again.",
        variant: "destructive",
      });
      console.error("Seed error:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });
  
  const handleSeedDatabase = () => {
    if (window.confirm("This will add sample trainers, colleges, and requirements to the database. Continue?")) {
      seedMutation.mutate();
    }
  };
  
  return (
    <Button 
      onClick={handleSeedDatabase} 
      disabled={isLoading}
      className="bg-amber-500 hover:bg-amber-600 text-white"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Seeding Database...
        </>
      ) : (
        <>
          <Database className="mr-2 h-4 w-4" />
          Seed Sample Data
        </>
      )}
    </Button>
  );
}