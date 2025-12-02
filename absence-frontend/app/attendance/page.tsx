'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { getAttendanceList, type AttendanceListItem } from '@/lib/api';
import * as XLSX from 'xlsx';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rowData, setRowData] = useState<AttendanceListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Date filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const gridRef = useRef<AgGridReact>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
    
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, [router]);

  // Load data when dates change or on mount
  useEffect(() => {
    if (user && startDate && endDate) {
      loadData();
    }
  }, [user, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      const response = await getAttendanceList(user.email, startDate, endDate);
      setRowData(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!user || rowData.length === 0) {
      setError('Tidak ada data untuk diexport');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for Excel
      const excelData = rowData.map((record, index) => {
        const date = new Date(record.date);
        const formattedDate = date.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        
        const formatTime = (isoString: string | null) => {
          if (!isoString) return '-';
          return new Date(isoString).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
        };
        
        return {
          'No': index + 1,
          'Tanggal': formattedDate,
          'Email': record.email,
          'Jam Masuk': formatTime(record.clockIn),
          'Komentar Masuk': record.clockInComment || '-',
          'Jam Keluar': formatTime(record.clockOut),
          'Komentar Keluar': record.clockOutComment || '-',
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 25 },  // Tanggal
        { wch: 25 },  // Email
        { wch: 12 },  // Jam Masuk
        { wch: 25 },  // Komentar Masuk
        { wch: 12 },  // Jam Keluar
        { wch: 25 },  // Komentar Keluar
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Absensi');

      // Generate filename with date range
      const filename = `Absensi_${user.email}_${startDate}_to_${endDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      
      setSuccessMessage('Data berhasil diexport ke Excel!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export gagal');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Format date and time
  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Column definitions
  const columnDefs: ColDef<AttendanceListItem>[] = useMemo(() => [
    {
      headerName: 'No',
      valueGetter: 'node.rowIndex + 1',
      width: 70,
      pinned: 'left',
      enableRowGroup: false, // Jangan bisa di-group
    },
    {
      headerName: 'Tanggal',
      field: 'date',
      width: 200,
      pinned: 'left',
      valueFormatter: (params) => formatDate(params.value),
      enableRowGroup: true, // Bisa di-group berdasarkan tanggal
      rowGroup: false,
    },
    {
      headerName: 'Email',
      field: 'email',
      width: 250,
      enableRowGroup: true, // Bisa di-group berdasarkan email
      rowGroup: false,
    },
    {
      headerName: 'Clock In',
      field: 'clockIn',
      width: 180,
      valueFormatter: (params) => formatDateTime(params.value),
      enableRowGroup: false,
    },
    {
      headerName: 'Komentar In',
      field: 'clockInComment',
      width: 180,
      valueFormatter: (params) => params.value || '-',
      enableRowGroup: true, // Bisa di-group berdasarkan status (terlambat/tepat waktu)
      rowGroup: false,
    },
    {
      headerName: 'Clock Out',
      field: 'clockOut',
      width: 180,
      valueFormatter: (params) => formatDateTime(params.value),
      enableRowGroup: false,
    },
    {
      headerName: 'Komentar Out',
      field: 'clockOutComment',
      width: 180,
      valueFormatter: (params) => params.value || '-',
      enableRowGroup: true, // Bisa di-group berdasarkan status pulang
      rowGroup: false,
    },
  ], []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    enableRowGroup: true, // Enable row group untuk semua kolom
  }), []);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Riwayat Absensi</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </div>
          
          <div className="text-gray-600 mb-4">
            <p>User: <span className="font-semibold">{user.email}</span></p>
          </div>

          {/* Date Filter */}
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Filter'}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={loading || rowData.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}
        </div>

        {/* AG Grid Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              animateRows={true}
              rowSelection="single"
              rowGroupPanelShow="always"
              groupDisplayType="multipleColumns"
              suppressAggFuncInHeader={true}
            />
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Total Records: <span className="font-semibold">{rowData.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
