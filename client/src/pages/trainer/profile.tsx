import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, Edit, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const profileSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  bio: z.string().optional(),
  skills: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function TrainerProfile() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch user profile
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["/api/profile"],
  });
  
  // Fetch user reviews
  const { data: reviews, isLoading: isReviewsLoading } = useQuery({
    queryKey: ["/api/reviews", user?.id],
    enabled: !!user,
  });
  
  // Fetch average rating
  const { data: ratingData } = useQuery({
    queryKey: ["/api/ratings", user?.id],
    enabled: !!user,
  });
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || "",
      bio: profile?.bio || "",
      skills: profile?.skills ? profile.skills.join(", ") : "",
      email: profile?.email || "",
    },
  });
  
  // Update form default values when profile data loads
  useState(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        bio: profile.bio || "",
        skills: profile.skills ? profile.skills.join(", ") : "",
        email: profile.email || "",
      });
    }
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      // Process skills from comma-separated string to array
      const processedData = {
        ...data,
        skills: data.skills ? data.skills.split(",").map(skill => skill.trim()) : [],
      };
      
      const res = await apiRequest("PATCH", "/api/profile/update", processedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  const averageRating = ratingData?.averageRating || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-800">My Profile</h2>
            <p className="mt-1 text-sm text-neutral-600">Manage your personal information and review your ratings</p>
          </div>
          
          {isProfileLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-2">
                <Card className="shadow-sm border border-neutral-200">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Update your profile to attract more opportunities</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(!editing)}
                    >
                      {editing ? (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Save
                        </>
                      ) : (
                        <>
                          <Edit className="mr-2 h-4 w-4" /> Edit Profile
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {editing ? (
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Tell colleges about your experience and expertise..."
                                    className="resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="skills"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Skills (comma separated)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., JavaScript, React, Node.js"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditing(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={updateProfileMutation.isPending}
                            >
                              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                              {profile?.name ? getInitials(profile.name) : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <h3 className="text-lg font-semibold">{profile?.name}</h3>
                            <p className="text-sm text-neutral-500">{profile?.email}</p>
                            {profile?.verified ? (
                              <Badge className="mt-1" variant="success">Verified Trainer</Badge>
                            ) : (
                              <Badge className="mt-1" variant="outline">Pending Verification</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-neutral-700 mb-2">Bio</h4>
                          <p className="text-neutral-600">
                            {profile?.bio || "No bio provided. Edit your profile to add a bio."}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-neutral-700 mb-2">Skills</h4>
                          {profile?.skills && profile.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {profile.skills.map((skill, index) => (
                                <Badge key={index} variant="outline" className="bg-primary-50 text-primary-800">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-neutral-600">No skills listed. Edit your profile to add your skills.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Stats & Ratings Card */}
              <div>
                <Card className="shadow-sm border border-neutral-200">
                  <CardHeader>
                    <CardTitle>Rating & Stats</CardTitle>
                    <CardDescription>Your performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center p-4 bg-primary-50 rounded-full mb-2">
                        <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                      </div>
                      <h3 className="text-3xl font-bold">{averageRating.toFixed(1)}</h3>
                      <p className="text-sm text-neutral-500">Average Rating</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-neutral-50 p-4 rounded-lg text-center">
                        <h4 className="text-2xl font-bold text-neutral-800">
                          {reviews?.length || 0}
                        </h4>
                        <p className="text-sm text-neutral-500">Total Reviews</p>
                      </div>
                      <div className="bg-neutral-50 p-4 rounded-lg text-center">
                        <h4 className="text-2xl font-bold text-neutral-800">
                          {profile?.verified ? "Yes" : "No"}
                        </h4>
                        <p className="text-sm text-neutral-500">Verified</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Reviews Section */}
              <div className="lg:col-span-3">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Reviews</h3>
                
                {isReviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : reviews && reviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="shadow-sm border border-neutral-200">
                        <CardContent className="pt-6">
                          <div className="flex items-start">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-neutral-200 text-neutral-600">
                                {review.reviewer?.name ? getInitials(review.reviewer.name) : "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-3">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-neutral-900">
                                  {review.reviewer?.name || "Anonymous"}
                                </p>
                                <span className="mx-2 text-neutral-300">•</span>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-neutral-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="mt-1 text-xs text-neutral-500">
                                {review.requirement?.title || "Unknown Course"}
                              </p>
                              <p className="mt-2 text-sm text-neutral-600">
                                {review.comment || "No comment provided."}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="shadow-sm border border-neutral-200">
                    <CardContent className="pt-6 text-center py-12">
                      <Star className="h-12 w-12 mx-auto text-neutral-300" />
                      <h3 className="mt-4 text-lg font-medium text-neutral-800">No reviews yet</h3>
                      <p className="mt-2 text-neutral-600">
                        You haven't received any reviews yet. Complete training courses to get reviews from colleges.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
