import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { getParticipants, deleteParticipant } from '../services/api';
import { withAuth } from '../lib/auth';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Mail, Phone, User, Calendar, Grid, LayoutGrid, Table as TableIcon, Trash2, MoreVertical } from 'lucide-react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

interface Participant {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  meetings: string[];
  lastMeeting?: string;
}

type ViewMode = 'grid' | 'table';

const containerVariants = {
  grid: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  },
  table: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    rotateX: -15,
    transition: {
      duration: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

function ParticipantsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        if (!token) return;
        
        const response = await getParticipants();
        if (response) {
          setParticipants(response);
        }
      } catch (err) {
        console.error('Error fetching participants:', err);
        setError(err instanceof Error ? err.message : 'Failed to load participants');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [token, router.pathname]);

  const handleDeleteParticipant = async () => {
    if (!participantToDelete?._id) {
      console.error('No participant ID to delete');
      return;
    }

    try {
      console.log('Deleting participant:', participantToDelete._id);
      await deleteParticipant(participantToDelete._id);
      setParticipants(participants.filter(p => p._id !== participantToDelete._id));
      setParticipantToDelete(null);
      toast({
        title: "המשתתף נמחק בהצלחה",
        description: "המשתתף הוסר מהמערכת",
      });
    } catch (err) {
      console.error('Error deleting participant:', err);
      toast({
        title: "שגיאה במחיקת המשתתף",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  };

  const DeleteConfirmationDialog = () => (
    <Dialog open={!!participantToDelete} onOpenChange={() => setParticipantToDelete(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>מחיקת משתתף</DialogTitle>
          <DialogDescription>
            האם אתה בטוח שברצונך למחוק את {participantToDelete?.fullName}?
            פעולה זו לא ניתנת לביטול.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => setParticipantToDelete(null)}
          >
            ביטול
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteParticipant}
          >
            מחק
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderGridView = () => (
    <motion.div 
      variants={containerVariants}
      initial="exit"
      animate="grid"
      exit="exit"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {participants.map((participant, index) => {
        if (!participant?.fullName) return null;

        return (
          <motion.div
            key={participant._id}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 
                      flex items-center justify-center text-white text-xl font-semibold">
                      {participant.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {participant.fullName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {participant.meetings?.length || 0} פגישות
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setParticipantToDelete(participant)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        מחק משתתף
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{participant.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{participant.phone}</span>
                  </div>
                  {participant.lastMeeting && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>פגישה אחרונה: {new Date(participant.lastMeeting).toLocaleDateString('he-IL')}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );

  const renderTableView = () => (
    <motion.div
      variants={containerVariants}
      initial="exit"
      animate="table"
      exit="exit"
    >
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right py-4 px-6 font-medium text-gray-700">שם</th>
                <th className="text-right py-4 px-6 font-medium text-gray-700">דוא״ל</th>
                <th className="text-right py-4 px-6 font-medium text-gray-700">טלפון</th>
                <th className="text-right py-4 px-6 font-medium text-gray-700">מספר פגישות</th>
                <th className="text-right py-4 px-6 font-medium text-gray-700">פגישה אחרונה</th>
                <th className="py-4 px-6 font-medium text-gray-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {participants.map((participant, index) => {
                if (!participant?.fullName) return null;

                return (
                  <motion.tr 
                    key={participant._id} 
                    className="hover:bg-gray-50"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 
                          flex items-center justify-center text-white text-sm font-semibold">
                          {participant.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{participant.fullName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{participant.email}</td>
                    <td className="py-4 px-6 text-gray-600">{participant.phone}</td>
                    <td className="py-4 px-6 text-gray-600">{participant.meetings?.length || 0}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {participant.lastMeeting 
                        ? new Date(participant.lastMeeting).toLocaleDateString('he-IL')
                        : '-'
                      }
                    </td>
                    <td className="py-4 px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setParticipantToDelete(participant)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            מחק משתתף
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-2xl font-semibold text-blue-600">טוען...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-red-600">שגיאה: {error}</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>משתתפים | Meety</title>
      </Head>
      <div className="min-h-screen p-8" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-transparent bg-clip-text">
              המשתתפים שלי
            </h1>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                variant="outline"
                className="bg-white"
              >
                {viewMode === 'grid' ? (
                  <>
                    <TableIcon className="h-4 w-4 ml-2" />
                    תצוגת טבלה
                  </>
                ) : (
                  <>
                    <LayoutGrid className="h-4 w-4 ml-2" />
                    תצוגת רשת
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {participants.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="text-xl text-gray-600 mb-4">אין לך משתתפים עדיין</h3>
              <p className="text-gray-500 mb-6">
                המשתתפים שיקבעו פגישות יופיעו כאן
              </p>
            </Card>
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === 'grid' ? renderGridView() : renderTableView()}
            </AnimatePresence>
          )}

          <DeleteConfirmationDialog />
        </div>
      </div>
    </>
  );
}

export default withAuth(ParticipantsPage);
