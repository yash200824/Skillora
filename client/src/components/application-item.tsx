import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ApplicationItemProps {
  application: {
    id: number;
    trainer_id: number;
    requirement_id: number;
    status: string;
    cover_letter?: string;
    created_at: string;
    requirement?: {
      id: number;
      title: string;
      description: string;
      status: string;
    };
    trainer?: {
      id: number;
      name: string;
      email: string;
      bio?: string;
      skills?: string[];
    };
  };
  isCollege?: boolean;
}

export default function ApplicationItem({ application, isCollege = false }: ApplicationItemProps) {
  const { toast } = useToast();

  const shortlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/requirements/${application.requirement_id}/shortlist`, {
        applicationId: application.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Applicant shortlisted",
        description: "The applicant has been notified",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/requirements/${application.requirement_id}/applications`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to shortlist",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/requirements/${application.requirement_id}/accept`, {
        applicationId: application.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Applicant accepted",
        description: "A contract has been generated. The trainer has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/requirements/${application.requirement_id}/applications`] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      // Invalidate requirements to update its status
      queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "default";
      case "shortlisted":
        return "warning";
      case "accepted":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="mb-4 shadow-sm border border-neutral-200">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary-100 text-primary-800">
                  {application.trainer?.name ? getInitials(application.trainer.name) : "TR"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4">
                <div className="flex items-center">
                  <h4 className="text-lg font-medium text-neutral-900">{application.trainer?.name || "Anonymous Trainer"}</h4>
                  <Badge variant={getStatusColor(application.status)} className="ml-2 capitalize">
                    {application.status}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-500">
                  Applied for:{" "}
                  <span className="font-medium">{application.requirement?.title || "Unknown Requirement"}</span>
                </p>
              </div>
            </div>
            
            {application.cover_letter && (
              <div className="mt-4 md:mt-2">
                <p className="text-sm text-neutral-600">{application.cover_letter}</p>
                
                {application.trainer?.skills && application.trainer.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {application.trainer.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-primary-50 text-primary-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-start md:items-end justify-between">
            <span className="text-sm text-neutral-500">
              Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
            </span>
            
            {isCollege && (
              <div className="mt-4 flex gap-2">
                {application.status === "applied" && (
                  <Button 
                    size="sm" 
                    onClick={() => shortlistMutation.mutate()}
                    disabled={shortlistMutation.isPending}
                  >
                    {shortlistMutation.isPending ? "Processing..." : "Shortlist"}
                  </Button>
                )}
                
                {application.status === "shortlisted" && (
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isPending}
                  >
                    {acceptMutation.isPending ? "Processing..." : "Accept"}
                  </Button>
                )}
                
                <Button size="sm" variant="outline">
                  View Profile
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
