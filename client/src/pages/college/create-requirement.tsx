import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

const requirementSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters long",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters long",
  }),
  mode: z.string().min(1, {
    message: "Please select a mode",
  }),
  skills_required: z.string().min(3, {
    message: "Please enter at least one skill",
  }),
  duration_weeks: z.string().min(1, {
    message: "Please enter the duration",
  }),
});

type RequirementFormValues = z.infer<typeof requirementSchema>;

export default function CreateRequirement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const form = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      title: "",
      description: "",
      mode: "",
      skills_required: "",
      duration_weeks: "",
    },
  });
  
  const createRequirementMutation = useMutation({
    mutationFn: async (data: RequirementFormValues) => {
      // Convert skill string to array and duration to integer
      const formattedData = {
        ...data,
        skills_required: data.skills_required.split(",").map(skill => skill.trim()),
        duration_weeks: parseInt(data.duration_weeks),
      };
      
      const res = await apiRequest("POST", "/api/requirements", formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Requirement created",
        description: "Your training requirement has been successfully posted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
      navigate("/requirements");
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: RequirementFormValues) => {
    createRequirementMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-800">Create Training Requirement</h2>
            <p className="mt-1 text-sm text-neutral-600">Post a new training opportunity for trainers to apply</p>
          </div>
          
          <Card className="shadow-sm border border-neutral-200 max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Training Details</CardTitle>
              <CardDescription>
                Provide detailed information about the training requirement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Advanced Data Science Workshop" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Give your training a clear, concise title.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the course requirements, objectives, and expectations..." 
                            rows={5}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of what the training will cover and your expectations.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mode of Training</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Online">Online</SelectItem>
                              <SelectItem value="On-campus">On-campus</SelectItem>
                              <SelectItem value="Hybrid">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How will the training be conducted?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="duration_weeks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (in weeks)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              placeholder="e.g., 4" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            How long will the training last?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="skills_required"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills Required (comma separated)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Python, Machine Learning, Data Visualization" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          List the skills trainers should have, separated by commas.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/requirements")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createRequirementMutation.isPending}
                    >
                      {createRequirementMutation.isPending ? "Posting..." : "Post Requirement"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
