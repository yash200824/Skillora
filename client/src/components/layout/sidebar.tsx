import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Search, 
  FileText, 
  User, 
  PlusCircle, 
  FileCheck,
  CheckSquare,
  BarChart4, 
  UsersRound
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-20 h-[calc(100vh-4rem)] w-64 bg-white border-r border-neutral-200 transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <nav className="p-4 space-y-2">
        {user.role === 'trainer' && (
          <>
            <Link href="/">
              <a className={`flex items-center p-2 rounded-md ${location === '/' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <Home className="mr-2 h-5 w-5" />
                <span>Dashboard</span>
              </a>
            </Link>
            <Link href="/opportunities">
              <a className={`flex items-center p-2 rounded-md ${location === '/opportunities' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <Search className="mr-2 h-5 w-5" />
                <span>Find Opportunities</span>
              </a>
            </Link>
            <Link href="/applications">
              <a className={`flex items-center p-2 rounded-md ${location === '/applications' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <FileText className="mr-2 h-5 w-5" />
                <span>My Applications</span>
              </a>
            </Link>
            <Link href="/contracts">
              <a className={`flex items-center p-2 rounded-md ${location === '/contracts' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <FileCheck className="mr-2 h-5 w-5" />
                <span>Contracts</span>
              </a>
            </Link>
            <Link href="/profile">
              <a className={`flex items-center p-2 rounded-md ${location === '/profile' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <User className="mr-2 h-5 w-5" />
                <span>Profile</span>
              </a>
            </Link>
          </>
        )}

        {user.role === 'college' && (
          <>
            <Link href="/">
              <a className={`flex items-center p-2 rounded-md ${location === '/' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <Home className="mr-2 h-5 w-5" />
                <span>Dashboard</span>
              </a>
            </Link>
            <Link href="/requirements">
              <a className={`flex items-center p-2 rounded-md ${location === '/requirements' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <FileText className="mr-2 h-5 w-5" />
                <span>My Requirements</span>
              </a>
            </Link>
            <Link href="/create-requirement">
              <a className={`flex items-center p-2 rounded-md ${location === '/create-requirement' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <PlusCircle className="mr-2 h-5 w-5" />
                <span>Post New Requirement</span>
              </a>
            </Link>
            <Link href="/college/applications">
              <a className={`flex items-center p-2 rounded-md ${location === '/college/applications' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <CheckSquare className="mr-2 h-5 w-5" />
                <span>Applications</span>
              </a>
            </Link>
            <Link href="/college/contracts">
              <a className={`flex items-center p-2 rounded-md ${location === '/college/contracts' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <FileCheck className="mr-2 h-5 w-5" />
                <span>Contracts</span>
              </a>
            </Link>
            <Link href="/profile">
              <a className={`flex items-center p-2 rounded-md ${location === '/profile' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <User className="mr-2 h-5 w-5" />
                <span>Profile</span>
              </a>
            </Link>
          </>
        )}

        {user.role === 'admin' && (
          <>
            <Link href="/admin">
              <a className={`flex items-center p-2 rounded-md ${location === '/admin' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <BarChart4 className="mr-2 h-5 w-5" />
                <span>Dashboard</span>
              </a>
            </Link>
            <Link href="/admin/trainers">
              <a className={`flex items-center p-2 rounded-md ${location === '/admin/trainers' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <User className="mr-2 h-5 w-5" />
                <span>Manage Trainers</span>
              </a>
            </Link>
            <Link href="/admin/colleges">
              <a className={`flex items-center p-2 rounded-md ${location === '/admin/colleges' ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <UsersRound className="mr-2 h-5 w-5" />
                <span>Manage Colleges</span>
              </a>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
