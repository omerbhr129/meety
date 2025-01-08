import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { decryptData } from '../utils/encryption';
import { verifyOTP, resendOTP } from '../services/api';

export default function OTPVerification() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (router.query.uid) {
      try {
        const decryptedUserId = decryptData(router.query.uid as string);
        setUserId(decryptedUserId);
      } catch (error) {
        setError('Invalid verification link');
        console.log('Invalid verification link');
        // Optionally redirect to login page after a delay
        setTimeout(() => router.push('/'), 3000);
      }
    }
  }, [router.query.uid]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setError('');
    setLoading(true);

    try {
      const data = await verifyOTP(userId, otp);
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה באימות הקוד');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!userId) return;
    setError('');
    setLoading(true);

    try {
      const data = await resendOTP(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת הקוד');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">אימות חשבון</h2>
      <p className="text-gray-600 mb-4 text-center">
        קוד אימות נשלח ל-{userId}
      </p>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="הזן קוד אימות"
            className="w-full p-3 border rounded-lg text-center text-2xl tracking-widest"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="text-red-500 text-center">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'מאמת...' : 'אמת קוד'}
        </button>

        <button
          type="button"
          onClick={handleResendOTP}
          disabled={loading}
          className="w-full text-blue-600 p-3 rounded-lg hover:text-blue-700 disabled:opacity-50"
        >
          שלח קוד חדש
        </button>
      </form>
    </div>
  );
} 