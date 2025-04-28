import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import TrainerApplicationTable from "@/components/trainer/application-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function TrainerApplications() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { data: applications, isLoading } = useQuery({
    queryKey: ["/api/my-applications"],
  });
  
  // Organize applications by status
  const organizedApplications = applications ? {
    pending: applications.filter(app => app.status === 'applied'),
    shortlisted: applications.filter(app => app.status === 'shortlisted'),
    accepted: applications.filter(app => app.status === 'accepted'),
    rejected: applications.filter(app => app.status === 'rejected'),
    all: applications
  } : {
    pending: [],
    shortlisted: [],
    accepted: [],
    rejected: [],
    all: []
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-800">My Applications</h2>
            <p className="mt-1 text-sm text-neutral-600">Track and manage your submitted applications</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : applications && applications.length > 0 ? (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({organizedApplications.all.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({organizedApplications.pending.length})</TabsTrigger>
                <TabsTrigger value="shortlisted">Shortlisted ({organizedApplications.shortlisted.length})</TabsTrigger>
                <TabsTrigger value="accepted">Accepted ({organizedApplications.accepted.length})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({organizedApplications.rejected.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <TrainerApplicationTable applications={organizedApplications.all} />
              </TabsContent>
              
              <TabsContent value="pending">
                <TrainerApplicationTable applications={organizedApplications.pending} />
              </TabsContent>
              
              <TabsContent value="shortlisted">
                <TrainerApplicationTable applications={organizedApplications.shortlisted} />
              </TabsContent>
              
              <TabsContent value="accepted">
                <TrainerApplicationTable applications={organizedApplications.accepted} />
              </TabsContent>
              
              <TabsContent value="rejected">
                <TrainerApplicationTable applications={organizedApplications.rejected} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="h-12 w-12 mx-auto bg-neutral-100 rounded-full flex items-center justify-center">
                <File className="h-6 w-6 text-neutral-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-neutral-800">No applications yet</h3>
              <p className="mt-2 text-neutral-600">
                You haven't applied to any training requirements yet.
              </p>
              <Button
                className="mt-4"
                onClick={() => window.location.href = "/opportunities"}
              >
                Browse Opportunities
              </Button>
            </div>
          )}
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}

// Missing imports
import { Button } from "@/components/ui/button";

function File(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}
