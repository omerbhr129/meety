import { useState } from 'react';
import { useRouter } from 'next/router';
import { createParticipant } from '../services/api';
import { useToast } from '../components/ui/use-toast';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { withAuth } from '../lib/auth';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Phone, User } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

function NewParticipantPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Creating participant with data:', formData);
      
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('שם מלא הוא שדה חובה');
      }
      if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
        throw new Error('כתובת דוא״ל אינה תקינה');
      }
      if (!formData.phone.trim() || !/^\d{9,15}$/.test(formData.phone.replace(/\D/g, ''))) {
        throw new Error('מספר טלפון אינו תקין');
      }

      // Format phone number
      const formattedPhone = formData.phone.replace(/\D/g, '');
      
      const response = await createParticipant({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formattedPhone
      });

      console.log('Participant creation response:', response);

      if (!response?.participant?._id) {
        throw new Error('תגובת השרת אינה תקינה');
      }

      toast({
        title: "המשתתף נוצר בהצלחה",
        description: "מעביר אותך לרשימת המשתתפים"
      });

      router.push('/participants');
    } catch (error) {
      console.error('Error creating participant:', error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error instanceof Error ? error.message : "לא הצלחנו ליצור את המשתתף"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <Head>
        <title>משתתף חדש | Meety</title>
      </Head>
      <div dir="rtl" className="min-h-screen p-6 bg-gray-50">
        <motion.div 
          className="max-w-2xl mx-auto space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between"
            variants={itemVariants}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-l from-blue-600 to-blue-700 text-transparent bg-clip-text">
              משתתף חדש
            </h1>
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              חזרה
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </motion.div>

          {/* Form Card */}
          <motion.div
            variants={itemVariants}
          >
            <Card className="overflow-hidden shadow-lg">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      שם מלא
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                      placeholder="הכנס שם מלא"
                      disabled={loading}
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      דוא״ל
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                      placeholder="הכנס כתובת דוא״ל"
                      dir="ltr"
                      disabled={loading}
                    />
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      טלפון
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                      placeholder="הכנס מספר טלפון"
                      dir="ltr"
                      disabled={loading}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-l from-blue-600 to-blue-700 text-white p-3 rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        יוצר משתתף...
                      </div>
                    ) : (
                      'יצירת משתתף'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

export default withAuth(NewParticipantPage);
