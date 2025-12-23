import React, { useEffect, useState, CSSProperties } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AttendanceRecord {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  date: string;
  clockIn: string;
  clockOut?: string;
  status: string;
  workingHours: number;
  location?: string;
  notes?: string;
}

export const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const API_BASE_URL = 'http://localhost:5001/api';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      loadAttendanceRecords();
    }
  }, [user]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadAttendanceRecords = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to load attendance records');
      }

      const data = await response.json();
      setAttendanceRecords(data.data);

      // Find today's record
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = data.data.find((record: AttendanceRecord) => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === today;
      });
      setCurrentRecord(todayRecord || null);
    } catch (error) {
      console.error('Error loading attendance records:', error);
      setAttendanceRecords([]);
      setCurrentRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (): Promise<void> => {
    if (!user) {
      alert('Please log in to clock in.');
      return;
    }
    if (currentRecord && !currentRecord.clockOut) {
      alert('You are already clocked in for today.');
      return;
    }

    setClockingIn(true);
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/clock-in`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ location: 'Office' }) // You can get location from geolocation if needed
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clock in');
      }

      const data = await response.json();
      await loadAttendanceRecords(); // Reload records
    } catch (error: any) {
      console.error('Clock in error:', error);
      alert(error.message || 'Failed to clock in');
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async (): Promise<void> => {
    if (!currentRecord || currentRecord.clockOut) {
      alert('You must clock in first before clocking out.');
      return;
    }

    setClockingOut(true);
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/clock-out`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes: '' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clock out');
      }

      const data = await response.json();
      await loadAttendanceRecords(); // Reload records
    } catch (error: any) {
      console.error('Clock out error:', error);
      alert(error.message || 'Failed to clock out');
    } finally {
      setClockingOut(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'present': return '#4CAF50';
      case 'absent': return '#f44336';
      case 'late': return '#FF9800';
      case 'half-day': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const formatWorkingHours = (hours: number): string => {
    if (hours === 0) return '-';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.noRecords}>
          <h2>Please log in to access attendance tracking</h2>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.noRecords}>
          <h2>Loading attendance records...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Attendance Tracker</h1>
      <div style={styles.clockSection}>
        <div style={styles.currentTime}>
          <h3>Current Time</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
            {currentTime.toLocaleTimeString()}
          </p>
          <p>{currentTime.toLocaleDateString()}</p>
        </div>
        <div style={styles.buttons}>
          <button
            onClick={handleClockIn}
            disabled={!!currentRecord || clockingIn}
            style={{
              ...styles.button,
              backgroundColor: !!currentRecord || clockingIn ? '#ccc' : '#4CAF50',
              opacity: !!currentRecord || clockingIn ? 0.5 : 1,
            }}
          >
            {clockingIn ? 'Clocking In...' : 'Clock In'}
          </button>
          <button
            onClick={handleClockOut}
            disabled={!currentRecord || !!currentRecord.clockOut || clockingOut}
            style={{
              ...styles.button,
              backgroundColor: !currentRecord || !!currentRecord.clockOut || clockingOut ? '#ccc' : '#f44336',
              opacity: !currentRecord || !!currentRecord.clockOut || clockingOut ? 0.5 : 1,
            }}
          >
            {clockingOut ? 'Clocking Out...' : 'Clock Out'}
          </button>
        </div>
        {currentRecord && (
          <div style={styles.status}>
            <p>Status: <span style={{ color: currentRecord.status === 'present' ? 'green' : 'blue' }}>{currentRecord.status}</span></p>
            <p>Clock In: {new Date(currentRecord.clockIn).toLocaleTimeString()}</p>
            {currentRecord.clockOut && <p>Clock Out: {new Date(currentRecord.clockOut).toLocaleTimeString()}</p>}
            {currentRecord.clockOut && <p>Working Hours: {formatWorkingHours(currentRecord.workingHours)}</p>}
          </div>
        )}
      </div>
      <div style={styles.tableContainer}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Attendance Records</h2>
        {attendanceRecords.length === 0 ? (
          <div style={styles.noRecords}>
            <p>No attendance records found. Start by clocking in!</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Clock In</th>
                <th style={styles.th}>Clock Out</th>
                <th style={styles.th}>Working Hours</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(record => (
                <tr key={record._id}>
                  <td style={styles.td}>{`${record.employee.firstName} ${record.employee.lastName}`}</td>
                  <td style={styles.td}>{new Date(record.date).toLocaleDateString()}</td>
                  <td style={styles.td}>{new Date(record.clockIn).toLocaleTimeString()}</td>
                  <td style={styles.td}>{record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '-'}</td>
                  <td style={styles.td}>{formatWorkingHours(record.workingHours)}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(record.status) }}>
                      {record.status.replace('-', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333',
  },
  clockSection: {
    marginBottom: '30px',
    padding: '25px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    backgroundColor: '#fafafa',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  currentTime: {
    textAlign: 'center',
    marginBottom: '25px',
    fontSize: '18px',
    color: '#555',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '25px',
    flexWrap: 'wrap',
  },
  button: {
    padding: '12px 24px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    minWidth: '120px',
  },
  status: {
    textAlign: 'center',
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #ddd',
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
  },
  th: {
    border: '1px solid #ddd',
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
    color: '#333',
  },
  td: {
    border: '1px solid #ddd',
    padding: '12px',
    color: '#555',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  noRecords: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontStyle: 'italic',
  },
};

export default Attendance;