import { useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth, withAuth } from '../lib/auth';
import { updateUserProfile, uploadProfileImage, deleteUserAccount } from '../services/api';
import { useToast } from '../components/ui/use-toast';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "שגיאה בהעלאת התמונה",
        description: "גודל הקובץ חייב להיות קטן מ-5MB",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const { user: updatedUser } = await uploadProfileImage(file);
      updateUser(updatedUser);
      toast({
        title: "התמונה הועלתה בהצלחה",
        description: "תמונת הפרופיל שלך עודכנה",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      let errorMessage = "אנא נסה שוב מאוחר יותר";
      
      if (error.response?.status === 413 || error.response?.data?.message === 'File too large') {
        errorMessage = "גודל הקובץ חייב להיות קטן מ-5MB";
      }
      
      toast({
        title: "שגיאה בהעלאת התמונה",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password confirmation if changing password
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "שגיאה בשינוי סיסמה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const updateData: any = {
        fullName: formData.fullName,
        email: formData.email,
      };

      // Add password data if changing password
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const { user: updatedUser } = await updateUserProfile(updateData);
      updateUser(updatedUser);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      toast({
        title: "הפרטים עודכנו בהצלחה",
        description: "פרטי המשתמש שלך עודכנו בהצלחה",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "שגיאה בעדכון הפרטים",
        description: error.response?.data?.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו אינה הפיכה.')) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteUserAccount();
      await logout();
      router.push('/');
      toast({
        title: "החשבון נמחק בהצלחה",
        description: "החשבון שלך נמחק בהצלחה. מקווים לראותך שוב בעתיד!",
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "שגיאה במחיקת החשבון",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>הגדרות | Meety</title>
      </Head>
      <div className="min-h-screen p-8" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 text-transparent bg-clip-text mb-8">
              הגדרות פרופיל
            </h1>
            
            {/* תמונת פרופיל */}
            <div className="flex flex-col items-center mb-12">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-gray-50 to-gray-100">
                  {user?.profileImage ? (
                    <img 
                      src={`${process.env.NEXT_PUBLIC_API_URL}${user.profileImage}`}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-700 to-blue-500 text-white p-2.5 rounded-full cursor-pointer shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    disabled={isLoading}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-3 font-medium">לחץ על הסמל כדי להעלות תמונה (עד 5MB)</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* שם מלא */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">שם מלא</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                  placeholder="הזן את שמך המלא"
                  disabled={isLoading}
                />
              </div>

              {/* דוא״ל */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">דוא״ל</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                  placeholder="הזן את כתובת הדוא״ל שלך"
                  disabled={isLoading}
                />
              </div>

              {/* שינוי סיסמה */}
              <div className="border-t border-gray-100 pt-8 mt-8">
                <h2 className="text-xl font-semibold mb-6 text-gray-800">שינוי סיסמה</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">סיסמה נוכחית</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                      placeholder="הזן את הסיסמה הנוכחית"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">סיסמה חדשה</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                      placeholder="הזן סיסמה חדשה"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">אימות סיסמה חדשה</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                      placeholder="הזן שוב את הסיסמה החדשה"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* כפתורי פעולה */}
              <div className="flex justify-between items-center pt-8 border-t border-gray-100 mt-8">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-8 py-3.5 rounded-xl hover:shadow-lg hover:scale-105 active:scale-100 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? 'שומר שינויים...' : 'שמור שינויים'}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="text-gray-600 hover:text-red-600 transition-colors duration-300 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  מחק חשבון
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default withAuth(Settings);
