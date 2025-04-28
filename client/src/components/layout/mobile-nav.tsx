import { LayoutDashboard, Search, FileText, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav className="md:hidden bg-white shadow-lg border-t border-neutral-200 fixed bottom-0 left-0 right-0 z-30">
      <div className="flex justify-around">
        {user.role === 'trainer' && (
          <>
            <Link href="/">
              <a className={`flex flex-col items-center py-2 px-4 ${location === '/' ? 'text-primary' : 'text-neutral-500'}`}>
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-xs mt-1">Dashboard</span>
              </a>
            </Link>
            <Link href="/opportunities">
              <a className={`flex flex-col items-center py-2 px-4 ${location === '/opportunities' ? 'text-primary' : 'text-neutral-500'}`}>
                <Search className="h-5 w-5" />
                <span className="text-xs mt-1">Explore</span>
              </a>
            </Link>
            <Link href="/applications">
              <a className={`flex flex-col items-center py-2 px-4 ${location === '/applications' ? 'text-primary' : 'text-neutral-500'}`}>
                <FileText className="h-5 w-5" />
                <span className="text-xs mt-1">Applications</span>
              </a>
            </Link>
            <Link href="/profile">
              <a className={`flex flex-col items-center py-2 px-4 ${location === '/profile' ? 'text-primary' : 'text-neutral-500'}`}>
                <User className="h-5 w-5" />
                <span className="text-xs mt-1">Profile</span>
              </a>
            </Link>
          </>
        )}

        {user.role === 'college' && (
          <>
            <Link href="/">
              <a className={`flex flex-col items-center py-2 px-4 ${location === '/' ? 'text-primary' : 'text-neutral-500'}`}>
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-xs mt-1">Dashboard</span>
              </a>
            </Link>
            <Link href="/requirements">
              <a className={`flex flex-col items-center py-2 px-4 ${location === '/requirements' ? 'text-primary' : 'text-neutral-500'}`}>
                <FileText className="h-5 w-5" />
                <span className="text-xs mt-1">Requirements</span>
              </a>
            </Link>
            <Link href="/college/applications">
              <a className={`flex flex-col items-center py-2 px-4 ${location === '/college/applications' ? 'text-primary' : 'text-neutral-500'}`}>
                <Search className="h-5 w-5" />
                <span className="text-xs mt-1">Applications</span>
              </a>
            </Link>
            <Link href="/profile">
              <a className={`flex flex-col items-center py-2 px-4 ${location === '/profile' ? 'text-primary' : 'text-neutral-500'}`}>
                <User className="h-5 w-5" />
                <span className="text-xs mt-1">Profile</span>
              </a>
            </Link>
          </>
        )}

        {user.role === 'admin' && (
          <>
            <Link href="/admin">
              <a className={`flex flex-col items-center py-2 px-4 ${location === '/admin' ? 'text-primary' : 'text-neutral-500'}`}>
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-xs mt-1">Dashboard</span>
              </a>
            </Link>
            <Link href="/admin/trainers">
              <a className={`flex flex-col items-center py-2 px-4 ${location === '/admin/trainers' ? 'text-primary' : 'text-neutral-500'}`}>
                <User className="h-5 w-5" />
                <span className="text-xs mt-1">Trainers</span>
              </a>
            </Link>
            <Link href="/admin/colleges">
              <a className={`flex flex-col items-center py-2 px-4 ${location === '/admin/colleges' ? 'text-primary' : 'text-neutral-500'}`}>
                <Search className="h-5 w-5" />
                <span className="text-xs mt-1">Colleges</span>
              </a>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
