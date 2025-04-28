import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Search, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  UserX, 
  Star,
  Mail,
  Calendar 
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminTrainers() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
  const { toast } = useToast();
  
  const { data: trainers, isLoading } = useQuery({
    queryKey: ["/api/admin/trainers"],
  });
  
  const approveTrainerMutation = useMutation({
    mutationFn: async (trainerId: number) => {
      await apiRequest("PATCH", `/api/admin/approve-trainer/${trainerId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Trainer approved",
        description: "The trainer has been approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trainers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, blocked }: { userId: number, blocked: boolean }) => {
      await apiRequest("PATCH", `/api/admin/block-user/${userId}`, { blocked });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.blocked ? "User blocked" : "User unblocked",
        description: `The user has been ${variables.blocked ? "blocked" : "unblocked"} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trainers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filtered trainers based on search query
  const filteredTrainers = trainers
    ? trainers.filter((trainer) => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return (
          trainer.name?.toLowerCase().includes(query) ||
          trainer.email?.toLowerCase().includes(query) ||
          trainer.username?.toLowerCase().includes(query) ||
          (trainer.skills && trainer.skills.some((skill: string) => 
            skill.toLowerCase().includes(query)
          ))
        );
      })
    : [];
  
  // Group trainers by verification status
  const verifiedTrainers = filteredTrainers.filter(t => t.verified);
  const pendingTrainers = filteredTrainers.filter(t => !t.verified);
  
  // Helper function to get user initials
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-800">Manage Trainers</h2>
            <p className="mt-1 text-sm text-neutral-600">Approve, block, and monitor trainer accounts</p>
          </div>
          
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search trainers by name, email, or skills..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : trainers && trainers.length > 0 ? (
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  All Trainers ({filteredTrainers.length})
                </TabsTrigger>
                <TabsTrigger value="verified">
                  Verified ({verifiedTrainers.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending Verification ({pendingTrainers.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <TrainerTable 
                  trainers={filteredTrainers} 
                  onView={setSelectedTrainer}
                  onApprove={(id) => approveTrainerMutation.mutate(id)}
                  onBlock={(id, blocked) => blockUserMutation.mutate({ userId: id, blocked })}
                  isPending={approveTrainerMutation.isPending || blockUserMutation.isPending}
                />
              </TabsContent>
              
              <TabsContent value="verified">
                <TrainerTable 
                  trainers={verifiedTrainers} 
                  onView={setSelectedTrainer}
                  onApprove={(id) => approveTrainerMutation.mutate(id)}
                  onBlock={(id, blocked) => blockUserMutation.mutate({ userId: id, blocked })}
                  isPending={approveTrainerMutation.isPending || blockUserMutation.isPending}
                />
              </TabsContent>
              
              <TabsContent value="pending">
                <TrainerTable 
                  trainers={pendingTrainers} 
                  onView={setSelectedTrainer}
                  onApprove={(id) => approveTrainerMutation.mutate(id)}
                  onBlock={(id, blocked) => blockUserMutation.mutate({ userId: id, blocked })}
                  isPending={approveTrainerMutation.isPending || blockUserMutation.isPending}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-neutral-600">No trainers found.</p>
            </div>
          )}
        </main>
      </div>
      
      {/* Trainer Details Dialog */}
      {selectedTrainer && (
        <Dialog open={!!selectedTrainer} onOpenChange={(open) => !open && setSelectedTrainer(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Trainer Profile</DialogTitle>
              <DialogDescription>
                Detailed information about the trainer
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex items-center">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(selectedTrainer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">{selectedTrainer.name}</h3>
                  <p className="text-sm text-neutral-500">{selectedTrainer.email}</p>
                  <div className="mt-1">
                    {selectedTrainer.verified ? (
                      <Badge variant="success" className="flex items-center">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center">
                        <XCircle className="mr-1 h-3 w-3" />
                        Pending Verification
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-1">Bio</h4>
                <p className="text-sm text-neutral-600">
                  {selectedTrainer.bio || "No bio provided."}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-neutral-700 mb-1">Username</h4>
                  <p className="text-sm text-neutral-600">{selectedTrainer.username}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-neutral-700 mb-1">Joined</h4>
                  <p className="text-sm text-neutral-600">
                    {format(new Date(selectedTrainer.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-1">Skills</h4>
                {selectedTrainer.skills && selectedTrainer.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTrainer.skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-primary-50 text-primary-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600">No skills listed.</p>
                )}
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {!selectedTrainer.verified && (
                <Button
                  onClick={() => {
                    approveTrainerMutation.mutate(selectedTrainer.id);
                    setSelectedTrainer(null);
                  }}
                  disabled={approveTrainerMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Approve Trainer
                </Button>
              )}
              
              <Button
                variant={selectedTrainer.verified ? "destructive" : "outline"}
                onClick={() => {
                  blockUserMutation.mutate({ 
                    userId: selectedTrainer.id, 
                    blocked: selectedTrainer.verified 
                  });
                  setSelectedTrainer(null);
                }}
                disabled={blockUserMutation.isPending}
                className="w-full sm:w-auto"
              >
                {selectedTrainer.verified ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Block User
                  </>
                ) : (
                  "Cancel"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      <MobileNav />
    </div>
  );
}

interface TrainerTableProps {
  trainers: any[];
  onView: (trainer: any) => void;
  onApprove: (id: number) => void;
  onBlock: (id: number, block: boolean) => void;
  isPending: boolean;
}

function TrainerTable({ trainers, onView, onApprove, onBlock, isPending }: TrainerTableProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-neutral-200">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainers.length > 0 ? (
              trainers.map((trainer) => (
                <TableRow key={trainer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className="bg-primary-100 text-primary-800 text-xs">
                          {trainer.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {trainer.name}
                    </div>
                  </TableCell>
                  <TableCell>{trainer.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {trainer.skills && trainer.skills.length > 0 ? (
                        trainer.skills.slice(0, 3).map((skill: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-neutral-500 text-sm">No skills</span>
                      )}
                      {trainer.skills && trainer.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{trainer.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {trainer.verified ? (
                      <Badge variant="success" className="flex items-center">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center">
                        <XCircle className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onView(trainer)}
                      >
                        View Details
                      </Button>
                      
                      {!trainer.verified && (
                        <Button
                          size="sm"
                          onClick={() => onApprove(trainer.id)}
                          disabled={isPending}
                        >
                          Approve
                        </Button>
                      )}
                      
                      {trainer.verified && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onBlock(trainer.id, true)}
                          disabled={isPending}
                        >
                          Block
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-neutral-500">
                  No trainers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
