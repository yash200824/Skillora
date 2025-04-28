import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Loader2, FileCheck, AlertCircle, CheckCircle, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ContractView from "@/components/contract-view";

export default function CollegeContracts() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  
  const { data: contracts, isLoading } = useQuery({
    queryKey: ["/api/contracts"],
  });
  
  const { data: contractDetails, isLoading: isContractLoading } = useQuery({
    queryKey: [`/api/contracts/${selectedContract}`],
    enabled: selectedContract !== null,
  });
  
  // Group contracts by status for better organization
  const pendingSignature = contracts?.filter(
    c => !c.signed_by_trainer || !c.signed_by_college
  ) || [];
  
  const activeContracts = contracts?.filter(
    c => c.signed_by_trainer && c.signed_by_college && c.payment_status !== "paid"
  ) || [];
  
  const completedContracts = contracts?.filter(
    c => c.payment_status === "paid"
  ) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-800">Contracts</h2>
            <p className="mt-1 text-sm text-neutral-600">Manage training contracts and payments</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : contracts && contracts.length > 0 ? (
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  All Contracts ({contracts.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending Signature ({pendingSignature.length})
                </TabsTrigger>
                <TabsTrigger value="active">
                  Active ({activeContracts.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedContracts.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <div className="space-y-4">
                  {contracts.map(contract => (
                    <ContractCard 
                      key={contract.id} 
                      contract={contract} 
                      onView={() => setSelectedContract(contract.id)}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="pending">
                <div className="space-y-4">
                  {pendingSignature.length > 0 ? (
                    pendingSignature.map(contract => (
                      <ContractCard 
                        key={contract.id} 
                        contract={contract} 
                        onView={() => setSelectedContract(contract.id)}
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                      <p className="text-neutral-600">No contracts pending signature.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="active">
                <div className="space-y-4">
                  {activeContracts.length > 0 ? (
                    activeContracts.map(contract => (
                      <ContractCard 
                        key={contract.id} 
                        contract={contract} 
                        onView={() => setSelectedContract(contract.id)}
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                      <p className="text-neutral-600">No active contracts.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="completed">
                <div className="space-y-4">
                  {completedContracts.length > 0 ? (
                    completedContracts.map(contract => (
                      <ContractCard 
                        key={contract.id} 
                        contract={contract} 
                        onView={() => setSelectedContract(contract.id)}
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                      <p className="text-neutral-600">No completed contracts.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FileCheck className="h-12 w-12 mx-auto text-neutral-300" />
              <h3 className="mt-4 text-lg font-medium text-neutral-800">No contracts yet</h3>
              <p className="mt-2 text-neutral-600">
                You haven't created any contracts yet. When you accept a trainer's application, a contract will be generated.
              </p>
              <Button
                className="mt-4"
                onClick={() => window.location.href = "/college/applications"}
              >
                View Applications
              </Button>
            </div>
          )}
        </main>
      </div>
      
      <Dialog open={selectedContract !== null} onOpenChange={(open) => !open && setSelectedContract(null)}>
        <DialogContent className="sm:max-w-4xl">
          {isContractLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : contractDetails ? (
            <ContractView contract={contractDetails} />
          ) : (
            <div className="text-center py-8">
              <p>Failed to load contract details.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <MobileNav />
    </div>
  );
}

interface ContractCardProps {
  contract: any;
  onView: () => void;
}

function ContractCard({ contract, onView }: ContractCardProps) {
  const getStatusIcon = () => {
    if (!contract.signed_by_trainer || !contract.signed_by_college) {
      return <AlertCircle className="h-5 w-5 text-amber-500" />;
    }
    if (contract.payment_status !== "paid") {
      return <DollarSign className="h-5 w-5 text-blue-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusText = () => {
    if (!contract.signed_by_trainer || !contract.signed_by_college) {
      return "Awaiting Signatures";
    }
    if (contract.payment_status !== "paid") {
      return "Awaiting Payment";
    }
    return "Completed";
  };

  const getStatusBadge = () => {
    if (!contract.signed_by_trainer || !contract.signed_by_college) {
      return <Badge variant="warning">Awaiting Signatures</Badge>;
    }
    if (contract.payment_status !== "paid") {
      return <Badge variant="secondary">Payment Pending</Badge>;
    }
    return <Badge variant="success">Completed</Badge>;
  };

  return (
    <Card className="shadow-sm border border-neutral-200">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <h3 className="text-lg font-semibold text-neutral-800">
                {contract.requirement?.title || "Contract"}
              </h3>
            </div>
            
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-neutral-600">
                <span className="font-medium">Trainer:</span> {contract.trainer?.name}
              </p>
              <p className="text-sm text-neutral-600">
                <span className="font-medium">Status:</span> {getStatusText()}
              </p>
              <p className="text-sm text-neutral-600">
                <span className="font-medium">Created:</span> {format(new Date(contract.created_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="text-xl font-bold">${contract.fee.toFixed(2)}</div>
            {getStatusBadge()}
            <Button onClick={onView}>View Contract</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
