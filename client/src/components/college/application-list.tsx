import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import ApplicationItem from "@/components/application-item";

interface RequirementApplicationsProps {
  requirementId: number;
}

export default function ApplicationList({ requirementId }: RequirementApplicationsProps) {
  const [selectedTab, setSelectedTab] = useState("all");
  
  const { data: applications, isLoading, error } = useQuery({
    queryKey: [`/api/requirements/${requirementId}/applications`],
    enabled: !!requirementId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-neutral-700">Error loading applications: {(error as Error).message}</p>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-neutral-600">No applications have been submitted for this requirement yet.</p>
      </div>
    );
  }

  // Filter applications based on the selected tab
  const filteredApplications = applications.filter(app => {
    if (selectedTab === "all") return true;
    return app.status === selectedTab;
  });

  // Count applications by status
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            All ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="applied">
            Applied ({statusCounts["applied"] || 0})
          </TabsTrigger>
          <TabsTrigger value="shortlisted">
            Shortlisted ({statusCounts["shortlisted"] || 0})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({statusCounts["accepted"] || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab}>
          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-neutral-600">No {selectedTab !== "all" ? selectedTab : ""} applications found.</p>
            </div>
          ) : (
            filteredApplications.map(application => (
              <ApplicationItem 
                key={application.id} 
                application={application} 
                isCollege={true} 
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
