/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Teacher, AttendanceRecord, MonthlySummary } from '../types';
import { 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  ChevronDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  FileText,
  Building,
  User,
  ArrowUpRight,
  Info
} from 'lucide-react';

interface MonthlyReportProps {
  teachers: Teacher[];
  records: AttendanceRecord[];
}

const INDONESIAN_MONTHS = [
  { value: '01', name: 'Januari' },
  { value: '02', name: 'Februari' },
  { value: '03', name: 'Maret' },
  { value: '04', name: 'April' },
  { value: '05', name: 'Mei' },
  { value: '06', name: 'Juni' },
  { value: '07', name: 'Juli' },
  { value: '08', name: 'Agustus' },
  { value: '09', name: 'September' },
  { value: '10', name: 'Oktber' },
  { value: '11', name: 'November' },
  { value: '12', name: 'Desember' }
];

export default function MonthlyReport({ teachers, records }: MonthlyReportProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState('06'); // Default to June 2026 since we have rich seeded data there
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Print Modal Preview state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // School profile state
  const [schoolProfile, setSchoolProfile] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('school_profile_data');
    if (stored) {
      try {
        setSchoolProfile(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading school profile in report', e);
      }
    }
  }, [isPrintModalOpen]); // Reload whenever the print modal opens

  const schoolName = schoolProfile?.schoolName || 'MTsS MIFTAHUL HUDA';
  const schoolAddress = schoolProfile?.address || 'JL. TUMBRO RAYA DESA RAWA JAYA KEC. TABIR SELATAN KAB. MERANGIN KODE POS 37354';
  const schoolPhone = schoolProfile?.phone || '+62 | 81366866292';
  const schoolEmail = schoolProfile?.email || 'miftahulhuda97@gmail.com';
  const schoolNpsn = schoolProfile?.npsn || '10508256';
  const schoolPrincipal = schoolProfile?.principalName || 'SLAMET, S.Pd., M.H.';
  const schoolPrincipalNip = schoolProfile?.principalNip || '197206052003121005';
  const schoolSignature = schoolProfile?.signatureImage || ''; // base64 data URL

  // Filter out active teachers for the report
  const activeTeachers = useMemo(() => {
    return teachers.filter(t => t.status === 'aktif');
  }, [teachers]);

  // Generate unique years present in records + current year
  const availableYears = useMemo(() => {
    const years = new Set(records.map(r => r.date.split('-')[0]));
    years.add('2026');
    return Array.from(years).sort().reverse();
  }, [records]);

  // Calculate monthly stats per teacher
  const monthlyStats: MonthlySummary[] = useMemo(() => {
    const yearMonthStr = `${selectedYear}-${selectedMonth}`;
    
    // Filter records belonging to selected month and year
    const monthlyRecords = records.filter(r => r.date.startsWith(yearMonthStr));
    
    // Count of unique active workdays recorded in this month in the database
    const workdaysInDb = Array.from(new Set(monthlyRecords.map(r => r.date))).length;
    
    // Default fallback workdays in a typical month if zero records are found
    const displayDays = workdaysInDb || 20;

    return activeTeachers.map(teacher => {
      const teacherRecords = monthlyRecords.filter(r => r.teacherId === teacher.id);
      
      let hadir = 0;
      let terlambat = 0;
      let izin = 0;
      let sakit = 0;
      let alpa = 0;
      let libur = 0;
      
      teacherRecords.forEach(r => {
        if (r.status === 'hadir') hadir++;
        else if (r.status === 'terlambat') terlambat++;
        else if (r.status === 'izin') izin++;
        else if (r.status === 'sakit') sakit++;
        else if (r.status === 'alpa') alpa++;
        else if (r.status === 'libur') libur++;
      });
      
      // Teachers might not have entries for every single recorded day.
      // Unrecorded days are treated as alpa/pending, but let's count recorded days for this teacher
      const totalTeacherDays = teacherRecords.length;
      
      // Calculate presence rate: (Hadir + Terlambat) / (Hadir + Terlambat + Alpa) 
      // Note: Sick/Excused/Holidays are officially sanctioned absences and typically excluded from negative penalties
      const positivePresence = hadir + terlambat;
      const negativeAbsence = alpa;
      const divisor = positivePresence + negativeAbsence;
      
      let attendanceRate = 100;
      if (divisor > 0) {
        attendanceRate = Math.round((positivePresence / divisor) * 100);
      } else if (totalTeacherDays === 0) {
        attendanceRate = 0; // No logs recorded at all
      }

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        nip: teacher.nip,
        subject: teacher.subject,
        hadir,
        terlambat,
        izin,
        sakit,
        alpa,
        libur,
        totalDays: totalTeacherDays,
        attendanceRate
      };
    });
  }, [activeTeachers, records, selectedMonth, selectedYear]);

  // Filter stats by search query
  const filteredStats = useMemo(() => {
    if (!searchQuery.trim()) return monthlyStats;
    return monthlyStats.filter(s => 
      s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.nip.includes(searchQuery)
    );
  }, [monthlyStats, searchQuery]);

  // Calculate overall average stats of the school for the header summary
  const schoolAverage = useMemo(() => {
    if (monthlyStats.length === 0) return { attendanceRate: 0, lateRate: 0 };
    
    const totalRate = monthlyStats.reduce((sum, s) => sum + s.attendanceRate, 0);
    const avgPresence = Math.round(totalRate / monthlyStats.length);
    
    const totalDaysRecorded = monthlyStats.reduce((sum, s) => sum + s.totalDays, 0);
    const totalLate = monthlyStats.reduce((sum, s) => sum + s.terlambat, 0);
    const lateRate = totalDaysRecorded > 0 ? Math.round((totalLate / totalDaysRecorded) * 100) : 0;

    return {
      attendanceRate: avgPresence,
      lateRate
    };
  }, [monthlyStats]);

  // Find current teacher's monthly stats if selected
  const selectedTeacherStats = useMemo(() => {
    if (selectedTeacherId === 'all') return null;
    return monthlyStats.find(s => s.teacherId === selectedTeacherId) || null;
  }, [monthlyStats, selectedTeacherId]);

  // Daily records of selected teacher in this month
  const selectedTeacherRecords = useMemo(() => {
    if (selectedTeacherId === 'all') return [];
    const yearMonthStr = `${selectedYear}-${selectedMonth}`;
    return records
      .filter(r => r.teacherId === selectedTeacherId && r.date.startsWith(yearMonthStr))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records, selectedTeacherId, selectedMonth, selectedYear]);

  // Helper to format Indonesian date beautifully
  const formatIndonesianLocalDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Helper to get signee location dynamically
  const getSigneeLocation = () => {
    return 'Rawa Jaya';
  };

  // Helper: Export data to formal CSV (compatible with Excel)
  const handleExportCSV = () => {
    const monthName = INDONESIAN_MONTHS.find(m => m.value === selectedMonth)?.name || selectedMonth;
    
    // Header columns in Indonesian - Aligning columns perfectly
    const csvContent = [
      ['LAPORAN REKAPITULASI ABSENSI GURU BULANAN', '', '', '', '', '', '', '', '', ''],
      [`Bulan: ${monthName} ${selectedYear}`, '', '', '', '', '', '', '', '', ''],
      [`Madrasah: ${schoolName}`, '', '', '', '', '', '', '', '', ''],
      [],
      ['No', 'Nama Guru', 'NIP', 'Mata Pelajaran', 'Hadir', 'Izin', 'Sakit', 'Alpa', 'Total Hari Kerja', 'Persentase Kehadiran (%)'],
      ...filteredStats.map((s, index) => [
        index + 1,
        s.teacherName,
        s.nip ? `="${s.nip}"` : '-', // Excel formulation to preserve leading zeros in NIP
        s.subject,
        s.hadir,
        s.izin,
        s.sakit,
        s.alpa,
        s.totalDays,
        `${s.attendanceRate}%`
      ])
    ];

    // Build standard CSV formatting with sep=; directive for perfect Excel parsing
    // and safe Excel character set UTF-8 with BOM (\uFEFF)
    const sepDirective = 'sep=;\n';
    const csvBody = csvContent.map(row => row.map(cell => {
      const stringCell = cell !== undefined ? String(cell) : '';
      // Escape cell if it contains semicolon, comma, newline or double-quote
      if (stringCell.includes(';') || stringCell.includes(',') || stringCell.includes('\n') || stringCell.includes('"')) {
        return `"${stringCell.replace(/"/g, '""')}"`;
      }
      return stringCell;
    }).join(';')).join('\n');

    const csvString = '\uFEFF' + sepDirective + csvBody;

    // Create anchor link and download automatically
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Absen_Guru_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Open beautiful official document view and trigger printing
  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const executePrint = () => {
    window.print();
  };

  const activeMonthName = INDONESIAN_MONTHS.find(m => m.value === selectedMonth)?.name || selectedMonth;

  return (
    <div className="space-y-6" id="monthly-report-container">
      {/* Control Card with Selectors */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4" id="monthly-report-controls">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Periode:</h3>
            </div>
            
            <div className="flex gap-2">
              {/* Month selector */}
              <div className="relative">
                <select
                  id="select-month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none hover:bg-slate-100 transition cursor-pointer"
                >
                  {INDONESIAN_MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Year selector */}
              <div className="relative">
                <select
                  id="select-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none hover:bg-slate-100 transition cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pilih Guru:</h3>
            </div>
            
            <div className="relative">
              <select
                id="select-teacher"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none hover:bg-slate-100 transition cursor-pointer min-w-[200px]"
              >
                <option value="all">Semua Guru (Rekapitulasi)</option>
                {activeTeachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2.5" id="export-actions">
          <button
            id="btn-export-excel"
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Unduh Excel
          </button>
          
          <button
            id="btn-print-pdf"
            onClick={handlePrint}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF / Laporan Resmi
          </button>
        </div>
      </div>

      {/* Mini Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="monthly-mini-stats">
        {/* Attendance Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Kehadiran</span>
            <span className="text-xl font-extrabold text-slate-800 block mt-0.5">{schoolAverage.attendanceRate}%</span>
          </div>
        </div>

        {/* Help Tip */}
        <div className="bg-indigo-50/45 border border-indigo-200 p-4 rounded-2xl flex items-center gap-3">
          <Info className="w-5 h-5 text-indigo-500 shrink-0" />
          <div className="text-[11px] text-indigo-800 font-medium">
            <strong>Catatan Formula:</strong> Persentase kehadiran dihitung berdasarkan <code>Hadir / (Hadir + Alpa)</code>. Izin, Sakit, &amp; Libur tidak dihitung sebagai pelanggaran.
          </div>
        </div>
      </div>

      {/* Report Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" id="report-table-card">
        {selectedTeacherId === 'all' ? (
          <>
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Rekap Bulanan Guru — {activeMonthName} {selectedYear}
              </h3>
              
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="search-report-input"
                  type="text"
                  placeholder="Cari guru dalam rekap bulanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 focus:border-indigo-600 rounded-lg text-xs font-semibold outline-none text-slate-700"
                />
              </div>
            </div>

            {filteredStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="report-table">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Nama Guru / NIP</th>
                      <th className="px-4 py-4 text-center">Hadir</th>
                      <th className="px-4 py-4 text-center">Izin</th>
                      <th className="px-4 py-4 text-center">Sakit</th>
                      <th className="px-4 py-4 text-center">Alpa</th>
                      <th className="px-4 py-4 text-center">Libur</th>
                      <th className="px-4 py-4 text-center">Total Hari Kerja</th>
                      <th className="px-6 py-4 text-right">Tingkat Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {filteredStats.map((stat) => (
                      <tr key={stat.teacherId} className="hover:bg-slate-50/30 transition">
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-bold text-slate-800 text-sm block leading-tight">{stat.teacherName}</span>
                            <span className="text-[10px] text-slate-400 block mt-1 font-mono font-bold">NIP {stat.nip} • {stat.subject}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-slate-700 font-bold">{stat.hadir}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{stat.izin}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{stat.sakit}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={stat.alpa > 0 ? 'text-rose-600 font-extrabold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md' : 'text-slate-400'}>
                            {stat.alpa}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={stat.libur > 0 ? 'text-violet-600 font-extrabold bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-md' : 'text-slate-400'}>
                            {stat.libur}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-slate-500 font-mono font-bold">{stat.totalDays}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-sm font-extrabold ${
                              stat.attendanceRate >= 95 
                                ? 'text-emerald-600' 
                                : stat.attendanceRate >= 85 
                                  ? 'text-indigo-600' 
                                  : 'text-rose-600'
                            }`}>
                              {stat.attendanceRate}%
                            </span>
                            <div className="w-20 bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  stat.attendanceRate >= 95 
                                    ? 'bg-emerald-500' 
                                    : stat.attendanceRate >= 85 
                                      ? 'bg-indigo-500' 
                                      : 'bg-rose-500'
                                }`} 
                                style={{ width: `${stat.attendanceRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center" id="no-records-found">
                <h3 className="text-xs font-bold text-slate-800 uppercase">Tidak ada rekap data</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">Belum ada catatan absen di bulan ini atau tidak ada guru terdaftar.</p>
              </div>
            )}
          </>
        ) : selectedTeacherStats ? (
          <div>
            {/* Individual Mini Profile Banner */}
            <div className="p-6 bg-indigo-50/45 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 tracking-wider uppercase">Laporan Kehadiran Guru (Arsip Individu)</span>
                <h2 className="text-base font-black text-slate-800 tracking-tight uppercase mt-0.5">{selectedTeacherStats.teacherName}</h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1.5">
                  NIP {selectedTeacherStats.nip} • {selectedTeacherStats.subject}
                </p>
              </div>

              {/* Mini stats counters for the selected teacher */}
              <div className="flex flex-wrap gap-2 text-center text-xs font-bold text-slate-700">
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 min-w-[56px]">
                  <span className="block text-[9px] font-bold text-emerald-600 uppercase">Hadir</span>
                  <span className="text-base font-extrabold text-slate-800">{selectedTeacherStats.hadir}</span>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 min-w-[56px]">
                  <span className="block text-[9px] font-bold text-amber-600 uppercase">Telat</span>
                  <span className="text-base font-extrabold text-slate-800">{selectedTeacherStats.terlambat}</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 min-w-[56px]">
                  <span className="block text-[9px] font-bold text-blue-600 uppercase">Izin</span>
                  <span className="text-base font-extrabold text-slate-800">{selectedTeacherStats.izin}</span>
                </div>
                <div className="bg-teal-50 border border-teal-100 rounded-lg px-3 py-1.5 min-w-[56px]">
                  <span className="block text-[9px] font-bold text-teal-600 uppercase">Sakit</span>
                  <span className="text-base font-extrabold text-slate-800">{selectedTeacherStats.sakit}</span>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5 min-w-[56px]">
                  <span className="block text-[9px] font-bold text-rose-600 uppercase">Alpa</span>
                  <span className="text-base font-extrabold text-slate-800">{selectedTeacherStats.alpa}</span>
                </div>
                <div className="bg-indigo-50 border border-indigo-150 rounded-lg px-4 py-1.5 min-w-[90px] flex flex-col justify-center">
                  <span className="block text-[9px] font-bold text-indigo-600 uppercase">Tingkat Hadir</span>
                  <span className="text-base font-black text-indigo-700 leading-tight">{selectedTeacherStats.attendanceRate}%</span>
                </div>
              </div>
            </div>

            {/* Daily Records for the selected teacher */}
            {selectedTeacherRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4 w-12 text-center">No</th>
                      <th className="px-6 py-4">Hari &amp; Tanggal</th>
                      <th className="px-6 py-4 text-center">Waktu Absen</th>
                      <th className="px-6 py-4 text-center">Status Kehadiran</th>
                      <th className="px-6 py-4">Catatan / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {selectedTeacherRecords.map((record, index) => {
                      let badgeClass = '';
                      let statusLabel = '';
                      if (record.status === 'hadir') {
                        badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        statusLabel = 'Hadir Tepat Waktu';
                      } else if (record.status === 'terlambat') {
                        badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        statusLabel = 'Hadir';
                      } else if (record.status === 'izin') {
                        badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                        statusLabel = 'Izin Resmi';
                      } else if (record.status === 'sakit') {
                        badgeClass = 'bg-teal-50 text-teal-700 border-teal-200';
                        statusLabel = 'Sakit';
                      } else if (record.status === 'alpa') {
                        badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                        statusLabel = 'Alpa';
                      }

                      return (
                        <tr key={record.id} className="hover:bg-slate-50/30 transition">
                          <td className="px-6 py-4 text-center text-slate-400 font-mono font-bold">{index + 1}</td>
                          <td className="px-6 py-4 text-slate-800 font-bold">{formatIndonesianLocalDate(record.date)}</td>
                          <td className="px-6 py-4 text-center font-mono font-bold text-slate-700">
                            {record.checkInTime ? `${record.checkInTime} WIB` : '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium italic">
                            {record.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <h3 className="text-xs font-bold text-slate-800 uppercase">Tidak ada log absensi harian</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">Belum ada catatan absensi harian yang terekam untuk guru ini di periode ini.</p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Official Print Modal (Formal Administrative Layout) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-955/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="print-preview-modal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 border border-slate-200 overflow-hidden print:shadow-none print:border-none print:my-0 flex flex-col max-h-[90vh] print:max-h-none">
            {/* Modal Controls - Hidden during printer output */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                Draf Cetak Laporan Resmi Kehadiran Guru
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={executePrint}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Sekarang
                </button>
              </div>
            </div>

            {/* Document Body (Strict Indonesian Administrative Format) */}
            <div className="p-10 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible" id="formal-document">
              {/* Kop Surat (Formal Letterhead with Symmetric Dual Logo) */}
              <div className="border-b-4 border-double border-slate-800 pb-4 text-center mb-6 relative min-h-[96px] flex flex-col justify-center">
                {/* Logo Kiri */}
                <div className="absolute left-2 top-1 w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-300 hidden sm:flex print:flex overflow-hidden shrink-0">
                  {schoolProfile?.logoImage ? (
                    <img src={schoolProfile.logoImage} alt="Logo Kiri" className="w-full h-full object-contain" />
                  ) : (
                    <Building className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                {/* Logo Kanan */}
                <div className="absolute right-2 top-1 w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-300 hidden sm:flex print:flex overflow-hidden shrink-0">
                  {schoolProfile?.logoRightImage ? (
                    <img src={schoolProfile.logoRightImage} alt="Logo Kanan" className="w-full h-full object-contain" />
                  ) : (
                    <Building className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                {/* Kop Text Content */}
                <h1 className="text-xs font-bold uppercase tracking-wide text-slate-900 leading-tight">
                  {schoolProfile?.foundationName || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'}
                </h1>
                <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wide leading-tight mt-0.5">
                  KANTOR KEMENTERIAN AGAMA KABUPATEN MERANGIN
                </h2>
                <h3 className="text-base font-black uppercase text-slate-950 tracking-wider leading-tight mt-1">
                  {schoolName}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">
                  NSM : 121215020018 &nbsp;&nbsp;&nbsp;&nbsp; NPSN : {schoolNpsn} &nbsp;&nbsp;&nbsp;&nbsp; E-mail : {schoolEmail}
                </p>
                <p className="text-[10px] text-slate-600 font-bold tracking-wide mt-0.5 uppercase">
                  {schoolAddress}
                </p>
              </div>

              {/* Document Title */}
              <div className="text-center mb-6">
                <h3 className="text-base font-black text-slate-900 uppercase underline decoration-1 underline-offset-4">
                  {selectedTeacherId === 'all' 
                    ? 'LAPORAN REKAPITULASI KEHADIRAN GURU' 
                    : 'LAPORAN DETAIL ABSENSI HARIAN GURU'
                  }
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 font-semibold">
                  Periode: {activeMonthName} {selectedYear}
                </p>
              </div>

              {/* Meta information */}
              <div className="grid grid-cols-2 text-xs text-slate-700 mb-4 font-medium">
                <div>
                  <p>Klasifikasi: Laporan Kepegawaian</p>
                  <p>Tanggal Cetak: {currentDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <p>Status Data: Final (Sistem Elektronik)</p>
                  <p>Administrator: Staf Administrasi Sekolah</p>
                </div>
              </div>

              {/* Individual Teacher Profile Meta if single teacher selected */}
              {selectedTeacherId !== 'all' && selectedTeacherStats && (
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Nama Guru</span>
                      <span className="text-xs font-bold text-slate-900">{selectedTeacherStats.teacherName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Mata Pelajaran</span>
                      <span className="text-xs font-bold text-slate-900">{selectedTeacherStats.subject}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">NIP</span>
                      <span className="text-xs font-mono font-bold text-slate-900">{selectedTeacherStats.nip}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Tingkat Kehadiran</span>
                      <span className="text-xs font-bold text-indigo-600 font-mono">{selectedTeacherStats.attendanceRate}%</span>
                    </div>
                    <div className="col-span-2 grid grid-cols-6 gap-2 border-t border-slate-200 pt-2 mt-1 text-center">
                      <div className="bg-white border border-slate-200 rounded p-1">
                        <span className="block text-[8px] text-slate-400 font-bold uppercase">Hadir</span>
                        <span className="text-xs font-extrabold text-slate-800">{selectedTeacherStats.hadir}</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-1">
                        <span className="block text-[8px] text-slate-400 font-bold uppercase">Telat</span>
                        <span className="text-xs font-extrabold text-slate-800">{selectedTeacherStats.terlambat}</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-1">
                        <span className="block text-[8px] text-slate-400 font-bold uppercase">Izin</span>
                        <span className="text-xs font-extrabold text-slate-800">{selectedTeacherStats.izin}</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-1">
                        <span className="block text-[8px] text-slate-400 font-bold uppercase">Sakit</span>
                        <span className="text-xs font-extrabold text-slate-800">{selectedTeacherStats.sakit}</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-1">
                        <span className="block text-[8px] text-slate-400 font-bold uppercase">Alpa</span>
                        <span className="text-xs font-extrabold text-slate-800">{selectedTeacherStats.alpa}</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-1">
                        <span className="block text-[8px] text-slate-400 font-bold uppercase">Libur</span>
                        <span className="text-xs font-extrabold text-slate-800">{selectedTeacherStats.libur}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Table Body */}
              {selectedTeacherId === 'all' ? (
                /* Main Collective Report Table */
                <table className="w-full text-left text-[11px] border-collapse border border-slate-300 mb-8">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                      <th className="border border-slate-300 px-3 py-2 text-center w-8">No</th>
                      <th className="border border-slate-300 px-3 py-2">Nama Guru</th>
                      <th className="border border-slate-300 px-3 py-2">NIP</th>
                      <th className="border border-slate-300 px-3 py-2">Mata Pelajaran</th>
                      <th className="border border-slate-300 px-2 py-2 text-center">H</th>
                      <th className="border border-slate-300 px-2 py-2 text-center">I</th>
                      <th className="border border-slate-300 px-2 py-2 text-center">S</th>
                      <th className="border border-slate-300 px-2 py-2 text-center">A</th>
                      <th className="border border-slate-300 px-2 py-2 text-center">L</th>
                      <th className="border border-slate-300 px-3 py-2 text-center" style={{ width: '130px' }}>Tanda Tangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-slate-800">
                    {filteredStats.map((stat, index) => (
                      <tr key={stat.teacherId}>
                        <td className="border border-slate-300 px-3 py-1.5 text-center font-mono">{index + 1}</td>
                        <td className="border border-slate-300 px-3 py-1.5 font-bold">{stat.teacherName}</td>
                        <td className="border border-slate-300 px-3 py-1.5 font-mono">{stat.nip}</td>
                        <td className="border border-slate-300 px-3 py-1.5">{stat.subject}</td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{stat.hadir}</td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{stat.izin}</td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{stat.sakit}</td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-mono text-rose-700 font-bold bg-rose-50/20">{stat.alpa}</td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-mono text-violet-700 font-bold bg-violet-50/10">{stat.libur}</td>
                        <td className="border border-slate-300 px-3 py-1 text-left font-mono">
                          {index % 2 === 0 ? (
                            <div className="pl-1 text-[10px] text-slate-800 font-medium">
                              {index + 1}. ...........................
                            </div>
                          ) : (
                            <div className="pl-12 text-[10px] text-slate-800 font-medium">
                              {index + 1}. ...........................
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : selectedTeacherStats ? (
                /* Individual Teacher Daily Records Table */
                <table className="w-full text-left text-[11px] border-collapse border border-slate-300 mb-8">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                      <th className="border border-slate-300 px-3 py-2 text-center w-8">No</th>
                      <th className="border border-slate-300 px-3 py-2">Hari &amp; Tanggal</th>
                      <th className="border border-slate-300 px-3 py-2 text-center">Waktu Absen</th>
                      <th className="border border-slate-300 px-3 py-2 text-center">Status Kehadiran</th>
                      <th className="border border-slate-300 px-3 py-2">Catatan / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-slate-800">
                    {selectedTeacherRecords.length > 0 ? (
                      selectedTeacherRecords.map((record, index) => {
                        let statusLabel = '';
                        if (record.status === 'hadir') statusLabel = 'Hadir Tepat Waktu';
                        else if (record.status === 'terlambat') statusLabel = 'Terlambat';
                        else if (record.status === 'izin') statusLabel = 'Izin';
                        else if (record.status === 'sakit') statusLabel = 'Sakit';
                        else if (record.status === 'alpa') statusLabel = 'Alpa';

                        return (
                          <tr key={record.id}>
                            <td className="border border-slate-300 px-3 py-1.5 text-center font-mono">{index + 1}</td>
                            <td className="border border-slate-300 px-3 py-1.5 font-bold">{formatIndonesianLocalDate(record.date)}</td>
                            <td className="border border-slate-300 px-3 py-1.5 text-center font-mono font-semibold">
                              {record.checkInTime ? `${record.checkInTime} WIB` : '-'}
                            </td>
                            <td className="border border-slate-300 px-3 py-1.5 text-center font-bold">
                              {statusLabel}
                            </td>
                            <td className="border border-slate-300 px-3 py-1.5 italic text-slate-500">
                              {record.notes || '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="border border-slate-300 px-3 py-8 text-center text-slate-400 italic">
                          Tidak ada data absensi harian untuk periode ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : null}

              {/* Legend Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 mb-8 flex flex-wrap gap-x-4 gap-y-1">
                <span className="font-bold">Keterangan Singkatan:</span>
                <span><strong>H:</strong> Hadir Tepat Waktu</span>
                <span><strong>T:</strong> Terlambat Masuk Kerja</span>
                <span><strong>I:</strong> Izin Resmi</span>
                <span><strong>S:</strong> Sakit (Ada Surat)</span>
                <span><strong>A:</strong> Alpa / Mangkir</span>
                <span><strong>L:</strong> Libur / Cuti Bersama</span>
              </div>

              {/* Signature Blocks - Only Headmaster on the right-hand side */}
              <div className="grid grid-cols-2 text-xs text-slate-800 font-medium" id="signature-block">
                <div>{/* Left column is kept empty for a balanced right-hand layout */}</div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-left w-64">
                    <p>{getSigneeLocation()}, {currentDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="font-bold mt-1">Kepala Madrasah,</p>
                    
                    {/* Digital Signature & Stamp Overlay */}
                    <div className="h-24 flex items-center relative my-1">
                      {schoolSignature ? (
                        <img 
                          src={schoolSignature} 
                          alt="Tanda Tangan & Stempel" 
                          className="h-20 object-contain opacity-95 mix-blend-multiply"
                        />
                      ) : (
                        <div className="h-20" /> // Spacing fallback if signature is empty
                      )}
                    </div>

                    <p className="font-extrabold text-slate-950 underline decoration-1">{schoolPrincipal}</p>
                    <p className="font-mono text-[10px] text-slate-400">NIP. {schoolPrincipalNip}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
