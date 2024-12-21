import { Card } from '../components/ui/card';
import { Check, Calendar, Clock, Video, Phone, MapPin, Mail, PhoneCall } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function BookingSuccess() {
  const [params, setParams] = useState({
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    meetingTitle: '',
    meetingType: '',
    duration: ''
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setParams({
      date: searchParams.get('date') || '',
      time: searchParams.get('time') || '',
      name: searchParams.get('name') || '',
      email: searchParams.get('email') || '',
      phone: searchParams.get('phone') || '',
      meetingTitle: searchParams.get('meetingTitle') || '',
      meetingType: searchParams.get('meetingType') || '',
      duration: searchParams.get('duration') || ''
    });
  }, []);

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'phone':
        return <Phone className="h-5 w-5" />;
      case 'in-person':
        return <MapPin className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getMeetingTypeInHebrew = (type: string) => {
    const types: { [key: string]: string } = {
      'video': 'שיחת וידאו',
      'phone': 'שיחת טלפון',
      'in-person': 'פגישה פרונטלית'
    };
    return types[type] || type;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-lg bg-white/90 backdrop-blur-sm shadow-xl border-blue-100/50">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="bg-green-100 w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">הפגישה נקבעה בהצלחה!</h2>
            <p className="text-gray-600">נשלח אליך אימייל עם פרטי הפגישה</p>
          </div>

          <div className="overflow-hidden rounded-xl">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
              <h3 className="text-xl font-bold mb-4">{params.meetingTitle}</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 opacity-90" />
                  <span>{formatDate(params.date)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 opacity-90" />
                  <span>{params.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  {getMeetingTypeIcon(params.meetingType)}
                  <div className="flex items-center gap-2">
                    <span>{getMeetingTypeInHebrew(params.meetingType)}</span>
                    <span className="opacity-75">•</span>
                    <span>{params.duration} דקות</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-b-xl border-t border-white/10">
              <h4 className="font-medium text-gray-700 mb-4">פרטי המשתתף</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                    {params.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-lg">{params.name}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{params.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <PhoneCall className="h-4 w-4" />
                  <span>{params.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
