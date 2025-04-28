import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileCheck, Star, DollarSign, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ReviewForm from "@/components/review-form";

interface ContractViewProps {
  contract: {
    id: number;
    trainer_id: number;
    college_id: number;
    requirement_id: number;
    application_id: number;
    terms: string;
    fee: number;
    signed_by_trainer: boolean;
    signed_by_college: boolean;
    payment_status: string;
    trainer_signed_at: string | null;
    college_signed_at: string | null;
    created_at: string;
    requirement?: {
      id: number;
      title: string;
      description: string;
      status: string;
      mode: string;
      duration_weeks: number;
    };
    trainer?: {
      id: number;
      name: string;
      email: string;
    };
    college?: {
      id: number;
      name: string;
      organization?: string;
      email: string;
    };
  };
}

export default function ContractView({ contract }: ContractViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const signContractMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/contract/sign", { contractId: contract.id });
    },
    onSuccess: () => {
      toast({
        title: "Contract signed successfully",
        description: "The other party has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contract.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to sign contract",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/contract/payment", { contractId: contract.id });
    },
    onSuccess: () => {
      toast({
        title: "Payment marked as completed",
        description: "The trainer has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contract.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark as paid",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const canSign = user && (
    (user.role === "trainer" && user.id === contract.trainer_id && !contract.signed_by_trainer) ||
    (user.role === "college" && user.id === contract.college_id && !contract.signed_by_college)
  );
  
  const canMarkAsPaid = user && 
    user.role === "college" && 
    user.id === contract.college_id && 
    contract.signed_by_trainer && 
    contract.signed_by_college && 
    contract.payment_status !== "paid";
  
  const canReview = user && 
    contract.payment_status === "paid" && 
    ((user.role === "trainer" && user.id === contract.trainer_id) || 
    (user.role === "college" && user.id === contract.college_id));

  const isFullySigned = contract.signed_by_trainer && contract.signed_by_college;
  
  return (
    <Card className="shadow-sm border border-neutral-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{contract.requirement?.title || "Contract"}</CardTitle>
            <CardDescription>Contract ID: #{contract.id}</CardDescription>
          </div>
          <div className="flex items-center">
            <FileCheck className="h-5 w-5 mr-2 text-primary" />
            <span className="text-sm font-medium">
              Created on {format(new Date(contract.created_at), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Trainer</h3>
            <p className="font-medium">{contract.trainer?.name}</p>
            <p className="text-sm text-neutral-600">{contract.trainer?.email}</p>
            <div className="mt-2 flex items-center">
              <Badge variant={contract.signed_by_trainer ? "success" : "outline"}>
                {contract.signed_by_trainer ? "Signed" : "Not Signed"}
              </Badge>
              {contract.trainer_signed_at && (
                <span className="ml-2 text-xs text-neutral-500">
                  on {format(new Date(contract.trainer_signed_at), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-neutral-500 mb-2">College/Institution</h3>
            <p className="font-medium">{contract.college?.name}</p>
            <p className="text-sm text-neutral-600">{contract.college?.email}</p>
            <div className="mt-2 flex items-center">
              <Badge variant={contract.signed_by_college ? "success" : "outline"}>
                {contract.signed_by_college ? "Signed" : "Not Signed"}
              </Badge>
              {contract.college_signed_at && (
                <span className="ml-2 text-xs text-neutral-500">
                  on {format(new Date(contract.college_signed_at), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-neutral-500 mb-2">Training Details</h3>
          <div className="bg-neutral-50 p-4 rounded-md">
            <p className="font-medium">{contract.requirement?.title}</p>
            <p className="text-sm text-neutral-600 mt-1">{contract.requirement?.description}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <span className="font-medium mr-1">Mode:</span>
                <span>{contract.requirement?.mode}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-1">Duration:</span>
                <span>{contract.requirement?.duration_weeks} weeks</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-1">Status:</span>
                <Badge variant={contract.requirement?.status === "completed" ? "success" : "secondary"} className="capitalize">
                  {contract.requirement?.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-neutral-500 mb-2">Contract Terms</h3>
          <div className="bg-neutral-50 p-4 rounded-md">
            <p className="text-sm text-neutral-600">{contract.terms}</p>
          </div>
        </div>
        
        <Separator className="mb-6" />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-medium text-neutral-500">Payment Status</h3>
            <div className="mt-2 flex items-center">
              <Badge variant={contract.payment_status === "paid" ? "success" : "outline"}>
                {contract.payment_status === "paid" ? "Paid" : "Pending"}
              </Badge>
            </div>
          </div>
          
          <div className="text-right">
            <h3 className="text-sm font-medium text-neutral-500">Contract Fee</h3>
            <p className="mt-1 text-2xl font-semibold">${contract.fee.toFixed(2)}</p>
          </div>
        </div>
        
        {!isFullySigned && (
          <div className="bg-amber-50 p-4 rounded-md flex items-start mb-6">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Contract needs signatures</p>
              <p className="text-sm text-amber-700 mt-1">
                Both parties must sign the contract before it becomes effective. 
                {canSign ? " You can sign the contract below." : ""}
              </p>
            </div>
          </div>
        )}
        
        {showReviewForm && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Leave a Review</h3>
            <ReviewForm 
              givenTo={user?.role === "trainer" ? contract.college_id : contract.trainer_id}
              requirementId={contract.requirement_id}
              onComplete={() => setShowReviewForm(false)}
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-4 justify-end">
        {canSign && (
          <Button 
            onClick={() => signContractMutation.mutate()}
            disabled={signContractMutation.isPending}
          >
            {signContractMutation.isPending ? "Processing..." : "Sign Contract"}
          </Button>
        )}
        
        {canMarkAsPaid && (
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => markAsPaidMutation.mutate()}
            disabled={markAsPaidMutation.isPending}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            {markAsPaidMutation.isPending ? "Processing..." : "Mark as Paid"}
          </Button>
        )}
        
        {canReview && !showReviewForm && (
          <Button 
            variant="outline"
            onClick={() => setShowReviewForm(true)}
          >
            <Star className="h-4 w-4 mr-1" />
            Leave Review
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
