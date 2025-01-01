import React, { useState, useEffect } from 'react';
import {
  Home,
  Calendar,
  Settings,
  Users,
  LogOut,
  Menu
} from 'lucide-react';
import { UserAvatar } from './ui/user-avatar';
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
  const [imageError, setImageError] = useState(false);
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
    { id: 'settings', label: 'הגדרות', icon: Settings, path: '/settings' },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'ניהול', icon: Users, path: '/admin-dashboard' }] : [])
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  useEffect(() => {
    setImageError(false);
  }, [user?.profileImage]);

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
            120deg,
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
          className={`flex items-center py-4 px-6 border-b border-blue-100/50 cursor-pointer transition-all duration-300 group ${isCollapsed ? "justify-center" : "justify-between"}`}
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
        <div className="border-t border-blue-100/50 p-4 bg-white/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-100/50 transition-all duration-300 ${isCollapsed ? "justify-center" : "justify-between"}`}>
                {!isCollapsed && (
                  <div className="flex-1 text-right">
                    <h3 className="font-medium text-gray-900">{userFullName}</h3>
                    <p className="text-sm text-gray-500">{user?.email || "אורח"}</p>
                  </div>
                )}
                <div className="shrink-0 w-12">
                    {user?.profileImage && !imageError ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-blue-200 ring-offset-2 transition-all duration-300 group-hover:ring-blue-300 group-hover:shadow-lg group-hover:scale-105">
                        <img
                          key={Date.now()}
                          src={user.profileImage}
                          alt={userFullName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Error loading profile image:', {
                              src: user.profileImage,
                              error: e
                            });
                            setImageError(true);
                          }}
                        />
                      </div>
                    ) : (
                      <UserAvatar
                        size="sm"
                        variant="square"
                        user={{ fullName: userFullName }}
                        className="w-12 h-12"
                      />
                    )}
                  </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <>
                <DropdownMenuItem 
                  onClick={() => handleNavigate('/settings')}
                  className="flex items-center justify-end text-gray-700 hover:text-gray-900 hover:bg-blue-50/80 transition-all duration-300 rounded-lg mb-1"
                >
                  הגדרות פרופיל
                  <Settings className="h-4 w-4 mr-2" />
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="flex items-center justify-end text-red-600 hover:text-red-700 hover:bg-red-50/80 transition-all duration-300 rounded-lg"
                >
                  התנתק
                  <LogOut className="h-4 w-4 mr-2" />
                </DropdownMenuItem>
              </>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
