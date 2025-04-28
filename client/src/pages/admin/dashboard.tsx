import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Loader2, Users, FileText, Building, CheckCircle, BarChart4 } from "lucide-react";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { data: statistics, isLoading } = useQuery({
    queryKey: ["/api/admin/statistics"],
  });
  
  // Prepare data for charts if statistics are available
  const userChartData = statistics ? [
    { name: "Trainers", value: statistics.users.trainers },
    { name: "Colleges", value: statistics.users.colleges }
  ] : [];
  
  const requirementChartData = statistics ? [
    { name: "Open", value: statistics.requirements.open },
    { name: "In Progress", value: statistics.requirements.inProgress },
    { name: "Completed", value: statistics.requirements.completed }
  ] : [];
  
  const applicationChartData = statistics ? [
    { name: "Accepted", value: statistics.applications.accepted },
    { name: "Pending", value: statistics.applications.pending }
  ] : [];
  
  const contractChartData = statistics ? [
    { name: "Signed", value: statistics.contracts.signed },
    { name: "Paid", value: statistics.contracts.paid },
    { name: "Pending", value: statistics.contracts.total - statistics.contracts.signed }
  ] : [];
  
  // Colors for pie charts
  const COLORS = ["#3F51B5", "#FF5722", "#00BCD4", "#4CAF50"];

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-800">Admin Dashboard</h2>
            <p className="mt-1 text-sm text-neutral-600">Platform overview and management</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : statistics ? (
            <>
              {/* Stats Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="shadow-sm border border-neutral-200">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-neutral-500">Total Users</p>
                        <h3 className="mt-1 text-xl font-semibold text-neutral-900">
                          {statistics.users.trainers + statistics.users.colleges}
                        </h3>
                      </div>
                      <div className="p-2 bg-primary-50 rounded-full">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm border border-neutral-200">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-neutral-500">Requirements</p>
                        <h3 className="mt-1 text-xl font-semibold text-neutral-900">
                          {statistics.requirements.total}
                        </h3>
                      </div>
                      <div className="p-2 bg-orange-50 rounded-full">
                        <FileText className="h-5 w-5 text-orange-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm border border-neutral-200">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-neutral-500">Applications</p>
                        <h3 className="mt-1 text-xl font-semibold text-neutral-900">
                          {statistics.applications.total}
                        </h3>
                      </div>
                      <div className="p-2 bg-cyan-50 rounded-full">
                        <Building className="h-5 w-5 text-cyan-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm border border-neutral-200">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-neutral-500">Completed Contracts</p>
                        <h3 className="mt-1 text-xl font-semibold text-neutral-900">
                          {statistics.contracts.paid}
                        </h3>
                      </div>
                      <div className="p-2 bg-green-50 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Users Distribution */}
                <Card className="shadow-sm border border-neutral-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      <span>User Distribution</span>
                    </CardTitle>
                    <CardDescription>Breakdown of user types on the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={userChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {userChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Requirements Status */}
                <Card className="shadow-sm border border-neutral-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      <span>Requirements Status</span>
                    </CardTitle>
                    <CardDescription>Current status of all training requirements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={requirementChartData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#3F51B5" name="Requirements" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Applications Breakdown */}
                <Card className="shadow-sm border border-neutral-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="mr-2 h-5 w-5" />
                      <span>Applications Breakdown</span>
                    </CardTitle>
                    <CardDescription>Status of applications submitted</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={applicationChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {applicationChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Contracts Overview */}
                <Card className="shadow-sm border border-neutral-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5" />
                      <span>Contracts Overview</span>
                    </CardTitle>
                    <CardDescription>Status of all contracts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={contractChartData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#00BCD4" name="Contracts" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Activity Summary */}
              <Card className="shadow-sm border border-neutral-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart4 className="mr-2 h-5 w-5" />
                    <span>Platform Activity Summary</span>
                  </CardTitle>
                  <CardDescription>Overall statistics and performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 mb-2">Users</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">Trainers</span>
                          <span className="font-medium">{statistics.users.trainers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">Colleges</span>
                          <span className="font-medium">{statistics.users.colleges}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">Total</span>
                          <span className="font-medium">{statistics.users.trainers + statistics.users.colleges}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 mb-2">Requirements</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">Open</span>
                          <span className="font-medium">{statistics.requirements.open}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">In Progress</span>
                          <span className="font-medium">{statistics.requirements.inProgress}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">Completed</span>
                          <span className="font-medium">{statistics.requirements.completed}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 mb-2">Contracts</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">Total</span>
                          <span className="font-medium">{statistics.contracts.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">Fully Signed</span>
                          <span className="font-medium">{statistics.contracts.signed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">Payments Completed</span>
                          <span className="font-medium">{statistics.contracts.paid}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-neutral-600">Unable to load statistics.</p>
            </div>
          )}
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
