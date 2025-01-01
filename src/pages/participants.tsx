import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { getParticipants, deleteParticipant, updateParticipant } from '../services/api';
import { withAuth } from '../lib/auth';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Mail, Phone, User, Calendar, Grid, LayoutGrid, Table as TableIcon, Trash2, MoreVertical, Search, Pencil } from 'lucide-react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/use-toast';
import { Input } from '../components/ui/input';
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
import { GetParticipantsResponse, Participant, UpdateParticipantDto } from '../types/participant';

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

const EditParticipantForm = React.memo(({ 
  participant, 
  onSave, 
  onCancel 
}: { 
  participant: Participant; 
  onSave: (data: UpdateParticipantDto) => void; 
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<UpdateParticipantDto>({
    fullName: participant.fullName || '',
    email: participant.email || '',
    phone: participant.phone || ''
  });

  const handleChange = (field: keyof UpdateParticipantDto) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="space-y-3">
        <label className="block text-right font-medium text-gray-700 text-lg">שם מלא</label>
        <div className="relative">
          <Input
            value={formData.fullName}
            onChange={handleChange('fullName')}
            placeholder="הכנס שם מלא"
            className="p-6 pl-12 text-lg"
            autoComplete="off"
          />
          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-right font-medium text-gray-700 text-lg">דוא״ל</label>
        <div className="relative">
          <Input
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="הכנס כתובת דוא״ל"
            className="p-6 pl-12 text-lg"
            dir="ltr"
            autoComplete="off"
          />
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-right font-medium text-gray-700 text-lg">טלפון</label>
        <div className="relative">
          <Input
            value={formData.phone}
            onChange={handleChange('phone')}
            placeholder="הכנס מספר טלפון"
            className="p-6 pl-12 text-lg"
            dir="ltr"
            autoComplete="off"
          />
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <Button
          onClick={() => onSave(formData)}
          className="flex-1 text-white p-6 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] transition-all"
        >
          שמור שינויים
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 p-6 text-lg hover:bg-gray-50 hover:scale-[1.02] transition-all"
        >
          ביטול
        </Button>
      </div>
    </div>
  );
});

EditParticipantForm.displayName = 'EditParticipantForm';

function ParticipantsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [participantToEdit, setParticipantToEdit] = useState<Participant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchParticipants = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await getParticipants();
      if (response?.participants) {
        setParticipants(response.participants);
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load participants';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "שגיאה בטעינת המשתתפים",
        description: errorMessage
      });
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    fetchParticipants().finally(() => setLoading(false));
  }, [fetchParticipants]);

  const handleEditParticipant = useCallback(async (formData: UpdateParticipantDto) => {
    if (!participantToEdit?._id) return;

    try {
      await updateParticipant(participantToEdit._id, formData);
      setParticipantToEdit(null);
      toast({
        title: "המשתתף עודכן בהצלחה",
        description: "פרטי המשתתף עודכנו במערכת",
      });
      // רענון מלא של הדף
      window.location.reload();
    } catch (err) {
      console.error('Error updating participant:', err);
      toast({
        title: "שגיאה בעדכון המשתתף",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  }, [participantToEdit, toast]);

  const handleDeleteParticipant = useCallback(async () => {
    if (!participantToDelete?._id) return;

    try {
      await deleteParticipant(participantToDelete._id);
      setParticipantToDelete(null);
      toast({
        title: "המשתתף נמחק בהצלחה",
        description: "המשתתף הוסר מהמערכת",
      });
      // רענון מלא של הדף לאחר מחיקה
      window.location.reload();
    } catch (err) {
      console.error('Error deleting participant:', err);
      toast({
        title: "שגיאה במחיקת המשתתף",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  }, [participantToDelete, toast]);

  const filteredParticipants = useMemo(() => {
    let filtered = [...participants];
    
    // Sort by createdAt in descending order (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Then apply search filter if exists
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(participant => 
        participant.fullName?.toLowerCase().includes(searchLower) ||
        participant.email?.toLowerCase().includes(searchLower) ||
        participant.phone?.includes(searchQuery)
      );
    }
    
    return filtered;
  }, [participants, searchQuery]);

  const DeleteConfirmationDialog = useCallback(() => (
    <Dialog 
      open={!!participantToDelete} 
      onOpenChange={(open) => {
        if (!open) {
          setParticipantToDelete(null);
          // רענון מלא של הדף בעת סגירת דיאלוג המחיקה
          window.location.reload();
        }
      }}
    >
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-r from-red-50 to-red-100 flex items-center justify-center mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
            מחיקת משתתף
          </DialogTitle>
          <DialogDescription className="text-center mt-2">
            האם אתה בטוח שברצונך למחוק את {participantToDelete?.fullName}?
            <br />
            פעולה זו לא ניתנת לביטול.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 pt-4">
          <Button
            variant="destructive"
            onClick={handleDeleteParticipant}
            className="flex-1 p-6 text-lg hover:scale-[1.02] transition-all"
          >
            מחק
          </Button>
          <Button
            variant="outline"
            onClick={() => setParticipantToDelete(null)}
            className="flex-1 p-6 text-lg hover:bg-gray-50 hover:scale-[1.02] transition-all"
          >
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  ), [participantToDelete, handleDeleteParticipant]);

  const EditParticipantDialog = useCallback(() => (
    <Dialog 
      open={!!participantToEdit} 
      onOpenChange={(open) => {
        if (!open) {
          setParticipantToEdit(null);
          // רענון מלא של הדף בעת סגירת דיאלוג העריכה
          window.location.reload();
        }
      }}
    >
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center">
              <Pencil className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="w-full text-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-transparent bg-clip-text">
                עריכת משתתף
              </span>
            </DialogTitle>
            <div className="w-full border-b border-gray-200" />
          </div>
        </DialogHeader>
        {participantToEdit && (
          <EditParticipantForm
            participant={participantToEdit}
            onSave={handleEditParticipant}
            onCancel={() => {
              setParticipantToEdit(null);
              // רענון מלא של הדף בעת ביטול העריכה
              window.location.reload();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  ), [participantToEdit, handleEditParticipant]);

  const renderGridView = useCallback(() => (
    <motion.div 
      variants={containerVariants}
      initial="exit"
      animate="grid"
      exit="exit"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {filteredParticipants.map((participant, index) => {
        if (!participant?.fullName) return null;

        return (
          <motion.div
            key={participant._id}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.1 }}
            className="w-full"
          >
            <Card className="overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 h-[200px]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 
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
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full hover:scale-[1.02] transition-all"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top">
                      <DropdownMenuItem
                        onClick={() => setParticipantToEdit(participant)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:scale-[1.02] transition-all flex items-center gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        ערוך משתתף
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setParticipantToDelete(participant)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:scale-[1.02] transition-all flex items-center gap-2"
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
  ), [filteredParticipants]);

  const renderTableView = useCallback(() => (
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
                <th className="text-right py-4 px-6 font-medium text-gray-700">תאריך הצטרפות</th>
                <th className="py-4 px-6 font-medium text-gray-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredParticipants.map((participant, index) => {
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
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 
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
                    <td className="py-4 px-6 text-gray-600">
                      {participant.createdAt 
                        ? new Date(participant.createdAt).toLocaleDateString('he-IL')
                        : '-'
                      }
                    </td>
                    <td className="py-4 px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full hover:scale-[1.02] transition-all"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="top">
                          <DropdownMenuItem
                            onClick={() => setParticipantToEdit(participant)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:scale-[1.02] transition-all flex items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            ערוך משתתף
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setParticipantToDelete(participant)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:scale-[1.02] transition-all flex items-center gap-2"
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
  ), [filteredParticipants]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <div className="text-2xl font-semibold text-blue-600">
                טוען את המשתתפים שלך...
              </div>
              <div className="text-sm text-gray-500">
                אנא המתן בזמן שאנחנו טוענים את כל המשתתפים
              </div>
            </div>
          </CardContent>
        </Card>
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
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-transparent bg-clip-text">
              המשתתפים שלי
            </h1>
            <div className="flex gap-3">
              <Button
                onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                variant="outline"
                className="bg-white hover:bg-blue-50 hover:scale-[1.02] transition-all"
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
              <Button
                onClick={() => router.push('/new-participant')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] transition-all"
              >
                <Plus className="h-5 w-5 ml-2" />
                משתתף חדש
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="חיפוש לפי שם, אימייל או טלפון..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 w-full max-w-md"
                dir="rtl"
              />
            </div>
          </div>

          {filteredParticipants.length === 0 ? (
            <Card className="p-8 text-center hover:scale-[1.02] transition-all duration-300">
              {participants.length === 0 ? (
                <>
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl text-gray-600 mb-4">אין לך משתתפים עדיין</h3>
                  <p className="text-gray-500 mb-6">
                    המשתתפים שיקבעו פגישות יופיעו כאן
                  </p>
                  <Button
                    onClick={() => router.push('/new-participant')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] transition-all"
                  >
                    <Plus className="h-5 w-5 ml-2" />
                    הוסף משתתף ראשון
                  </Button>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl text-gray-600 mb-4">לא נמצאו תוצאות</h3>
                  <p className="text-gray-500">
                    לא נמצאו משתתפים התואמים את החיפוש שלך
                  </p>
                </>
              )}
            </Card>
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === 'grid' ? renderGridView() : renderTableView()}
            </AnimatePresence>
          )}

          <DeleteConfirmationDialog />
          <EditParticipantDialog />
        </div>
      </div>
    </>
  );
}

export default withAuth(ParticipantsPage);
