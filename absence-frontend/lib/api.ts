const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface User {
  email: string;
  fullName?: string;
  password?: string; // Stored in session for remote swipe
}

export interface Attendance {
  id: number;
  email: string;
  type: 'IN' | 'OUT';
  timestamp: string;
  comment: string;
  createdAt: string;
}

export interface AttendanceListItem {
  email: string;
  date: string;
  clockIn: string | null;
  clockInComment: string | null;
  clockOut: string | null;
  clockOutComment: string | null;
}

export async function login(email: string, password: string): Promise<{ ok: boolean; user?: User; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const contentType = res.headers.get('content-type');
    
    // Check if response is JSON
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned invalid response. Make sure backend is running on port 3000.');
    }
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }
    
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Make sure backend is running on http://localhost:3000');
    }
    throw error;
  }
}

export async function getAttendanceList(
  email?: string,
  startDate?: string,
  endDate?: string
): Promise<{ ok: boolean; data: AttendanceListItem[] }> {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const url = `${API_URL}/attendance/list${params.toString() ? '?' + params.toString() : ''}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to fetch attendance list');
  }
  
  return res.json();
}

export async function clockIn(
  email: string,
  password: string,
  latitude?: number,
  longitude?: number
): Promise<{ ok: boolean; attendance: Attendance }> {
  try {
    const res = await fetch(`${API_URL}/attendance/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, latitude, longitude }),
    });
    
    const contentType = res.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned invalid response. Make sure backend is running on port 3000.');
    }
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Clock in failed');
    }
    
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Make sure backend is running on http://localhost:3000');
    }
    throw error;
  }
}

export async function clockOut(
  email: string,
  password: string,
  notes?: string,
  latitude?: number,
  longitude?: number
): Promise<{ ok: boolean; attendance: Attendance }> {
  try {
    const res = await fetch(`${API_URL}/attendance/clock-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, notes, latitude, longitude }),
    });
    
    const contentType = res.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned invalid response. Make sure backend is running on port 3000.');
    }
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Clock out failed');
    }
    
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Make sure backend is running on http://localhost:3000');
    }
    throw error;
  }
}

export async function getTodayStatus(email: string): Promise<{ ok: boolean; hasClockedIn: boolean; hasClockedOut: boolean }> {
  try {
    const res = await fetch(`${API_URL}/attendance/today-status?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const contentType = res.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned invalid response. Make sure backend is running on port 3000.');
    }
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to get today status');
    }
    
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Make sure backend is running on http://localhost:3000');
    }
    throw error;
  }
}
