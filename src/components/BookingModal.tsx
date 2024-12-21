import React from 'react';
import { Calendar, X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface BookingModalProps {
  selectedDate: Date;
  selectedTime: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  userDetails: {
    name: string;
    email: string;
    phone: string;
  };
  setUserDetails: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    phone: string;
  }>>;
  hebrewDaysFull: string[];
  hebrewMonths: string[];
}

const BookingModal: React.FC<BookingModalProps> = ({ 
  selectedDate, 
  selectedTime, 
  onClose, 
  onSubmit, 
  userDetails, 
  setUserDetails,
  hebrewDaysFull,
  hebrewMonths
}) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
    <Card className="w-full max-w-lg transform transition-all duration-500 hover:scale-[1.02]">
      <div className="relative p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <div className="flex flex-col gap-6 mt-4">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex p-3 bg-gradient-to-tr from-blue-50 to-blue-100 rounded-xl mb-4">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              אישור פגישה
            </h2>
          </div>
          
          {/* Selected DateTime */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl text-blue-700 shadow-inner">
            <p className="text-center font-medium">
              {selectedDate && hebrewDaysFull[6 - selectedDate.getDay()]}, {selectedDate?.getDate()} {selectedDate && hebrewMonths[selectedDate.getMonth()]}
              <br />
              <span className="text-lg font-bold">{selectedTime}</span>
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-right font-medium text-gray-700">שם מלא</label>
              <Input
                type="text"
                value={userDetails.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserDetails({...userDetails, name: e.target.value})}
                className="w-full transition-all duration-300 focus:scale-[1.02] text-lg py-6"
                placeholder="ישראל ישראלי"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-right font-medium text-gray-700">דוא״ל</label>
              <Input
                type="email"
                value={userDetails.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserDetails({...userDetails, email: e.target.value})}
                className="w-full transition-all duration-300 focus:scale-[1.02] text-lg py-6"
                placeholder="israel@example.com"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-right font-medium text-gray-700">טלפון</label>
              <Input
                type="tel"
                value={userDetails.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserDetails({...userDetails, phone: e.target.value})}
                className="w-full transition-all duration-300 focus:scale-[1.02] text-lg py-6"
                placeholder="050-0000000"
                dir="ltr"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row-reverse gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 py-6 text-lg hover:scale-[1.02] transition-all duration-300"
            >
              ביטול
            </Button>
            <Button
              onClick={onSubmit}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 text-lg hover:scale-[1.02] transition-all duration-300 hover:from-blue-700 hover:to-purple-700"
            >
              אישור הפגישה
            </Button>
          </div>
        </div>
      </div>
    </Card>
  </div>
);

export default BookingModal;
