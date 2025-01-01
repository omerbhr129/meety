import React, { useState } from 'react';
import { Copy, Video, Phone, Users, Check, Home, Calendar } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Meeting } from "@/types/meeting";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";

interface MeetingCreatedDialogProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MeetingCreatedDialog({ meeting, isOpen, onClose }: MeetingCreatedDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (!meeting) return null;

  const getMeetingTypeIcon = () => {
    const className = "w-8 h-8 text-blue-600";
    switch (meeting.type) {
      case 'video':
        return <Video className={className} />;
      case 'phone':
        return <Phone className={className} />;
      case 'in-person':
        return <Users className={className} />;
      default:
        return null;
    }
  };

  const getMeetingTypeText = () => {
    switch (meeting.type) {
      case 'video':
        return 'פגישת וידאו';
      case 'phone':
        return 'שיחת טלפון';
      case 'in-person':
        return 'פגישה פרונטלית';
      default:
        return meeting.type;
    }
  };

  const getFullLink = () => {
    if (!meeting.shareableLink) return '';
    return `${window.location.origin}/book/${meeting.shareableLink}`;
  };

  const copyShareableLink = () => {
    const fullLink = getFullLink();
    if (!fullLink) return;
    navigator.clipboard.writeText(fullLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "הלינק הועתק",
        description: "הלינק המשותף הועתק ללוח",
      });
    });
  };

  const handleHomeClick = () => {
    onClose();
    router.push('/dashboard');
  };

  const handleEditClick = () => {
    onClose();
    router.push('/meetings');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-black/50 backdrop-blur-sm absolute inset-0" />
        <div className="relative bg-white rounded-lg shadow-lg w-[500px] overflow-hidden">
          <div className="p-8" dir="rtl">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                {getMeetingTypeIcon()}
              </div>
              <h2 className="text-2xl font-bold text-blue-600">
                הפגישה נוצרה בהצלחה!
              </h2>
            </div>

            {/* Meeting Details */}
            <div className="bg-blue-50 rounded-xl p-4 mt-5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">כותרת:</span>
                <span className="text-gray-900">{meeting.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    {getMeetingTypeIcon()}
                  </div>
                  <span>{getMeetingTypeText()}</span>
                </div>
                <div className="flex items-center gap-1 bg-blue-100/50 px-3 py-1.5 rounded-lg text-blue-600">
                  <span>{meeting.duration}</span>
                  <span>דקות</span>
                </div>
              </div>
            </div>

            {/* Link */}
            <div className="mt-5 space-y-2">
              <label className="block text-sm font-medium text-gray-600">לינק משותף:</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 p-3 rounded-xl font-mono text-sm truncate text-gray-600 border border-gray-100">
                  {getFullLink()}
                </div>
                <button
                  onClick={copyShareableLink}
                  className={`p-3 rounded-xl border transition-all ${
                    copied 
                      ? 'bg-green-50 text-green-600 border-green-100' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <Button
                onClick={handleHomeClick}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-6"
              >
                <Home className="w-5 h-5" />
                דף הבית
              </Button>
              <Button
                onClick={handleEditClick}
                variant="outline"
                className="flex items-center justify-center gap-2 text-gray-700 border-gray-200 hover:bg-gray-50 py-6"
              >
                <Calendar className="w-5 h-5" />
                דף הפגישות
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
