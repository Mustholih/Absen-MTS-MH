/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AttendanceStatus = 'hadir' | 'terlambat' | 'izin' | 'sakit' | 'alpa' | 'libur';

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  subject: string;
  contact: string;
  status: 'aktif' | 'nonaktif';
  photoColor: string; // Tailwind background color for placeholder avatar (e.g., 'bg-indigo-100 text-indigo-700')
  photo?: string; // Optional Base64 image data for teacher's uploaded photo
}

export interface AttendanceRecord {
  id: string; // e.g., teacherId + '_' + date
  teacherId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string; // HH:MM, especially if status is 'hadir' or 'terlambat'
  notes?: string; // notes/reasons for izin or sakit
}

export interface MonthlySummary {
  teacherId: string;
  teacherName: string;
  nip: string;
  subject: string;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpa: number;
  libur: number;
  totalDays: number;
  attendanceRate: number; // percentage
}

export interface SchoolProfile {
  schoolName: string;
  foundationName: string;
  address: string;
  phone: string;
  email: string;
  npsn: string;
  principalName: string;
  principalNip: string;
  signatureImage?: string; // Base64 string of uploaded signature/stamp image
  logoImage?: string;      // Base64 string of uploaded school/madrasah logo image (Left)
  logoRightImage?: string; // Base64 string of uploaded secondary logo image (Right)
  signeeTitleLeft: string; // Left signee title
  signeeNameLeft: string;  // Left signee name
  signeeNipLeft: string;   // Left signee NIP
  signeeTitleRight: string;// Right signee title
  signeeNameRight: string; // Right signee name
  signeeNipRight: string;  // Right signee NIP
  showSignature?: boolean;
}

