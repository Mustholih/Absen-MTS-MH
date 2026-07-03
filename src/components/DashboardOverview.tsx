/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Teacher, AttendanceRecord, SchoolProfile } from '../types';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  ShieldAlert,
  Building2
} from 'lucide-react';

interface DashboardOverviewProps {
  teachers: Teacher[];
  records: AttendanceRecord[];
  onNavigate: (tab: string) => void;
  selectedDate: string;
  schoolProfile: SchoolProfile;
}

export default function DashboardOverview({ teachers, records, onNavigate, selectedDate, schoolProfile }: DashboardOverviewProps) {
  // 1. Calculate stats for the selected date (usually today)
  const statsToday = useMemo(() => {
    const activeTeachers = teachers.filter(t => t.status === 'aktif');
    const totalCount = activeTeachers.length;
    
    const recordsToday = records.filter(r => r.date === selectedDate);
    
    let hadir = 0;
    let terlambat = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;
    let libur = 0;
    
    recordsToday.forEach(r => {
      const teacher = activeTeachers.find(t => t.id === r.teacherId);
      if (!teacher) return; // skip inactive or deleted
      
      if (r.status === 'hadir') hadir++;
      else if (r.status === 'terlambat') terlambat++;
      else if (r.status === 'izin') izin++;
      else if (r.status === 'sakit') sakit++;
      else if (r.status === 'alpa') alpa++;
      else if (r.status === 'libur') libur++;
    });
    
    // Unrecorded teachers are considered "Belum Absen"
    const recordedTeacherIds = new Set(recordsToday.map(r => r.teacherId));
    const belumAbsen = activeTeachers.filter(t => !recordedTeacherIds.has(t.id)).length;
    
    const totalRecorded = hadir + terlambat + izin + sakit + alpa + libur;
    
    // Today is a holiday if there are no alpa/hadir/terlambat and libur > 0, or if all marked teachers are libur
    const isHoliday = libur > 0 && (libur + izin + sakit >= totalRecorded);
    
    const denominator = totalCount - izin - sakit - libur;
    const presenceRate = denominator > 0 
      ? Math.round(((hadir + terlambat) / denominator) * 100) 
      : (isHoliday ? 100 : 0);
      
    return {
      total: totalCount,
      hadir,
      terlambat,
      izin,
      sakit,
      alpa,
      libur,
      belumAbsen,
      isHoliday,
      presenceRate: Math.min(100, Math.max(0, presenceRate)),
      totalRecorded
    };
  }, [teachers, records, selectedDate]);

  // 2. Generate 7-day attendance trend data (school days only)
  const trendData = useMemo(() => {
    const activeTeachers = teachers.filter(t => t.status === 'aktif');
    const totalCount = activeTeachers.length;
    if (totalCount === 0) return [];

    // Get unique dates in records, sorted
    const uniqueDates = Array.from(new Set(records.map(r => r.date))).sort();
    // Get last 7 days
    const last7Days = uniqueDates.slice(-7);
    
    return last7Days.map(date => {
      const recordsOnDate = records.filter(r => r.date === date);
      let presentCount = 0;
      let excSickCount = 0;
      let holidayCount = 0;
      
      recordsOnDate.forEach(r => {
        const teacher = activeTeachers.find(t => t.id === r.teacherId);
        if (!teacher) return;
        
        if (r.status === 'hadir' || r.status === 'terlambat') {
          presentCount++;
        } else if (r.status === 'izin' || r.status === 'sakit') {
          excSickCount++;
        } else if (r.status === 'libur') {
          holidayCount++;
        }
      });
      
      const denom = totalCount - excSickCount - holidayCount;
      const rate = denom > 0 ? Math.round((presentCount / denom) * 100) : 100;
      
      // format date to readable "DD/MM"
      const parts = date.split('-');
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
      
      return {
        date: formattedDate,
        fullDate: date,
        rate: Math.min(100, Math.max(0, rate)),
        hadir: presentCount
      };
    });
  }, [teachers, records]);

  // 3. Get alerts (teachers who are absent or late today)
  const alertsToday = useMemo(() => {
    const activeTeachers = teachers.filter(t => t.status === 'aktif');
    const recordsToday = records.filter(r => r.date === selectedDate);
    
    return recordsToday
      .filter(r => r.status === 'alpa' || r.status === 'terlambat')
      .map(r => {
        const teacher = activeTeachers.find(t => t.id === r.teacherId);
        return {
          record: r,
          teacher
        };
      })
      .filter(item => item.teacher !== undefined);
  }, [teachers, records, selectedDate]);

  // SVG dimensions for trend chart
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 35;
  
  const chartPoints = useMemo(() => {
    if (trendData.length === 0) return '';
    const xStep = (chartWidth - padding * 2) / Math.max(1, trendData.length - 1);
    
    return trendData.map((d, index) => {
      const x = padding + index * xStep;
      // invert Y since SVG 0,0 is top-left
      const y = chartHeight - padding - (d.rate / 100) * (chartHeight - padding * 2);
      return `${x},${y}`;
    }).join(' ');
  }, [trendData]);

  // Format date display for Indonesian
  const formatIndonesianDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Welcome Banner - Styled with Geometric Balance Theme */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200" id="welcome-banner">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-xs">
            {schoolProfile.logoImage ? (
              <img src={schoolProfile.logoImage} alt="Logo Madrasah" className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-7 h-7 text-indigo-600" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-indigo-600 tracking-wider uppercase block">{schoolProfile.foundationName}</span>
            <h2 className="text-base font-black text-slate-800 tracking-tight uppercase" id="welcome-title">
              {schoolProfile.schoolName}
            </h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-semibold" id="welcome-date">
              <Calendar className="w-4 h-4 text-slate-400" />
              {formatIndonesianDate(selectedDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            id="nav-to-absen-btn"
            onClick={() => onNavigate('absen')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            Catat Absensi Hari Ini
          </button>
        </div>
      </div>

      {/* Grid Summary Cards - Styled with pure bold colors and clean borders */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="stats-grid">
        {/* Total Teachers Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between" id="stat-card-total">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total Guru</span>
            <span className="text-slate-400"><Users className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{statsToday.total}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1.5">Guru Terdaftar</p>
          </div>
        </div>

        {/* Presence Rate Card */}
        <div className="bg-slate-900 p-5 rounded-2xl flex flex-col justify-between text-white" id="stat-card-rate">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Tingkat Kehadiran</span>
            <span className="text-indigo-400"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-indigo-400 tracking-tight">
              {statsToday.isHoliday ? 'HARI LIBUR' : `${statsToday.presenceRate}%`}
            </h3>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${statsToday.isHoliday ? 100 : statsToday.presenceRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Hadir/Tepat Waktu Card */}
        <div className="bg-emerald-500 p-5 rounded-2xl flex flex-col justify-between text-white" id="stat-card-hadir">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-100 tracking-wider uppercase">Tepat Waktu</span>
            <span className="text-white"><CheckCircle className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black tracking-tight">{statsToday.hadir}</h3>
            <p className="text-[10px] text-emerald-100 font-bold mt-1.5">Sesuai Jadwal Hari Ini</p>
          </div>
        </div>

        {/* Terlambat Card */}
        <div className="bg-amber-400 p-5 rounded-2xl flex flex-col justify-between text-slate-900" id="stat-card-lambat">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-950/60 tracking-wider uppercase">Terlambat</span>
            <span className="text-slate-900"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black tracking-tight">{statsToday.terlambat}</h3>
            <p className="text-[10px] text-amber-950/60 font-bold mt-1.5">Melebihi Batas Waktu</p>
          </div>
        </div>

        {/* Absen / Alpa Card */}
        <div className="bg-rose-500 p-5 rounded-2xl col-span-2 lg:col-span-1 flex flex-col justify-between text-white" id="stat-card-alpa">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-100 tracking-wider uppercase">Alpa / Absen</span>
            <span className="text-white"><AlertTriangle className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black tracking-tight">{statsToday.alpa}</h3>
            <p className="text-[10px] text-rose-100 font-bold mt-1.5">Izin: {statsToday.izin} | Skt: {statsToday.sakit} | Lbr: {statsToday.libur}</p>
          </div>
        </div>
      </div>

      {/* Main Section: Chart & Today Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-details">
        {/* Chart Column */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between" id="chart-section">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Tren Kehadiran 7 Hari Terakhir
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Persentase kehadiran guru di hari kerja efektif</p>
          </div>

          <div className="my-6 relative flex items-center justify-center">
            {trendData.length > 0 ? (
              <div className="w-full h-48">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map((level) => {
                    const y = chartHeight - padding - (level / 100) * (chartHeight - padding * 2);
                    return (
                      <g key={level} className="opacity-40">
                        <line 
                          x1={padding} 
                          y1={y} 
                          x2={chartWidth - padding} 
                          y2={y} 
                          stroke="#E2E8F0" 
                          strokeWidth="1" 
                          strokeDasharray="4 4"
                        />
                        <text 
                          x={padding - 10} 
                          y={y + 4} 
                          fontSize="8" 
                          fill="#94A3B8" 
                          textAnchor="end"
                          className="font-mono font-bold"
                        >
                          {level}%
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Bottom line */}
                  <line 
                    x1={padding} 
                    y1={chartHeight - padding} 
                    x2={chartWidth - padding} 
                    y2={chartHeight - padding} 
                    stroke="#CBD5E1" 
                    strokeWidth="1.5"
                  />

                  {/* Area fill under curve */}
                  {trendData.length > 1 && (
                    <polygon
                      points={`
                        ${padding},${chartHeight - padding}
                        ${chartPoints}
                        ${chartWidth - padding},${chartHeight - padding}
                      `}
                      fill="url(#chart-gradient)"
                      opacity="0.1"
                    />
                  )}

                  {/* Core Line */}
                  <polyline
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartPoints}
                  />

                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#FFFFFF" />
                    </linearGradient>
                  </defs>

                  {/* Interactive Points and Labels */}
                  {trendData.map((d, index) => {
                    const xStep = (chartWidth - padding * 2) / Math.max(1, trendData.length - 1);
                    const x = padding + index * xStep;
                    const y = chartHeight - padding - (d.rate / 100) * (chartHeight - padding * 2);
                    
                    return (
                      <g key={index} className="group">
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#4F46E5"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          className="transition-all cursor-pointer"
                        />
                        {/* Hover Tooltip/Label */}
                        <text
                          x={x}
                          y={y - 10}
                          fontSize="9"
                          fontWeight="bold"
                          fill="#4F46E5"
                          textAnchor="middle"
                          className="font-sans"
                        >
                          {d.rate}%
                        </text>
                        {/* X-axis Label */}
                        <text
                          x={x}
                          y={chartHeight - padding + 16}
                          fontSize="9"
                          fill="#64748B"
                          textAnchor="middle"
                          className="font-mono font-bold"
                        >
                          {d.date}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs font-bold">
                Tidak ada data tren untuk ditampilkan. Catat absensi beberapa hari terlebih dahulu.
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2" id="chart-footer">
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
              Persentase Kehadiran Positif (Hadir + Terlambat)
            </span>
            <button 
              id="view-full-report-btn"
              onClick={() => onNavigate('laporan')}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-wider"
            >
              Lihat Laporan Bulanan
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Alerts Column */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col" id="alerts-section">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Notifikasi &amp; Alert Hari Ini
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Daftar keterlambatan &amp; alpa hari ini</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[220px] pr-1 scrollbar-thin" id="alerts-list">
            {statsToday.belumAbsen > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                <div className="p-1 bg-amber-100 text-amber-700 rounded-lg mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-tight">Absensi Belum Selesai</h4>
                  <p className="text-[10px] text-amber-700 mt-1 leading-normal">
                    Ada <strong>{statsToday.belumAbsen}</strong> guru yang belum memiliki catatan absen pada tanggal ini.
                  </p>
                  <button 
                    onClick={() => onNavigate('absen')}
                    className="text-[10px] text-indigo-600 hover:underline font-bold uppercase tracking-wider mt-1.5 block cursor-pointer"
                  >
                    Lengkapi Sekarang &rarr;
                  </button>
                </div>
              </div>
            )}

            {alertsToday.length > 0 ? (
              alertsToday.map((alert) => (
                <div 
                  key={alert.record.id} 
                  className={`p-3 border rounded-xl flex items-start gap-2.5 ${
                    alert.record.status === 'alpa' 
                      ? 'bg-rose-50 border-rose-200' 
                      : 'bg-amber-50/50 border-amber-200/50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg mt-0.5 ${
                    alert.record.status === 'alpa' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {alert.teacher?.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                      {alert.teacher?.subject} • NIP {alert.teacher?.nip}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        alert.record.status === 'alpa' 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {alert.record.status === 'alpa' ? 'Alpa' : `Terlambat ${alert.record.checkInTime || ''}`}
                      </span>
                      {alert.record.notes && (
                        <span className="text-[10px] text-slate-500 italic max-w-full truncate">
                          "{alert.record.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              statsToday.belumAbsen === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center py-8 text-slate-400">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                  <p className="text-xs font-medium">Hari ini luar biasa!</p>
                  <p className="text-[10px] mt-0.5 text-slate-400">Seluruh guru hadir tepat waktu atau izin resmi.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
