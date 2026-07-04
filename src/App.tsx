/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Teacher, AttendanceRecord, SchoolProfile } from './types';
import { INITIAL_TEACHERS, generateInitialAttendance } from './mockData';
import DashboardOverview from './components/DashboardOverview';
import TeacherManagement from './components/TeacherManagement';
import DailyAttendance from './components/DailyAttendance';
import MonthlyReport from './components/MonthlyReport';
import QrAttendanceScanner from './components/QrAttendanceScanner';
import SchoolProfileEditor from './components/SchoolProfileEditor';
import AdminLogin from './components/AdminLogin';
import { 
  Users, 
  Home, 
  CheckSquare, 
  FileSpreadsheet, 
  Building2, 
  Menu, 
  X, 
  Database,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  QrCode,
  Settings
} from 'lucide-react';

export default function App() {
  // Admin authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_admin_authenticated') === 'true';
  });

  // Navigation active tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Date state (for attendance logging), dynamically defaulted to the current system date
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Core Data States
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // School Profile State (formal defaults matching MADRASAH TSANAWIYAH MIFTAHUL HUDA initial mockups)
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>({
    schoolName: 'MADRASAH TSANAWIYAH MIFTAHUL HUDA',
    foundationName: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
    address: 'JL. TUMBRO RAYA DESA RAWA JAYA KEC. TABIR SELATAN KAB. MERANGIN KODE POS 37354',
    phone: '+62 | 81366866292',
    email: 'miftahulhuda97@gmail.com',
    npsn: '10508256',
    principalName: 'SLAMET, S.Pd., M.H.',
    principalNip: '197206052003121005',
    signeeTitleLeft: 'Kepala Sekolah',
    signeeNameLeft: 'SLAMET, S.Pd., M.H.',
    signeeNipLeft: '197206052003121005',
    signeeTitleRight: 'Kepala Tata Usaha',
    signeeNameRight: 'YUYUN RAHAYU, S.Pd.',
    signeeNipRight: '',
    signatureImage: '',
    logoImage: '',
    logoRightImage: '',
    showSignature: true
  });

  // UI Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mobile sidebar visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load or seed initial data from localStorage
  useEffect(() => {
    // Clear old seeded demo data once to ensure a clean start
    if (localStorage.getItem('v3_fresh_start_cleared') !== 'true') {
      localStorage.removeItem('teachers_data');
      localStorage.removeItem('attendance_records_data');
      localStorage.setItem('v3_fresh_start_cleared', 'true');
    }

    const storedTeachers = localStorage.getItem('teachers_data');
    const storedRecords = localStorage.getItem('attendance_records_data');

    let loadedTeachers: Teacher[] = [];
    if (storedTeachers) {
      try {
        loadedTeachers = JSON.parse(storedTeachers);
        setTeachers(loadedTeachers);
      } catch (e) {
        console.error('Error parsing stored teachers', e);
      }
    }

    if (loadedTeachers.length === 0) {
      // Seed initial teachers
      loadedTeachers = INITIAL_TEACHERS;
      setTeachers(loadedTeachers);
      localStorage.setItem('teachers_data', JSON.stringify(loadedTeachers));
    }

    if (storedRecords) {
      try {
        const loadedRecords = JSON.parse(storedRecords);
        setRecords(loadedRecords);
      } catch (e) {
        console.error('Error parsing stored records', e);
      }
    } else {
      // Seed initial attendance logs for the last 30 days
      const seededRecords = generateInitialAttendance(loadedTeachers);
      setRecords(seededRecords);
      localStorage.setItem('attendance_records_data', JSON.stringify(seededRecords));
    }

    const storedProfile = localStorage.getItem('school_profile_data');
    if (storedProfile) {
      try {
        setSchoolProfile(JSON.parse(storedProfile));
      } catch (e) {
        console.error('Error parsing stored school profile', e);
      }
    }
  }, []);

  // Helper to trigger brief toast message
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Add teacher handler
  const handleAddTeacher = (newTeacherData: Omit<Teacher, 'id' | 'photoColor'>) => {
    // Generate randomized styling for photo avatar placeholder
    const colors = [
      'bg-indigo-100 text-indigo-700',
      'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700',
      'bg-rose-100 text-rose-700',
      'bg-sky-100 text-sky-700',
      'bg-teal-100 text-teal-700',
      'bg-purple-100 text-purple-700',
      'bg-orange-100 text-orange-700'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newTeacher: Teacher = {
      ...newTeacherData,
      id: `t_${Date.now()}`,
      photoColor: randomColor
    };

    const updated = [...teachers, newTeacher];
    setTeachers(updated);
    localStorage.setItem('teachers_data', JSON.stringify(updated));
    triggerToast(`Berhasil menambahkan guru: ${newTeacher.name}`);
  };

  // Update teacher profiles
  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    const updated = teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
    setTeachers(updated);
    localStorage.setItem('teachers_data', JSON.stringify(updated));
    triggerToast(`Data profil ${updatedTeacher.name} berhasil diperbarui`);
  };

  // Delete/Deactivate teacher profile
  const handleDeleteTeacher = (id: string) => {
    const target = teachers.find(t => t.id === id);
    // Physically remove or switch status. We'll physically remove for administrative cleanliness in this dashboard,
    // but keep old records intact (they won't throw exceptions because of optional chains).
    const updated = teachers.filter(t => t.id !== id);
    setTeachers(updated);
    localStorage.setItem('teachers_data', JSON.stringify(updated));
    triggerToast(`Data guru ${target?.name || ''} telah dihapus`);
  };

  // Save or update a single attendance record
  const handleSaveRecord = (newRecord: Omit<AttendanceRecord, 'id'>) => {
    const recordId = `${newRecord.teacherId}_${newRecord.date}`;
    const recordWithId: AttendanceRecord = {
      ...newRecord,
      id: recordId
    };

    const existingIndex = records.findIndex(r => r.id === recordId);
    let updated: AttendanceRecord[] = [];
    
    if (existingIndex > -1) {
      updated = [...records];
      updated[existingIndex] = recordWithId;
    } else {
      updated = [...records, recordWithId];
    }

    setRecords(updated);
    localStorage.setItem('attendance_records_data', JSON.stringify(updated));
  };

  // Save multiple attendance records at once (for bulk "Mark All Present" action)
  const handleSaveBulkRecords = (bulkRecords: Omit<AttendanceRecord, 'id'>[]) => {
    const updated = [...records];
    
    bulkRecords.forEach(newRecord => {
      const recordId = `${newRecord.teacherId}_${newRecord.date}`;
      const recordWithId: AttendanceRecord = {
        ...newRecord,
        id: recordId
      };
      
      const idx = updated.findIndex(r => r.id === recordId);
      if (idx > -1) {
        updated[idx] = recordWithId;
      } else {
        updated.push(recordWithId);
      }
    });

    setRecords(updated);
    localStorage.setItem('attendance_records_data', JSON.stringify(updated));
    triggerToast(`Berhasil mencatatkan absensi seluruh guru`);
  };

  const handleUpdateSchoolProfile = (updatedProfile: SchoolProfile) => {
    setSchoolProfile(updatedProfile);
    localStorage.setItem('school_profile_data', JSON.stringify(updatedProfile));
    triggerToast('Profil sekolah dan tanda tangan resmi berhasil diperbarui');
  };

  const handleLoginSuccess = () => {
    localStorage.setItem('is_admin_authenticated', 'true');
    setIsAuthenticated(true);
    triggerToast('Selamat datang kembali, Administrator MUSTHOLIH!');
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari halaman admin?')) {
      localStorage.removeItem('is_admin_authenticated');
      setIsAuthenticated(false);
      triggerToast('Anda telah keluar dari sistem.');
    }
  };

  // Reset database helper for testing / demonstration purposes
  const handleResetDatabase = () => {
    if (window.confirm('Apakah Anda ingin menyetel ulang database kembali ke draf awal (mock data)? Semua perubahan Anda akan diganti.')) {
      localStorage.removeItem('teachers_data');
      localStorage.removeItem('attendance_records_data');
      
      const defaultTeachers = INITIAL_TEACHERS;
      const defaultRecords = generateInitialAttendance(defaultTeachers);
      
      setTeachers(defaultTeachers);
      setRecords(defaultRecords);
      
      localStorage.setItem('teachers_data', JSON.stringify(defaultTeachers));
      localStorage.setItem('attendance_records_data', JSON.stringify(defaultRecords));
      
      triggerToast('Database berhasil disetel ulang ke kondisi bawaan!');
      setActiveTab('dashboard');
    }
  };

  const activeTabName = () => {
    switch(activeTab) {
      case 'dashboard': return 'Beranda Ringkasan';
      case 'guru': return 'Manajemen Guru';
      case 'absen': return 'Catat Absen Harian';
      case 'laporan': return 'Laporan Bulanan';
      case 'qr-scanner': return 'Terminal Absen QR (Lobby)';
      case 'school-profile': return 'Profil Sekolah & Tanda Tangan';
      default: return 'Admin Absen Guru';
    }
  };

  if (!isAuthenticated) {
    return (
      <AdminLogin 
        schoolProfile={schoolProfile}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans" id="app-root">
      {/* 1. Desktop Sidebar - Styled with Geometric Balance Theme */}
      <aside className="w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between hidden md:flex" id="desktop-sidebar">
        <div className="flex flex-col">
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-200" id="sidebar-logo">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded flex items-center justify-center overflow-hidden p-0.5 shrink-0 shadow-xs">
                {schoolProfile.logoImage ? (
                  <img src={schoolProfile.logoImage} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-indigo-600 rounded flex items-center justify-center text-white font-extrabold text-lg">
                    {schoolProfile.schoolName ? schoolProfile.schoolName.charAt(0) : 'M'}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-black tracking-tight text-slate-800 leading-none">ADMIN ABSEN</h1>
                <span className="text-[10px] text-slate-400 font-bold tracking-wide mt-1 block uppercase truncate" title={schoolProfile.schoolName}>
                  {schoolProfile.schoolName}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="py-6 px-4 space-y-1.5" id="desktop-nav">
            <button
              id="sidebar-nav-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === 'dashboard' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
              <span>Ringkasan Dashboard</span>
            </button>

            <button
              id="sidebar-nav-guru"
              onClick={() => setActiveTab('guru')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'guru' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === 'guru' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
              <span>Manajemen Data Guru</span>
            </button>

            <button
              id="sidebar-nav-absen"
              onClick={() => setActiveTab('absen')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'absen' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === 'absen' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
              <span>Catat Absen Harian</span>
            </button>

            <button
              id="sidebar-nav-laporan"
              onClick={() => setActiveTab('laporan')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'laporan' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === 'laporan' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
              <span>Sistem Laporan Bulanan</span>
            </button>

            <button
              id="sidebar-nav-qr-scanner"
              onClick={() => setActiveTab('qr-scanner')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'qr-scanner' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === 'qr-scanner' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
              <span className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-slate-400" />
                Terminal Absen QR
              </span>
            </button>

            <button
              id="sidebar-nav-school-profile"
              onClick={() => setActiveTab('school-profile')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'school-profile' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === 'school-profile' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                Profil Sekolah
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-6 border-t border-slate-200 space-y-4" id="sidebar-footer">
          <div className="bg-slate-900 rounded-xl p-4 text-white shadow-xs" id="admin-profile-badge">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">USER AKTIF</span>
            <p className="text-xs font-bold truncate">mus9484@gmail.com</p>
            <p className="text-[10px] text-indigo-300 mt-0.5">Administrator Sistem</p>
          </div>

          <button
            id="btn-logout-sidebar"
            onClick={handleLogout}
            className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1.5 border border-rose-100 cursor-pointer"
            title="Keluar dari akun admin"
          >
            Keluar dari Sistem
          </button>
        </div>
      </aside>

      {/* 2. Mobile Nav Backdrop & Slide-out drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden" id="mobile-menu-overlay">
          <div className="w-64 bg-white border-r border-slate-200 h-full p-5 flex flex-col justify-between animate-slide-right">
            <div className="space-y-6">
              <div className="flex items-center justify-between" id="mobile-header-actions">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded flex items-center justify-center overflow-hidden p-0.5 shrink-0 shadow-xs">
                    {schoolProfile.logoImage ? (
                      <img src={schoolProfile.logoImage} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-indigo-600 rounded flex items-center justify-center text-white font-extrabold text-sm">
                        {schoolProfile.schoolName ? schoolProfile.schoolName.charAt(0) : 'M'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xs font-black tracking-tight text-slate-800 leading-none">ADMIN ABSEN</h1>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5 uppercase truncate max-w-[120px]" title={schoolProfile.schoolName}>
                      {schoolProfile.schoolName}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <hr className="border-slate-100" />

              <nav className="space-y-1.5" id="mobile-nav-links">
                <button
                  onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${activeTab === 'dashboard' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                  <span>Ringkasan Dashboard</span>
                </button>
                <button
                  onClick={() => { setActiveTab('guru'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'guru' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${activeTab === 'guru' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                  <span>Manajemen Guru</span>
                </button>
                <button
                  onClick={() => { setActiveTab('absen'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'absen' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${activeTab === 'absen' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                  <span>Catat Absen Harian</span>
                </button>
                <button
                  onClick={() => { setActiveTab('laporan'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'laporan' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${activeTab === 'laporan' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                  <span>Laporan Bulanan</span>
                </button>
                <button
                  onClick={() => { setActiveTab('qr-scanner'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'qr-scanner' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${activeTab === 'qr-scanner' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                  <span className="flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-slate-400" />
                    Terminal Absen QR
                  </span>
                </button>
                <button
                  onClick={() => { setActiveTab('school-profile'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'school-profile' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${activeTab === 'school-profile' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                  <span className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    Profil Sekolah
                  </span>
                </button>
              </nav>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900 rounded-xl p-4 text-white shadow-xs">
                <p className="text-[10px] opacity-70 mb-1 font-medium">USER AKTIF</p>
                <p className="text-xs font-bold truncate">mus9484@gmail.com</p>
                <p className="text-[10px] text-indigo-300 mt-0.5">Administrator Sistem</p>
              </div>

              <button
                onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 border border-rose-100 cursor-pointer"
              >
                Keluar dari Sistem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Frame Area */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content-wrapper">
        {/* Top Header Bar - Geometric Balance Theme */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0 print:hidden" id="main-header">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight" id="header-active-tab-title">
              {activeTabName()}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Date Display badge - Sleek Geometric Badge */}
            <span className="hidden sm:inline-flex px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold uppercase tracking-wider">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-600 uppercase" title="Administrator">
              AD
            </div>
          </div>
        </header>

        {/* Dynamic Inner Content Frame */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8" id="inner-content-viewport">
          {/* Active component switch */}
          {activeTab === 'dashboard' && (
            <DashboardOverview 
              teachers={teachers} 
              records={records} 
              onNavigate={setActiveTab}
              selectedDate={selectedDate}
              schoolProfile={schoolProfile}
            />
          )}

          {activeTab === 'guru' && (
            <TeacherManagement
              teachers={teachers}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
            />
          )}

          {activeTab === 'absen' && (
            <DailyAttendance
              teachers={teachers}
              records={records}
              onSaveRecord={handleSaveRecord}
              onSaveBulkRecords={handleSaveBulkRecords}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          )}

          {activeTab === 'laporan' && (
            <MonthlyReport
              teachers={teachers}
              records={records}
            />
          )}

          {activeTab === 'qr-scanner' && (
            <QrAttendanceScanner
              teachers={teachers}
              records={records}
              onSaveRecord={handleSaveRecord}
              selectedDate={selectedDate}
            />
          )}

          {activeTab === 'school-profile' && (
            <SchoolProfileEditor 
              profile={schoolProfile}
              onUpdateProfile={handleUpdateSchoolProfile}
            />
          )}
        </main>
      </div>

      {/* 4. Global Action Notification Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-lg p-3.5 flex items-center gap-2.5 max-w-sm z-50 animate-slide-up" id="toast-notification">
          <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <CheckCircle className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold leading-tight">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
