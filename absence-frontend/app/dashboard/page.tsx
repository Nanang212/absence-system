'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clockIn, clockOut, getTodayStatus, User } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [hasClockedIn, setHasClockedIn] = useState(false);
  const [hasClockedOut, setHasClockedOut] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Fetch today's status
    fetchTodayStatus(parsedUser.email);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const fetchTodayStatus = async (email: string) => {
    try {
      setStatusLoading(true);
      const status = await getTodayStatus(email);
      setHasClockedIn(status.hasClockedIn);
      setHasClockedOut(status.hasClockedOut);
    } catch (err) {
      console.error('Failed to fetch today status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const getLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(new Error('Unable to retrieve location'));
        }
      );
    });
  };

  const handleClockIn = async () => {
    if (!user) return;
    
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const location = await getLocation();
      const result = await clockIn(user.email, user.password || '', location.latitude, location.longitude);
      
      if (result.ok && result.attendance) {
        setMessage(`Berhasil clock in! ${result.attendance.comment}`);
        setHasClockedIn(true); // Update status
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clock in gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOutClick = () => {
    setShowNotesModal(true);
    setNotes('');
  };

  const handleClockOutSubmit = async () => {
    if (!user) return;
    
    setError('');
    setMessage('');
    setLoading(true);
    setShowNotesModal(false);

    try {
      const location = await getLocation();
      const result = await clockOut(user.email, user.password || '', notes, location.latitude, location.longitude);
      
      if (result.ok && result.attendance) {
        setMessage(`Berhasil clock out! ${result.attendance.comment}`);
        setNotes('');
        setHasClockedOut(true); // Update status
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clock out gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sistem Absensi</h1>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/attendance')}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Riwayat Absensi
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-gray-800 mb-2 font-mono">
              {formattedTime}
            </div>
            <div className="text-lg text-gray-600">
              {formattedDate}
            </div>
          </div>

          <div className="flex justify-center gap-6 mb-6">
            <button
              onClick={handleClockIn}
              disabled={loading || statusLoading || hasClockedIn}
              className="group relative"
            >
              <div className={`w-40 h-40 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                hasClockedIn 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-br from-green-500 to-emerald-600 hover:shadow-3xl hover:scale-105'
              } ${loading || statusLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-white mx-auto mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <div className="text-white text-lg font-bold">
                    Clock In
                  </div>
                  {hasClockedIn && (
                    <div className="text-white text-xs mt-1">✓ Sudah absen</div>
                  )}
                </div>
              </div>
            </button>

            <button
              onClick={handleClockOutClick}
              disabled={loading || statusLoading}
              className="group relative"
            >
              <div className={`w-40 h-40 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                hasClockedOut 
                  ? 'bg-gradient-to-br from-orange-500 to-amber-600 hover:shadow-3xl hover:scale-105' 
                  : 'bg-gradient-to-br from-red-500 to-rose-600 hover:shadow-3xl hover:scale-105'
              } ${loading || statusLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-white mx-auto mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <div className="text-white text-lg font-bold">
                    Clock Out
                  </div>
                  {hasClockedOut && (
                    <div className="text-white text-xs mt-1">🔄 Update</div>
                  )}
                </div>
              </div>
            </button>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center mb-4">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center mb-4">
              {error}
            </div>
          )}

          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Instruksi:</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Klik tombol hijau untuk Clock In (masuk)
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Klik tombol merah untuk Clock Out (keluar)
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Saat Clock Out, Anda akan diminta mengisi catatan pekerjaan
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Anda hanya bisa clock in dan out sekali per hari
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Lokasi Anda akan otomatis tercatat saat absen
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Jam kerja: 08:00 - 17:00
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Catatan Clock Out</h3>
            <p className="text-sm text-gray-600 mb-4">
              Silakan isi catatan pekerjaan yang telah Anda selesaikan hari ini:
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Menyelesaikan laporan bulanan, meeting dengan klien, dll."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 resize-none"
              rows={5}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowNotesModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleClockOutSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Clock Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
