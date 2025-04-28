import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, MapPin, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface OpportunityCardProps {
  requirement: {
    id: number;
    title: string;
    description: string;
    posted_by: number;
    status: string;
    mode: string;
    skills_required: string[];
    duration_weeks: number;
    created_at: string;
    poster?: {
      id: number;
      name: string;
      organization?: string;
    };
  };
}

export default function OpportunityCard({ requirement }: OpportunityCardProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [coverLetter, setCoverLetter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const applyMutation = useMutation({
    mutationFn: async (data: { cover_letter: string }) => {
      const res = await apiRequest("POST", `/api/apply/${requirement.id}`, data);
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

  return (
    <Card className="overflow-hidden shadow-sm border border-neutral-200">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex justify-between items-start">
            <h3 className="text-base font-semibold text-neutral-800 line-clamp-1">{requirement.title}</h3>
            <Badge 
              variant={requirement.status === "open" ? "default" : "secondary"} 
              className={`capitalize ${requirement.status === "open" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}
            >
              {requirement.status}
            </Badge>
          </div>
          
          <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{requirement.description}</p>
          
          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-neutral-500">
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-1 text-neutral-400" />
              <span>{requirement.poster?.name || "Institution"}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-neutral-400" />
              <span>{requirement.mode}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-neutral-400" />
              <span>{requirement.duration_weeks} {requirement.duration_weeks === 1 ? "week" : "weeks"}</span>
            </div>
          </div>
          
          {requirement.skills_required && requirement.skills_required.length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex flex-wrap gap-2">
                {requirement.skills_required.map((skill, index) => (
                  <Badge key={index} variant="outline" className="bg-primary-50 text-primary-800 hover:bg-primary-100 border-primary-200">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="px-5 py-3 bg-neutral-50 flex justify-between items-center">
          <span className="text-sm font-medium text-neutral-700">
            Posted {formatDistanceToNow(new Date(requirement.created_at), { addSuffix: true })}
          </span>
          
          <div className="flex gap-2">
            <Link to={`/opportunities/${requirement.id}`}>
              <Button size="sm" variant="outline">View Details</Button>
            </Link>
            
            {user?.role === "trainer" && requirement.status === "open" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Apply Now</Button>
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
            
            {user?.role === "college" && (
              <Link to={`/college/applications?requirementId=${requirement.id}`}>
                <Button size="sm" variant="outline">View Applications</Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
