import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Mail, Phone, User, Check } from 'lucide-react';

interface ParticipantCreatedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  participant: {
    fullName: string;
    email: string;
    phone: string;
  } | null;
}

export function ParticipantCreatedDialog({ isOpen, onClose, participant }: ParticipantCreatedDialogProps) {
  if (!participant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md text-center" dir="rtl">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 flex items-center justify-center mb-6 shadow-lg shadow-green-100">
            <Check className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 bg-clip-text text-transparent">
            המשתתף נוסף בהצלחה
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            פרטי המשתתף נשמרו במערכת
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <span className="text-gray-900 font-medium">{participant.fullName}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="text-gray-900">{participant.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-blue-600" />
              <span className="text-gray-900">{participant.phone}</span>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] transition-all"
          >
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
