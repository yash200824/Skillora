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
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Loader2, 
  Search, 
  CheckCircle, 
  XCircle, 
  Building,
  FileText,
  FileCheck,
  Calendar,
  UserX,
  UserCheck
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminColleges() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const { toast } = useToast();
  
  const { data: colleges, isLoading } = useQuery({
    queryKey: ["/api/admin/colleges"],
  });
  
  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, blocked }: { userId: number, blocked: boolean }) => {
      await apiRequest("PATCH", `/api/admin/block-user/${userId}`, { blocked });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.blocked ? "College blocked" : "College unblocked",
        description: `The college has been ${variables.blocked ? "blocked" : "unblocked"} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/colleges"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filtered colleges based on search query
  const filteredColleges = colleges
    ? colleges.filter((college) => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return (
          college.name?.toLowerCase().includes(query) ||
          college.email?.toLowerCase().includes(query) ||
          college.username?.toLowerCase().includes(query) ||
          college.organization?.toLowerCase().includes(query)
        );
      })
    : [];
  
  // Helper function to get organization initials
  const getInitials = (name: string) => {
    if (!name) return "C";
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
            <h2 className="text-2xl font-bold text-neutral-800">Manage Colleges</h2>
            <p className="mt-1 text-sm text-neutral-600">Monitor and manage college/university accounts</p>
          </div>
          
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search colleges by name or organization..."
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
          ) : colleges && colleges.length > 0 ? (
            <div className="bg-white overflow-hidden shadow rounded-lg border border-neutral-200">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Organization Type</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredColleges.length > 0 ? (
                      filteredColleges.map((college) => (
                        <TableRow key={college.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarFallback className="bg-primary-100 text-primary-800 text-xs">
                                  {getInitials(college.name)}
                                </AvatarFallback>
                              </Avatar>
                              {college.name}
                            </div>
                          </TableCell>
                          <TableCell>{college.organization || "N/A"}</TableCell>
                          <TableCell>{college.email}</TableCell>
                          <TableCell>
                            {college.verified ? (
                              <Badge variant="success" className="flex items-center">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="flex items-center">
                                <XCircle className="mr-1 h-3 w-3" />
                                Blocked
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedCollege(college)}
                              >
                                View Details
                              </Button>
                              
                              {college.verified ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => blockUserMutation.mutate({ userId: college.id, blocked: true })}
                                  disabled={blockUserMutation.isPending}
                                >
                                  Block
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => blockUserMutation.mutate({ userId: college.id, blocked: false })}
                                  disabled={blockUserMutation.isPending}
                                >
                                  Unblock
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-neutral-500">
                          No colleges found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-neutral-600">No colleges found.</p>
            </div>
          )}
        </main>
      </div>
      
      {/* College Details Dialog */}
      {selectedCollege && (
        <Dialog open={!!selectedCollege} onOpenChange={(open) => !open && setSelectedCollege(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>College Profile</DialogTitle>
              <DialogDescription>
                Detailed information about the institution
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex items-center">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(selectedCollege.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">{selectedCollege.name}</h3>
                  <p className="text-sm text-neutral-500">
                    {selectedCollege.organization || "Educational Institution"}
                  </p>
                  <div className="mt-1">
                    {selectedCollege.verified ? (
                      <Badge variant="success" className="flex items-center">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center">
                        <XCircle className="mr-1 h-3 w-3" />
                        Blocked
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-neutral-700 mb-1">Email</h4>
                  <p className="text-sm text-neutral-600">{selectedCollege.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-neutral-700 mb-1">Username</h4>
                  <p className="text-sm text-neutral-600">{selectedCollege.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-neutral-700 mb-1">Joined</h4>
                  <p className="text-sm text-neutral-600">
                    {format(new Date(selectedCollege.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                {selectedCollege.bio && (
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-neutral-700 mb-1">Bio</h4>
                    <p className="text-sm text-neutral-600">{selectedCollege.bio}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-md space-y-2">
                <h4 className="text-sm font-medium text-neutral-700">Platform Activity</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center p-2 bg-white rounded-md border border-neutral-200">
                    <FileText className="h-5 w-5 text-primary mb-1" />
                    <p className="text-xs font-medium text-neutral-700">Requirements</p>
                    <p className="text-lg font-semibold text-neutral-900">0</p>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-white rounded-md border border-neutral-200">
                    <Building className="h-5 w-5 text-orange-500 mb-1" />
                    <p className="text-xs font-medium text-neutral-700">Applications</p>
                    <p className="text-lg font-semibold text-neutral-900">0</p>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-white rounded-md border border-neutral-200">
                    <FileCheck className="h-5 w-5 text-green-500 mb-1" />
                    <p className="text-xs font-medium text-neutral-700">Contracts</p>
                    <p className="text-lg font-semibold text-neutral-900">0</p>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              {selectedCollege.verified ? (
                <Button
                  variant="destructive"
                  onClick={() => {
                    blockUserMutation.mutate({ userId: selectedCollege.id, blocked: true });
                    setSelectedCollege(null);
                  }}
                  disabled={blockUserMutation.isPending}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Block College
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    blockUserMutation.mutate({ userId: selectedCollege.id, blocked: false });
                    setSelectedCollege(null);
                  }}
                  disabled={blockUserMutation.isPending}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Unblock College
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      <MobileNav />
    </div>
  );
}
