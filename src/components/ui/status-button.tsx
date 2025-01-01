import React, { useState } from 'react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { BookedSlot } from '../../types/meeting';

type StatusType = 'completed' | 'missed' | 'pending' | 'deleted';

interface StatusButtonProps {
  meetingId: string;
  slot: BookedSlot;
  onStatusUpdate: (meetingId: string, slotId: string, status: StatusType) => Promise<void>;
}

const StatusButton: React.FC<StatusButtonProps> = ({ meetingId, slot, onStatusUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentStatus = slot.status || 'completed';

  return (
    <div className="relative z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`
              ${currentStatus === 'missed' 
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}
              min-w-[100px] justify-center transition-all duration-200 hover:scale-[1.02]
              shadow-sm hover:shadow-md
            `}
          >
            {currentStatus === 'missed' ? 'לא התקיימה' : 'התקיימה'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2" align="end">
          <div className="flex flex-col gap-2">
            {currentStatus === 'missed' ? (
              <Button
                variant="ghost"
                className="justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:scale-[1.02] transition-all"
                onClick={() => {
                  onStatusUpdate(meetingId, slot._id!, 'completed');
                  setIsOpen(false);
                }}
              >
                סמן כהתקיימה
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 hover:scale-[1.02] transition-all"
                onClick={() => {
                  onStatusUpdate(meetingId, slot._id!, 'missed');
                  setIsOpen(false);
                }}
              >
                סמן כלא התקיימה
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default StatusButton;
