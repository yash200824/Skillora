import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Loader2, FileCheck, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ContractView from "@/components/contract-view";

export default function TrainerContracts() {
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
            <h2 className="text-2xl font-bold text-neutral-800">My Contracts</h2>
            <p className="mt-1 text-sm text-neutral-600">Manage your training contracts and payments</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : contracts && contracts.length > 0 ? (
            <div className="space-y-8">
              {pendingSignature.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                    Pending Signature
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingSignature.map(contract => (
                      <ContractCard 
                        key={contract.id} 
                        contract={contract} 
                        onView={() => setSelectedContract(contract.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {activeContracts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
                    <FileCheck className="h-5 w-5 mr-2 text-blue-500" />
                    Active Contracts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeContracts.map(contract => (
                      <ContractCard 
                        key={contract.id} 
                        contract={contract}
                        onView={() => setSelectedContract(contract.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {completedContracts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Completed Contracts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedContracts.map(contract => (
                      <ContractCard 
                        key={contract.id} 
                        contract={contract}
                        onView={() => setSelectedContract(contract.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FileCheck className="h-12 w-12 mx-auto text-neutral-300" />
              <h3 className="mt-4 text-lg font-medium text-neutral-800">No contracts yet</h3>
              <p className="mt-2 text-neutral-600">
                You don't have any active contracts. When your application is accepted, a contract will be generated.
              </p>
              <Button
                className="mt-4"
                onClick={() => window.location.href = "/applications"}
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
      <CardContent className="p-0">
        <div className="p-5">
          <h4 className="text-base font-semibold text-neutral-800">
            {contract.requirement?.title || "Contract"}
          </h4>
          <p className="text-sm text-neutral-600 mt-1">
            With {contract.college?.name || "Institution"}
          </p>
          
          <div className="mt-3 flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center mb-2 sm:mb-0">
              {getStatusBadge()}
              <span className="ml-2 text-xs text-neutral-500">
                Created {format(new Date(contract.created_at), "MMM d, yyyy")}
              </span>
            </div>
            <div className="text-sm font-medium">${contract.fee.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex justify-between items-center">
          <span className="text-sm text-neutral-600">Contract #{contract.id}</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={onView}>
                View Details <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
