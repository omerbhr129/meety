import { Card } from '../components/ui/card';
import { Check, Calendar, Clock, Video, Phone, MapPin, Mail, PhoneCall } from 'lucide-react';

export default function BookingSuccess() {
  // Get query params from URL
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const date = params.get('date');
  const time = params.get('time');
  const name = params.get('name');
  const email = params.get('email');
  const phone = params.get('phone');
  const meetingTitle = params.get('meetingTitle');
  const meetingType = params.get('meetingType');
  const duration = params.get('duration');

  const getMeetingTypeIcon = (type: string | null) => {
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

  const getMeetingTypeInHebrew = (type: string | null) => {
    const types: { [key: string]: string } = {
      'video': 'שיחת וידאו',
      'phone': 'שיחת טלפון',
      'in-person': 'פגישה פרונטלית'
    };
    return type ? types[type] || type : '';
  };

  const formatDate = (dateString: string | null) => {
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

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">{meetingTitle}</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 opacity-90" />
                <span>{formatDate(date)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 opacity-90" />
                <span>{time}</span>
              </div>
              <div className="flex items-center gap-3">
                {getMeetingTypeIcon(meetingType)}
                <div className="flex items-center gap-2">
                  <span>{getMeetingTypeInHebrew(meetingType)}</span>
                  <span className="opacity-75">•</span>
                  <span>{duration} דקות</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-medium text-gray-700 mb-4">פרטי המשתתף</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                  {name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-lg">{name}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <PhoneCall className="h-4 w-4" />
                <span>{phone}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
