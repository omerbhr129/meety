import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card } from "../components/ui/card";
import { getAdminStats, markNotificationAsRead } from "../services/api";
import { useToast } from "../components/ui/use-toast";
import { Notifications } from "../components/ui/notifications";
import { 
  Users, Calendar, Activity, Clock, TrendingUp, UserCheck, 
  LucideIcon, ListChecks, TrendingDown, ArrowUp, ArrowDown 
} from 'lucide-react';

interface Stats {
  users: {
    total: number;
    active: number;
    lastRegistered: string;
    newLastWeek: number;
    weeklyGrowth: number;
  };
  meetings: {
    total: number;
    upcoming: number;
    completed: number;
    totalCreated: number;
  };
  activity: {
    totalLogins: number;
    activeUsers24h: number;
    averageMeetingsPerUser: number;
  };
  notifications: Array<{
    id: string;
    type: 'meeting_created' | 'user_joined' | 'meeting_completed';
    title: string;
    description: string;
    timestamp: Date;
    read: boolean;
  }>;
  usersList: Array<{
    id: string;
    fullName: string;
    email: string;
    lastLogin: string;
    totalMeetings: number;
    upcomingMeetings: number;
  }>;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  className?: string;
  change?: number;
}

const StatCard = ({ title, value, icon: Icon, className = "", change }: StatCardProps) => (
  <Card className={`p-6 transition-all duration-300 hover:shadow-lg ${className}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-2xl font-bold">{value}</p>
          {typeof change === 'number' && (
            <div className={`flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </div>
      <div className="p-3 bg-blue-100 rounded-xl">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </Card>
);

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת נתוני המערכת"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleNotificationRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      if (stats) {
        setStats({
          ...stats,
          notifications: stats.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return <div>שגיאה בטעינת הנתונים</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">לוח בקרה - Meety</h1>
        <div className="flex items-center gap-4">
          <Notifications 
            notifications={stats.notifications}
            onNotificationRead={handleNotificationRead}
          />
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('he-IL', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="סה״כ משתמשים"
          value={stats.users.total}
          icon={Users}
          className="bg-gradient-to-br from-blue-50 to-blue-100/50"
          change={stats.users.weeklyGrowth}
        />
        <StatCard
          title="משתמשים חדשים השבוע"
          value={stats.users.newLastWeek}
          icon={UserCheck}
          className="bg-gradient-to-br from-green-50 to-green-100/50"
          change={stats.users.weeklyGrowth}
        />
        <StatCard
          title="סה״כ פגישות שנוצרו"
          value={stats.meetings.totalCreated}
          icon={Calendar}
          className="bg-gradient-to-br from-purple-50 to-purple-100/50"
        />
        <StatCard
          title="פגישות מתוכננות"
          value={stats.meetings.upcoming}
          icon={Clock}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100/50"
        />
        <StatCard
          title="פגישות שהושלמו"
          value={stats.meetings.completed}
          icon={ListChecks}
          className="bg-gradient-to-br from-red-50 to-red-100/50"
        />
        <StatCard
          title="ממוצע פגישות למשתמש"
          value={stats.activity.averageMeetingsPerUser}
          icon={TrendingUp}
          className="bg-gradient-to-br from-indigo-50 to-indigo-100/50"
        />
      </div>

      {/* רשימת משתמשים */}
      <Card className="p-6 bg-white shadow-sm">
        <h3 className="text-xl font-semibold mb-6">משתמשים במערכת</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-right py-3 px-4 font-medium text-gray-600">שם מלא</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">אימייל</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">כניסה אחרונה</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">סה&quot;כ פגישות</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">פגישות מתוכננות</th>
              </tr>
            </thead>
            <tbody>
              {stats.usersList.map((user) => (
                <tr 
                  key={user.id} 
                  className="border-b transition-colors hover:bg-gray-50"
                >
                  <td className="py-3 px-4">{user.fullName}</td>
                  <td className="py-3 px-4 text-gray-600">{user.email}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(user.lastLogin).toLocaleString('he-IL')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {user.totalMeetings}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {user.upcomingMeetings}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
