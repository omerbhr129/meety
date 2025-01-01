import React, { useState } from 'react';
import { User, Mail, Phone, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/router';
import { useToast } from '../components/ui/use-toast';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { ParticipantCreatedDialog } from '../components/ParticipantCreatedDialog';
import { createParticipant } from '../services/api';
import { CreateParticipantDto } from '../types/participant';

interface ParticipantData {
  fullName: string;
  email: string;
  phone: string;
}

const validatePhone = (phone: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return (cleanPhone.length === 10 && cleanPhone.startsWith('05')) || 
         (cleanPhone.length === 12 && cleanPhone.startsWith('972'));
};

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const formatPhone = (phone: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('05')) {
    return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  if (cleanPhone.startsWith('972')) {
    return '+' + cleanPhone.replace(/(\d{3})(\d{2})(\d{3})(\d{4})/, '$1-$2-$3-$4');
  }
  return phone;
};

function NewParticipantPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [participant, setParticipant] = useState<ParticipantData>({
    fullName: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Partial<ParticipantData>>({});

  const validateForm = () => {
    const newErrors: Partial<ParticipantData> = {};

    if (!participant.fullName.trim()) {
      newErrors.fullName = 'שם מלא הוא שדה חובה';
    } else if (participant.fullName.length < 2) {
      newErrors.fullName = 'שם חייב להכיל לפחות 2 תווים';
    }

    if (!participant.email.trim()) {
      newErrors.email = 'דוא״ל הוא שדה חובה';
    } else if (!validateEmail(participant.email)) {
      newErrors.email = 'כתובת דוא״ל לא תקינה';
    }

    if (!participant.phone.trim()) {
      newErrors.phone = 'מספר טלפון הוא שדה חובה';
    } else if (!validatePhone(participant.phone)) {
      newErrors.phone = 'מספר טלפון לא תקין';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^\d-+]/g, '');
    value = formatPhone(value);
    setParticipant({ ...participant, phone: value });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "נא לתקן את השגיאות בטופס"
      });
      return;
    }

    setIsLoading(true);

    try {
      const participantDto: CreateParticipantDto = {
        name: participant.fullName,
        email: participant.email,
        phone: participant.phone
      };

      const response = await createParticipant(participantDto);
      
      setParticipant({
        fullName: response.participant.fullName,
        email: response.participant.email,
        phone: response.participant.phone
      });
      
      setShowDialog(true);
    } catch (error: any) {
      console.error('Error creating participant:', error);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "שגיאה ביצירת משתתף";
      
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    router.push('/participants');
  };

  return (
    <>
      <Head>
        <title>הוספת משתתף | Meety</title>
      </Head>
      <div className="h-[calc(100vh-64px)] flex items-center justify-center -mt-16" dir="rtl">
        <div className="w-full max-w-4xl mx-auto px-8">
          <Card className="overflow-hidden bg-white/90 backdrop-blur-lg shadow-xl border-0">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-700"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="p-8 space-y-12">
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="inline-flex p-4 rounded-2xl mb-6 shadow-inner bg-blue-50">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-blue-700 text-transparent bg-clip-text">
                    הוספת משתתף חדש
                  </h1>
                  <p className="text-gray-500 text-lg">
                    הזן את פרטי המשתתף החדש
                  </p>
                </motion.div>

                <motion.div 
                  className="space-y-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="space-y-3">
                    <label className="block text-right font-medium text-gray-700 text-lg">
                      שם מלא
                    </label>
                    <div className="relative">
                      <Input
                        value={participant.fullName}
                        onChange={(e) => {
                          setParticipant({...participant, fullName: e.target.value});
                          if (errors.fullName) {
                            setErrors({...errors, fullName: undefined});
                          }
                        }}
                        className={`p-6 text-lg pl-12 text-right transition-all duration-200 ${
                          errors.fullName ? 'border-red-500 focus:ring-red-100' : 'focus:ring-blue-100'
                        }`}
                        placeholder=""
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-red-500 mt-2">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-right font-medium text-gray-700 text-lg">
                      דוא״ל
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={participant.email}
                        onChange={(e) => {
                          setParticipant({...participant, email: e.target.value});
                          if (errors.email) {
                            setErrors({...errors, email: undefined});
                          }
                        }}
                        className={`p-6 text-lg pl-12 text-left transition-all duration-200 ${
                          errors.email ? 'border-red-500 focus:ring-red-100' : 'focus:ring-blue-100'
                        }`}
                        placeholder=""
                        dir="ltr"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-2">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-right font-medium text-gray-700 text-lg">
                      טלפון
                    </label>
                    <div className="relative">
                      <Input
                        type="tel"
                        value={participant.phone}
                        onChange={handlePhoneChange}
                        className={`p-6 text-lg pl-12 text-left transition-all duration-200 ${
                          errors.phone ? 'border-red-500 focus:ring-red-100' : 'focus:ring-blue-100'
                        }`}
                        placeholder=""
                        dir="ltr"
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-2">{errors.phone}</p>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={handleSubmit}
                      className="flex-1 text-white p-6 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                          מוסיף משתתף...
                        </>
                      ) : (
                        'הוסף משתתף'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                      className="flex-1 p-6 text-lg hover:bg-gray-50 hover:scale-[1.02] transition-all"
                      disabled={isLoading}
                    >
                      ביטול
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ParticipantCreatedDialog
        isOpen={showDialog}
        onClose={handleDialogClose}
        participant={participant}
      />
    </>
  );
}

export default NewParticipantPage;
