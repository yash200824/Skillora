import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Building, MapPin, Calendar, Clock, Calendar as CalendarIcon, User, ChevronLeft, Briefcase } from "lucide-react";
import { format } from "date-fns";

export default function RequirementDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  console.log("Requirement details page loaded, ID:", id);
  console.log("Current user:", user);

  // Fetch requirement details
  const { data: requirement, isLoading, error } = useQuery({
    queryKey: [`/api/requirements/${id}`],
    // Using the default queryFn from queryClient.ts which already includes credentials
    enabled: !!id && !!user,
    retry: 1
  });

  // Check if user already applied
  const { data: applications } = useQuery({
    queryKey: ["/api/my-applications"],
    // Using the default queryFn from queryClient.ts which already includes credentials
    enabled: !!user && user.role === "trainer",
  });

  const hasApplied = Array.isArray(applications) && applications.some((app: any) => app.requirement_id === Number(id));

  const applyMutation = useMutation({
    mutationFn: async (data: { cover_letter: string }) => {
      const res = await apiRequest("POST", `/api/apply/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully",
      });
      setCoverLetter("");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/my-applications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApply = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (user.role !== "trainer") {
      toast({
        title: "Access denied",
        description: "Only trainers can apply to opportunities",
        variant: "destructive",
      });
      return;
    }

    await applyMutation.mutateAsync({ cover_letter: coverLetter });
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1">
          <Sidebar isOpen={sidebarOpen} />
          <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="mt-4 text-lg font-medium text-neutral-800">Requirement not found</h3>
              <p className="mt-2 text-neutral-600">
                The requirement you're looking for might have been removed or is not available.
              </p>
              <Button className="mt-4" onClick={() => navigate("/opportunities")}>
                Go Back to Opportunities
              </Button>
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 gap-1"
            onClick={() => navigate("/opportunities")}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Opportunities
          </Button>
          
          {isLoading || !requirement ? (
            <>
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-6 w-1/3 mb-6" />
              <Skeleton className="h-24 w-full mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <h1 className="text-2xl font-bold text-neutral-800">{requirement.title}</h1>
                <Badge 
                  variant={requirement.status === "open" ? "default" : "secondary"} 
                  className={`mt-2 md:mt-0 capitalize self-start md:self-auto ${requirement.status === "open" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}
                >
                  {requirement.status}
                </Badge>
              </div>
              
              <div className="flex items-center text-neutral-600 mb-6">
                <Building className="h-4 w-4 mr-2" />
                <span>
                  {requirement.poster?.name || "Institution"}
                  {requirement.poster?.organization && ` • ${requirement.poster.organization}`}
                </span>
              </div>
              
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-3">Description</h2>
                  <p className="text-neutral-700 whitespace-pre-line">{requirement.description}</p>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center text-primary mb-2">
                      <MapPin className="h-5 w-5 mr-2" />
                      <h3 className="font-medium">Mode</h3>
                    </div>
                    <p className="text-neutral-700 capitalize">{requirement.mode}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center text-primary mb-2">
                      <Clock className="h-5 w-5 mr-2" />
                      <h3 className="font-medium">Duration</h3>
                    </div>
                    <p className="text-neutral-700">{requirement.duration_weeks} {requirement.duration_weeks === 1 ? "week" : "weeks"}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center text-primary mb-2">
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      <h3 className="font-medium">Posted</h3>
                    </div>
                    <p className="text-neutral-700">{format(new Date(requirement.created_at), "MMMM d, yyyy")}</p>
                  </CardContent>
                </Card>
              </div>
              
              {requirement.skills_required && requirement.skills_required.length > 0 && (
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-3">Skills Required</h2>
                    <div className="flex flex-wrap gap-2">
                      {requirement.skills_required.map((skill, index) => (
                        <Badge key={index} variant="outline" className="bg-primary-50 text-primary-800 hover:bg-primary-100 border-primary-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* About the College */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center text-primary mb-4">
                    <User className="h-5 w-5 mr-2" />
                    <h2 className="text-lg font-semibold">About the College</h2>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-primary-100 text-primary h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold">
                      {requirement.poster?.name.charAt(0) || "C"}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-neutral-800">{requirement.poster?.name || "Institution"}</h3>
                      {requirement.poster?.organization && (
                        <p className="text-neutral-600">{requirement.poster.organization}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Apply Button Section */}
              {user?.role === "trainer" && requirement.status === "open" && (
                <div className="mt-6 bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold text-neutral-800">Interested in this opportunity?</h3>
                      <p className="text-neutral-600 mt-1">Apply now to express your interest in conducting this training.</p>
                    </div>
                    
                    {hasApplied ? (
                      <div className="mt-4 md:mt-0 bg-green-50 text-green-700 px-4 py-2 rounded-md flex items-center">
                        <Briefcase className="h-5 w-5 mr-2" />
                        Application Submitted
                      </div>
                    ) : (
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="mt-4 md:mt-0">Apply Now</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Apply for {requirement.title}</DialogTitle>
                          </DialogHeader>
                          <div className="my-4">
                            <h4 className="font-medium mb-2">Cover Letter</h4>
                            <Textarea
                              placeholder="Explain why you are suitable for this opportunity..."
                              className="min-h-[150px]"
                              value={coverLetter}
                              onChange={(e) => setCoverLetter(e.target.value)}
                            />
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button 
                              onClick={handleApply} 
                              disabled={applyMutation.isPending || !coverLetter.trim()}
                            >
                              {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}