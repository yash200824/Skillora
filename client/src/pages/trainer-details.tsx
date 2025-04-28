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
import { useAuth } from "@/hooks/use-auth";
import { 
  User, 
  ChevronLeft, 
  MapPin, 
  Mail, 
  Phone, 
  Star, 
  GraduationCap, 
  Calendar, 
  Clock, 
  Award 
} from "lucide-react";
import { format } from "date-fns";

export default function TrainerDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Extract the ID from the URL directly if params.id is null
  const pathSegments = location.split('/');
  const trainerId = id || pathSegments[pathSegments.length - 1];
  
  // Fetch trainer details
  const { data: trainer, isLoading: isLoadingTrainer, error: trainerError } = useQuery({
    queryKey: [`/api/users/${trainerId}`],
    enabled: !!trainerId && !!user,
    retry: 1
  });

  // Fetch trainer's completed contracts
  const { data: contracts, isLoading: isLoadingContracts } = useQuery({
    queryKey: [`/api/trainer/${trainerId}/contracts`],
    enabled: !!trainerId && !!user,
  });

  // Fetch trainer reviews
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: [`/api/reviews/user/${trainerId}`],
    enabled: !!trainerId && !!user,
  });

  // Calculate average rating
  const averageRating = reviews && reviews.length > 0
    ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
    : "N/A";

  const isLoading = isLoadingTrainer || isLoadingContracts || isLoadingReviews;

  if (trainerError) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1">
          <Sidebar isOpen={sidebarOpen} />
          <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="mt-4 text-lg font-medium text-neutral-800">Trainer not found</h3>
              <p className="mt-2 text-neutral-600">
                The trainer you're looking for might have been removed or is not available.
              </p>
              <Button className="mt-4" onClick={() => navigate(-1)}>
                Go Back
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
          
          {isLoading || !trainer ? (
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
                    {trainer.name?.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-neutral-800">{trainer.name}</h1>
                    <div className="flex items-center space-x-2 text-neutral-600">
                      {averageRating !== "N/A" && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span>{averageRating}</span>
                        </div>
                      )}
                      {trainer.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-neutral-500 mr-1" />
                          <span>{trainer.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {trainer.bio && (
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <h2 className="text-lg font-semibold mb-3">About</h2>
                      <p className="text-neutral-700 whitespace-pre-line">{trainer.bio}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Trainer Details */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-primary" />
                      Trainer Details
                    </h2>
                    
                    <div className="space-y-4">
                      {trainer.location && (
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-neutral-700">Location</p>
                            <p className="text-neutral-600">{trainer.location}</p>
                          </div>
                        </div>
                      )}
                      
                      {trainer.email && (
                        <div className="flex items-start">
                          <Mail className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-neutral-700">Email</p>
                            <p className="text-neutral-600">{trainer.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {trainer.phone && (
                        <div className="flex items-start">
                          <Phone className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-neutral-700">Phone</p>
                            <p className="text-neutral-600">{trainer.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      {trainer.skills && trainer.skills.length > 0 && (
                        <div className="flex items-start">
                          <Award className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-neutral-700">Skills</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {trainer.skills.map((skill, index) => (
                                <Badge 
                                  key={index} 
                                  variant="outline" 
                                  className="bg-primary-50 text-primary-800 hover:bg-primary-100 border-primary-200"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start">
                        <GraduationCap className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-neutral-700">Completed Courses</p>
                          <p className="text-neutral-600">
                            {contracts ? contracts.filter(c => c.payment_status === 'paid').length : 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Trainer Ratings */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <Star className="h-5 w-5 mr-2 text-primary" />
                      Trainer Ratings
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
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b border-neutral-100 pb-3">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-medium">{review.reviewer?.name || "College"}</p>
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
              
              {/* Training History */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Training History</h2>
                
                {isLoadingContracts ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-[120px] w-full rounded-lg" />
                    ))}
                  </div>
                ) : contracts && contracts.length > 0 ? (
                  <div className="space-y-4">
                    {contracts
                      .filter(contract => contract.payment_status === 'paid')
                      .map((contract) => (
                        <Card key={contract.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="p-6">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-neutral-800 mb-1">
                                    {contract.requirement?.title || "Training Course"}
                                  </h3>
                                  <p className="text-neutral-600 text-sm mb-2">
                                    {contract.college?.name || "Institution"}
                                    {contract.college?.organization && ` • ${contract.college.organization}`}
                                  </p>
                                  
                                  <div className="flex flex-wrap gap-3 text-sm text-neutral-500 mt-3">
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      <span>
                                        {format(new Date(contract.created_at), "MMM yyyy")}
                                      </span>
                                    </div>
                                    
                                    {contract.requirement?.mode && (
                                      <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        <span className="capitalize">{contract.requirement.mode}</span>
                                      </div>
                                    )}
                                    
                                    {contract.requirement?.duration_weeks && (
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        <span>
                                          {contract.requirement.duration_weeks} 
                                          {contract.requirement.duration_weeks === 1 ? " week" : " weeks"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <Badge 
                                  variant="outline" 
                                  className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                >
                                  Completed
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-neutral-500 italic">No training history available</p>
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