import React, { useState, useEffect } from 'react';
import {
  Home,
  Calendar,
  Settings,
  Users,
  LogOut,
  Menu
} from 'lucide-react';
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { User } from "../types/user";
import { useAuth } from "../lib/auth";
import { useRouter } from 'next/router';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
};

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapse }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const activePage = router.pathname.split('/')[1] || 'dashboard';

  const userFullName = user?.fullName || "אורח";
  const userInitials = userFullName !== "אורח" ? getInitials(userFullName) : "א";

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapse?.(collapsed);
  };

  const menuItems = [
    { id: 'dashboard', label: 'דף הבית', icon: Home, path: '/dashboard' },
    { id: 'meetings', label: 'פגישות', icon: Calendar, path: '/meetings' },
    { id: 'participants', label: 'משתתפים', icon: Users, path: '/participants' },
    { id: 'settings', label: 'הגדרות', icon: Settings, path: '/settings' }
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside
      className={`fixed top-0 right-0 h-full bg-gradient-to-b from-white via-blue-50 to-blue-100/30 shadow-lg z-50 transition-[width] duration-500 ease-in-out overflow-hidden backdrop-blur-sm ${isCollapsed ? "w-20" : "w-64"}`}
    >
      <style jsx global>{`
        .nav-icon {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        .logo-gradient {
          background: linear-gradient(
            to right,
            #2563eb,
            #3b82f6
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          line-height: 1;
          padding: 4px 0;
        }
        .profile-transition {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        .profile-transition-open {
          transition-timing-function: cubic-bezier(0.4, 0.2, 0.2, 1);
        }
      `}</style>

      <div className="flex flex-col h-full">
        {/* Logo and Toggle */}
        <div 
          className={`flex items-center py-4 px-6 border-b border-blue-100/50 cursor-pointer transition-all duration-300 hover:bg-blue-50/50 group ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <div className={`transition-[width,opacity] duration-500 ease-in-out overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-full opacity-100"}`}>
            <button 
              onClick={() => handleNavigate('/dashboard')}
              className="text-center w-full flex justify-center items-center"
            >
              <h1 className="text-3xl font-bold tracking-tight whitespace-nowrap logo-gradient">
                .Meety
              </h1>
            </button>
          </div>
          <button 
            onClick={() => handleCollapse(!isCollapsed)}
            className="transition-all duration-300 rounded-xl p-2 hover:bg-blue-100/30 group-hover:scale-110 shrink-0 focus:outline-none active:outline-none bg-white/0"
          >
            <Menu className={`h-6 w-6 text-blue-600 transition-all duration-500 ease-in-out ${isCollapsed ? "-rotate-180" : "rotate-0"}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <ul className="space-y-2 py-6">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              const rotateDirection = index % 2 === 0 ? "rotate-6" : "-rotate-6";

              return (
                <li 
                  key={item.id}
                  onMouseEnter={() => setIsHovered(item.id)}
                  onMouseLeave={() => setIsHovered(null)}
                >
                  <button
                    onClick={() => handleNavigate(item.path)}
                    className={`flex items-center justify-end gap-3 px-4 py-3 rounded-xl w-full transition-all duration-300 ease-in-out transform ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200/50" : "text-gray-700 hover:bg-blue-100/50"} ${isHovered === item.id && !isActive ? "scale-105" : ""} ${isActive && isHovered === item.id ? "scale-[1.02]" : ""}`}
                  >
                    <div className={`transition-[width,opacity] duration-500 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? "w-0 opacity-0" : "w-full opacity-100"}`}>
                      <span className="font-medium">
                        {item.label}
                      </span>
                    </div>
                    <span className={isActive ? "text-white" : "text-gray-700"}>
                      <Icon className={`h-5 w-5 transition-all duration-300 shrink-0 ${isHovered === item.id ? `scale-110 ${rotateDirection}` : ""} ${isActive && isHovered === item.id ? "scale-110" : ""}`} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Profile Section */}
        <div className="border-t border-blue-100/50 p-4 bg-white/30 backdrop-blur-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full p-2 rounded-xl hover:bg-blue-100/50 transition-all duration-300 group">
                <div className="relative w-full flex items-center transition-all duration-500 ease-in-out">
                  <div className={`flex-1 text-right transition-all duration-500 ease-in-out ${isCollapsed ? "opacity-0 w-0" : "opacity-100 w-full mr-3"}`}>
                    <h3 className="font-medium text-gray-900">{userFullName}</h3>
                    <p className="text-sm text-gray-500">{user?.email || "אורח"}</p>
                  </div>
                  <div className={`shrink-0 transition-all duration-500 ${isCollapsed ? "profile-transition" : "profile-transition-open"} ${isCollapsed ? "translate-x-[calc(50%-1.25rem)]" : "translate-x-0"}`}>
                    {user?.profileImage ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-blue-200 ring-offset-2 transition-all duration-300 group-hover:ring-blue-300 group-hover:shadow-lg">
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}${user.profileImage}`}
                          alt={userFullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-semibold ring-2 ring-blue-200 ring-offset-2 transition-all duration-300 group-hover:ring-blue-300 group-hover:shadow-lg group-hover:from-blue-600 group-hover:to-purple-600">
                        {userInitials}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center justify-end text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-300"
              >
                התנתק
                <LogOut className="h-4 w-4 mr-2" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
