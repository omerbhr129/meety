import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import {
  Calendar,
  Settings,
  Users,
  Menu,
  Plus,
  Home
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { User } from "@/types/user";

const Dashboard: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [user, setUser] = useState<User | null>(null);

  const menuItems = [
    { icon: Home, label: 'בית', id: 'dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'פגישות', id: 'meetings', path: '/meetings' },
    { icon: Users, label: 'משתתפים', id: 'participants', path: '/participants' },
    { icon: Settings, label: 'הגדרות', id: 'settings', path: '/settings' }
  ];

  // Update greeting dynamically
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting('בוקר טוב');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('צהריים טובים');
      } else if (hour >= 17 && hour < 21) {
        setGreeting('ערב טוב');
      } else {
        setGreeting('לילה טוב');
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch user data
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetch(`/api/user/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.fullName) {
            setUser(data);
          } else {
            console.error('User not found');
          }
        })
        .catch((err) => console.error('Error fetching user:', err));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Head>
        <title>Meety</title>
      </Head>

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full bg-white shadow-lg transition-all duration-300 
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex flex-col h-full">
          {/* Logo and Menu */}
          <div className="flex items-center justify-between p-4 border-b relative">
            {!isSidebarCollapsed && (
              <span className="text-2xl font-bold text-blue-600 absolute left-1/2 transform -translate-x-1/2">
                .Meety
              </span>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hover:scale-110 hover:text-blue-500 transition-transform ml-auto"
            >
              <Menu className="h-6 w-6 text-blue-600 hover:drop-shadow-md" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-grow p-4">
            {menuItems.map((item) => (
              <Link
                href={item.path}
                key={item.id}
                className={`w-full flex items-center gap-3 mb-2 text-right p-3 rounded ${
                  item.id === 'dashboard'
                    ? 'bg-blue-200 text-blue-600 hover:bg-blue-300'
                    : 'text-gray-600 hover:bg-blue-100'
                }`}
              >
                <item.icon className="inline-block ml-2 h-5 w-5" />
                <span
                  className={`transition-all duration-300 ${
                    isSidebarCollapsed ? 'opacity-0 invisible h-0' : 'opacity-100 visible h-auto'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 text-right">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt={user?.fullName || 'משתמש'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-blue-600">
                        {user?.fullName
                          ? user.fullName.split(' ').map((word: string) => word[0]).join('')
                          : 'א'}
                      </span>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="text-right">
                      <p className="text-sm font-medium">{user?.fullName?.trim() || 'משתמש'}</p>
                      <p className="text-xs text-gray-500">{user?.email || ''}</p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 z-50 bg-white shadow-lg rounded-lg text-right"
                style={{ direction: 'rtl' }}
              >
                <DropdownMenuItem className="hover:bg-blue-100 focus:bg-blue-200">
                  עריכת פרופיל
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-blue-100 focus:bg-blue-200">
                  הגדרות
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 hover:bg-red-100 focus:bg-red-200">
                  התנתקות
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isSidebarCollapsed ? 'mr-20' : 'mr-64'} p-8`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">
                {greeting}, {user?.fullName?.trim() || 'משתמש'}!
              </h1>
              <p className="text-gray-500 mt-1">
                {new Date().toLocaleDateString('he-IL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 text-white">
              <Plus className="h-5 w-5 ml-2" />
              פגישה חדשה
            </Button>
          </div>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>פגישות קרובות</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.meetings?.length ? (
                user.meetings.map((meeting: { id: string; title: string }) => (
                  <div key={meeting.id}>{meeting.title}</div>
                ))
              ) : (
                <p className="text-gray-500">אין פגישות קרובות</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
