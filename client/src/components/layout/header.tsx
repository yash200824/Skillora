import { Bell, LogOut, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNotifications } from "@/context/notification-context";
import NotificationPanel from "@/components/notification-panel";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications } = useNotifications();
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate("/auth");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="md:hidden mr-2 p-2 rounded-md text-neutral-400 hover:text-neutral-500 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <a className="text-xl font-bold text-primary">EduConnect</a>
            </Link>
          </div>
          
          <nav className="hidden md:ml-6 md:flex space-x-8">
            {user?.role === 'trainer' && (
              <>
                <Link href="/">
                  <a className={`px-1 pt-1 border-b-2 text-sm font-medium ${location === '/' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>
                    Dashboard
                  </a>
                </Link>
                <Link href="/opportunities">
                  <a className={`px-1 pt-1 border-b-2 text-sm font-medium ${location === '/opportunities' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>
                    Opportunities
                  </a>
                </Link>
                <Link href="/applications">
                  <a className={`px-1 pt-1 border-b-2 text-sm font-medium ${location === '/applications' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>
                    Applications
                  </a>
                </Link>
                <Link href="/contracts">
                  <a className={`px-1 pt-1 border-b-2 text-sm font-medium ${location === '/contracts' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>
                    Contracts
                  </a>
                </Link>
              </>
            )}
            
            {user?.role === 'college' && (
              <>
                <Link href="/">
                  <a className={`px-1 pt-1 border-b-2 text-sm font-medium ${location === '/' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>
                    Dashboard
                  </a>
                </Link>
                <Link href="/requirements">
                  <a className={`px-1 pt-1 border-b-2 text-sm font-medium ${location === '/requirements' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>
                    Requirements
                  </a>
                </Link>
                <Link href="/college/applications">
                  <a className={`px-1 pt-1 border-b-2 text-sm font-medium ${location === '/college/applications' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>
                    Applications
                  </a>
                </Link>
                <Link href="/college/contracts">
                  <a className={`px-1 pt-1 border-b-2 text-sm font-medium ${location === '/college/contracts' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>
                    Contracts
                  </a>
                </Link>
              </>
            )}
            
            {user?.role === 'admin' && (
              <>
                <Link href="/admin">
                  <a className={`px-1 pt-1 border-b-2 text-sm font-medium ${location === '/admin' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>
                    Dashboard
                  </a>
                </Link>
                <Link href="/admin/trainers">
                  <a className={`px-1 pt-1 border-b-2 text-sm font-medium ${location === '/admin/trainers' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>
                    Trainers
                  </a>
                </Link>
                <Link href="/admin/colleges">
                  <a className={`px-1 pt-1 border-b-2 text-sm font-medium ${location === '/admin/colleges' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>
                    Colleges
                  </a>
                </Link>
              </>
            )}
          </nav>
        </div>
        
        <div className="flex items-center">
          <div className="flex-shrink-0 relative">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowNotifications(true)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-xs text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </div>
          
          <div className="ml-3 relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <a className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </header>
  );
}
