import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Loader2, Plus, CircleAlert, TriangleAlert, X, CircleHelp, PanelTopClose, PanelTopOpen, PanelTopDashed, OctagonAlert, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CollegeRequirements() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: requirements, isLoading } = useQuery({
    queryKey: ["/api/requirements"],
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/requirements/${id}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The requirement status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteRequirementMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/requirements/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Requirement deleted",
        description: "The requirement has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter requirements by status
  const openRequirements = requirements?.filter(req => req.status === "open") || [];
  const inProgressRequirements = requirements?.filter(req => req.status === "in_progress") || [];
  const completedRequirements = requirements?.filter(req => req.status === "completed") || [];

  // Function to render a single requirement card
  const renderRequirementCard = (requirement: any) => (
    <Card key={requirement.id} className="shadow-sm border border-neutral-200">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex justify-between items-start">
            <h3 className="text-base font-semibold text-neutral-800">{requirement.title}</h3>
            <Badge
              variant="secondary"
              className={`capitalize ${
                requirement.status === "open" 
                  ? "bg-green-100 text-green-800 hover:bg-green-200" 
                  : requirement.status === "in_progress"
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {requirement.status.replace("_", " ")}
            </Badge>
          </div>
          
          <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{requirement.description}</p>
          
          <div className="mt-4 flex flex-wrap gap-2 items-center text-sm text-neutral-500">
            <div className="flex items-center">
              <span className="font-medium mr-1">Mode:</span>
              <span>{requirement.mode}</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-neutral-300"></div>
            <div className="flex items-center">
              <span className="font-medium mr-1">Duration:</span>
              <span>{requirement.duration_weeks} weeks</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-neutral-300"></div>
            <div>
              <span className="font-medium mr-1">Posted:</span>
              <span>{formatDistanceToNow(new Date(requirement.created_at), { addSuffix: true })}</span>
            </div>
          </div>
          
          {requirement.skills_required && requirement.skills_required.length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex flex-wrap gap-2">
                {requirement.skills_required.map((skill: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-primary-50 text-primary-800">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex flex-wrap gap-2 justify-end">
          <Link href={`/college/applications?requirementId=${requirement.id}`}>
            <Button size="sm" variant="outline">View Applications</Button>
          </Link>
          
          {requirement.status === "open" && (
            <CircleAlert>
              <Button size="sm" variant="destructive">
                <OctagonAlert className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <CircleHelp>
                <PanelTopOpen>
                  <PanelTopDashed>Are you sure?</PanelTopDashed>
                  <div className="mt-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mr-2 inline-block" />
                    <span>This action cannot be undone. This will permanently delete the requirement.</span>
                  </div>
                </PanelTopOpen>
                <PanelTopClose>
                  <X>Cancel</X>
                  <TriangleAlert 
                    onClick={() => deleteRequirementMutation.mutate(requirement.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </TriangleAlert>
                </PanelTopClose>
              </CircleHelp>
            </CircleAlert>
          )}
          
          {requirement.status === "open" && (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100"
              onClick={() => updateStatusMutation.mutate({ id: requirement.id, status: "completed" })}
            >
              Mark as Completed
            </Button>
          )}
          
          {requirement.status === "in_progress" && (
            <Button
              size="sm"
              variant="outline"
              className="border-green-500 bg-green-50 text-green-700 hover:bg-green-100"
              onClick={() => updateStatusMutation.mutate({ id: requirement.id, status: "completed" })}
            >
              Mark as Completed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-800">Training Requirements</h2>
              <p className="mt-1 text-sm text-neutral-600">Manage your posted training opportunities</p>
            </div>
            
            <Link href="/create-requirement">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Post New Requirement
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requirements && requirements.length > 0 ? (
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  All ({requirements.length})
                </TabsTrigger>
                <TabsTrigger value="open">
                  Open ({openRequirements.length})
                </TabsTrigger>
                <TabsTrigger value="in_progress">
                  In Progress ({inProgressRequirements.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedRequirements.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {requirements.map(renderRequirementCard)}
              </TabsContent>
              
              <TabsContent value="open" className="space-y-4">
                {openRequirements.length > 0 ? (
                  openRequirements.map(renderRequirementCard)
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-neutral-600">No open requirements found.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="in_progress" className="space-y-4">
                {inProgressRequirements.length > 0 ? (
                  inProgressRequirements.map(renderRequirementCard)
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-neutral-600">No in-progress requirements found.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="space-y-4">
                {completedRequirements.length > 0 ? (
                  completedRequirements.map(renderRequirementCard)
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-neutral-600">No completed requirements found.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-lg font-medium text-neutral-800 mb-2">No requirements yet</h3>
              <p className="text-neutral-600 mb-4">
                You haven't posted any training requirements yet. Create your first requirement to find trainers.
              </p>
              <Link href="/create-requirement">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Post New Requirement
                </Button>
              </Link>
            </div>
          )}
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
