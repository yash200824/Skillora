import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Building, ChevronLeft, MapPin, Phone, Mail, Star, FileText } from "lucide-react";
import { format } from "date-fns";
import OpportunityCard from "@/components/opportunity-card";

export default function CollegeDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Extract the ID from the URL directly if params.id is null
  const pathSegments = location.split('/');
  const collegeId = id || pathSegments[pathSegments.length - 1];
  
  // Fetch college details
  const { data: college, isLoading: isLoadingCollege, error: collegeError } = useQuery({
    queryKey: [`/api/users/${collegeId}`],
    enabled: !!collegeId && !!user,
    retry: 1
  });

  // Fetch college's requirements
  const { data: requirements, isLoading: isLoadingRequirements } = useQuery({
    queryKey: [`/api/college/${collegeId}/requirements`],
    enabled: !!collegeId && !!user,
  });

  // Fetch college reviews
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: [`/api/reviews/user/${collegeId}`],
    enabled: !!collegeId && !!user,
  });

  // Calculate average rating
  const averageRating = reviews && reviews.length > 0
    ? (reviews.reduce((acc: number, review: any) => acc + review.rating, 0) / reviews.length).toFixed(1)
    : "N/A";

  const isLoading = isLoadingCollege || isLoadingRequirements || isLoadingReviews;

  if (collegeError) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1">
          <Sidebar isOpen={sidebarOpen} />
          <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="mt-4 text-lg font-medium text-neutral-800">College not found</h3>
              <p className="mt-2 text-neutral-600">
                The college you're looking for might have been removed or is not available.
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
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          
          {isLoading || !college ? (
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
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 text-primary h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    {college.name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-neutral-800">{college.name}</h1>
                    {college.organization && (
                      <p className="text-neutral-600">{college.organization}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* College Details */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <Building className="h-5 w-5 mr-2 text-primary" />
                      College Details
                    </h2>
                    
                    <div className="space-y-4">
                      {college.location && (
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-neutral-700">Location</p>
                            <p className="text-neutral-600">{college.location}</p>
                          </div>
                        </div>
                      )}
                      
                      {college.email && (
                        <div className="flex items-start">
                          <Mail className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-neutral-700">Email</p>
                            <p className="text-neutral-600">{college.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {college.phone && (
                        <div className="flex items-start">
                          <Phone className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-neutral-700">Phone</p>
                            <p className="text-neutral-600">{college.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start">
                        <FileText className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-neutral-700">Total Requirements</p>
                          <p className="text-neutral-600">{requirements?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* College Ratings */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <Star className="h-5 w-5 mr-2 text-primary" />
                      College Ratings
                    </h2>
                    
                    <div className="flex items-center mb-6">
                      <div className="bg-primary-50 text-primary-800 text-2xl font-bold h-16 w-16 rounded-md flex items-center justify-center mr-4">
                        {averageRating}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-700">Average Rating</p>
                        <p className="text-neutral-600">Based on {reviews?.length || 0} reviews</p>
                      </div>
                    </div>
                    
                    {reviews && reviews.length > 0 ? (
                      <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
                        {reviews.map((review: any) => (
                          <div key={review.id} className="border-b border-neutral-100 pb-3">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-medium">{review.reviewer?.name || "Trainer"}</p>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 mr-1 inline" />
                                <span>{review.rating}</span>
                              </div>
                            </div>
                            <p className="text-neutral-600 text-sm">{review.comment}</p>
                            <p className="text-neutral-400 text-xs mt-1">
                              {format(new Date(review.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-500 italic">No reviews yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* College Requirements */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Requirements Posted</h2>
                
                {isLoadingRequirements ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-[220px] w-full rounded-lg" />
                    ))}
                  </div>
                ) : requirements && requirements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {requirements.map((requirement: any) => (
                      <OpportunityCard key={requirement.id} requirement={requirement} />
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-500 italic">No requirements posted yet</p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}