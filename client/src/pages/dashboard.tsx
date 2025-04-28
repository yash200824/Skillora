import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import StatCard from "@/components/stat-card";
import OpportunityCard from "@/components/opportunity-card";
import ApplicationItem from "@/components/application-item";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, Search, FileText, School, Star, Users, CheckCircle, ArrowRight, User, Book, Building } from "lucide-react";
import { Loader2 } from "lucide-react";
import TrainerApplicationTable from "@/components/trainer/application-table";

export default function DashboardPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Fetch requirements (for trainers) or active requirements (for colleges)
  const { data: requirements, isLoading: isRequirementsLoading } = useQuery({
    queryKey: ['/api/requirements'],
    enabled: !!user
  });
  
  // Fetch applications (for trainers or colleges)
  const { data: applications, isLoading: isApplicationsLoading } = useQuery({
    queryKey: ['/api/my-applications'],
    enabled: !!user && user.role === 'trainer'
  });
  
  // Admin statistics
  const { data: statistics, isLoading: isStatisticsLoading } = useQuery({
    queryKey: ['/api/admin/statistics'],
    enabled: !!user && user.role === 'admin'
  });

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 p-4 md:p-8 md:ml-64 pb-20 md:pb-8">
          {/* Trainer Dashboard */}
          {user.role === 'trainer' && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-neutral-800">Trainer Dashboard</h2>
                <p className="mt-1 text-sm text-neutral-600">Find opportunities and manage your applications</p>
              </div>
              
              {/* Stats Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard 
                  title="Open Opportunities" 
                  value={isRequirementsLoading ? '...' : requirements?.length || 0}
                  icon={<Search className="h-5 w-5 text-primary" />}
                  bgColor="bg-primary-50"
                />
                <StatCard 
                  title="Active Applications" 
                  value={isApplicationsLoading ? '...' : applications?.filter(app => app.status === 'applied' || app.status === 'shortlisted').length || 0}
                  icon={<FileText className="h-5 w-5 text-orange-500" />}
                  bgColor="bg-orange-50"
                />
                <StatCard 
                  title="Trainings In Progress" 
                  value={isApplicationsLoading ? '...' : applications?.filter(app => app.status === 'accepted').length || 0}
                  icon={<School className="h-5 w-5 text-cyan-500" />}
                  bgColor="bg-cyan-50"
                />
                <StatCard 
                  title="Average Rating" 
                  value="0.0"
                  icon={<Star className="h-5 w-5 text-yellow-500" />}
                  bgColor="bg-yellow-50"
                />
              </div>
              
              {/* Recent Opportunities */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-neutral-800">Recent Opportunities</h3>
                  <Link href="/opportunities">
                    <Button variant="ghost" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                      View all <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                {isRequirementsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : requirements?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {requirements.slice(0, 3).map((req) => (
                      <OpportunityCard key={req.id} requirement={req} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-neutral-600">No open opportunities available right now.</p>
                    <Button asChild className="mt-4">
                      <Link href="/profile">Complete your profile to attract more opportunities</Link>
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Your Applications */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-neutral-800">Your Applications</h3>
                  <Link href="/applications">
                    <Button variant="ghost" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                      View all <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                {isApplicationsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : applications?.length > 0 ? (
                  <TrainerApplicationTable applications={applications.slice(0, 3)} />
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-neutral-600">You haven't applied to any opportunities yet.</p>
                    <Button asChild className="mt-4">
                      <Link href="/opportunities">Browse opportunities</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* College Dashboard */}
          {user.role === 'college' && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-neutral-800">College Dashboard</h2>
                <p className="mt-1 text-sm text-neutral-600">Manage your training requirements and applications</p>
              </div>
              
              {/* Stats Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard 
                  title="Active Requirements" 
                  value={isRequirementsLoading ? '...' : requirements?.filter(req => req.status === 'open').length || 0}
                  icon={<User className="h-5 w-5 text-primary" />}
                  bgColor="bg-primary-50"
                />
                <StatCard 
                  title="Applications Received" 
                  value="0"
                  icon={<Users className="h-5 w-5 text-orange-500" />}
                  bgColor="bg-orange-50"
                />
                <StatCard 
                  title="Courses In Progress" 
                  value={isRequirementsLoading ? '...' : requirements?.filter(req => req.status === 'in_progress').length || 0}
                  icon={<School className="h-5 w-5 text-cyan-500" />}
                  bgColor="bg-cyan-50"
                />
                <StatCard 
                  title="Completed Courses" 
                  value={isRequirementsLoading ? '...' : requirements?.filter(req => req.status === 'completed').length || 0}
                  icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                  bgColor="bg-green-50"
                />
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                  <Button asChild>
                    <Link href="/create-requirement">Post New Requirement</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/requirements">View My Requirements</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/college/applications">Check Applications</Link>
                  </Button>
                </div>
              </div>
              
              {/* Recent Requirements */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-neutral-800">Your Recent Requirements</h3>
                  <Link href="/requirements">
                    <Button variant="ghost" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                      View all <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                {isRequirementsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : requirements?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {requirements.slice(0, 3).map((req) => (
                      <div key={req.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                        <div className="p-5">
                          <div className="flex justify-between items-start">
                            <h4 className="text-base font-semibold text-neutral-800">{req.title}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              req.status === 'open' ? 'bg-green-100 text-green-800' : 
                              req.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {req.status === 'open' ? 'Open' : 
                               req.status === 'in_progress' ? 'In Progress' : 
                               'Completed'}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{req.description}</p>
                          
                          <div className="mt-4 flex items-center text-sm text-neutral-500">
                            <span>Duration: {req.duration_weeks} weeks</span>
                            <span className="mx-2">•</span>
                            <span>Mode: {req.mode}</span>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-neutral-200">
                            <div className="flex flex-wrap gap-2">
                              {req.skills_required?.map((skill, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-800">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="px-5 py-3 bg-neutral-50 flex justify-between items-center">
                          <span className="text-sm font-medium text-neutral-700">
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                          <Link href={`/college/applications?requirementId=${req.id}`}>
                            <Button size="sm" variant="outline">View Applications</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-neutral-600">You haven't posted any requirements yet.</p>
                    <Button asChild className="mt-4">
                      <Link href="/create-requirement">Post your first requirement</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Admin Dashboard */}
          {user.role === 'admin' && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-neutral-800">Admin Dashboard</h2>
                <p className="mt-1 text-sm text-neutral-600">Platform overview and management</p>
              </div>
              
              {isStatisticsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : statistics ? (
                <>
                  {/* Platform Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard 
                      title="Total Colleges" 
                      value={statistics.users.colleges}
                      icon={<User className="h-5 w-5 text-primary" />}
                      bgColor="bg-primary-50"
                    />
                    <StatCard 
                      title="Total Trainers" 
                      value={statistics.users.trainers}
                      icon={<Users className="h-5 w-5 text-orange-500" />}
                      bgColor="bg-orange-50"
                    />
                    <StatCard 
                      title="Active Requirements" 
                      value={statistics.requirements.open + statistics.requirements.inProgress}
                      icon={<FileText className="h-5 w-5 text-cyan-500" />}
                      bgColor="bg-cyan-50"
                    />
                    <StatCard 
                      title="Total Contracts" 
                      value={statistics.contracts.total}
                      icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                      bgColor="bg-green-50"
                    />
                  </div>
                  
                  {/* Quick Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-2 rounded-md bg-primary-50 mr-3">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-800">Trainer Management</h3>
                      </div>
                      <p className="text-neutral-600 mb-4">Review and approve trainer profiles, monitor trainer activity.</p>
                      <Link href="/admin/trainers">
                        <Button className="w-full">
                          Manage Trainers <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-2 rounded-md bg-primary-50 mr-3">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-800">College Management</h3>
                      </div>
                      <p className="text-neutral-600 mb-4">Manage college accounts, verify institutions, and monitor activity.</p>
                      <Link href="/admin/colleges">
                        <Button className="w-full">
                          Manage Colleges <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Activity Stats */}
                  <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Platform Activity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <h4 className="text-sm font-medium text-neutral-500 mb-2">Applications</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-neutral-600">Total</span>
                            <span className="font-medium">{statistics.applications.total}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-neutral-600">Accepted</span>
                            <span className="font-medium">{statistics.applications.accepted}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-neutral-600">Pending</span>
                            <span className="font-medium">{statistics.applications.pending}</span>
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
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-neutral-600">Unable to load statistics.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}

// All icon components are now imported from lucide-react
