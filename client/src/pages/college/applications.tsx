import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import ApplicationList from "@/components/college/application-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function CollegeApplications() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<string>("");
  
  // Extract requirementId from URL if present
  const params = new URLSearchParams(window.location.search);
  const requirementIdFromUrl = params.get("requirementId");
  
  // Fetch all requirements
  const { data: requirements, isLoading: isRequirementsLoading } = useQuery({
    queryKey: ["/api/requirements"],
  });
  
  // Set the selected requirement from URL on initial load
  useEffect(() => {
    if (requirementIdFromUrl && !selectedRequirement) {
      setSelectedRequirement(requirementIdFromUrl);
    } else if (requirements && requirements.length > 0 && !selectedRequirement) {
      // If no requirement is specified in URL, select the first one
      setSelectedRequirement(requirements[0].id.toString());
    }
  }, [requirementIdFromUrl, requirements, selectedRequirement]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-800">Applications</h2>
            <p className="mt-1 text-sm text-neutral-600">Review and manage applications from trainers</p>
          </div>
          
          {isRequirementsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requirements && requirements.length > 0 ? (
            <>
              <Card className="mb-6 shadow-sm border border-neutral-200">
                <CardHeader>
                  <CardTitle>Select Requirement</CardTitle>
                  <CardDescription>Choose a requirement to view its applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedRequirement}
                    onValueChange={setSelectedRequirement}
                  >
                    <SelectTrigger className="w-full md:max-w-md">
                      <SelectValue placeholder="Select a requirement" />
                    </SelectTrigger>
                    <SelectContent>
                      {requirements.map((req) => (
                        <SelectItem key={req.id} value={req.id.toString()}>
                          {req.title} ({req.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              
              {selectedRequirement ? (
                <ApplicationList requirementId={parseInt(selectedRequirement)} />
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-neutral-600">Please select a requirement to view applications.</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-lg font-medium text-neutral-800 mb-2">No requirements found</h3>
              <p className="text-neutral-600 mb-4">
                You need to post training requirements before you can receive applications.
              </p>
              <Link href="/create-requirement">
                <Button>Post Requirement</Button>
              </Link>
            </div>
          )}
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
