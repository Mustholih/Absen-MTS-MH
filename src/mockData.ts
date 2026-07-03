/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Teacher, AttendanceRecord } from './types';

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 't1',
    nip: '197405122001121003',
    name: 'Drs. H. Ahmad Fauzi, M.Pd.',
    subject: 'Matematika',
    contact: '081234567890',
    status: 'aktif',
    photoColor: 'bg-emerald-100 text-emerald-700'
  },
  {
    id: 't2',
    nip: '198211042009032005',
    name: 'Sri Wahyuni, S.Pd.',
    subject: 'Bahasa Indonesia',
    contact: '081398765432',
    status: 'aktif',
    photoColor: 'bg-indigo-100 text-indigo-700'
  },
  {
    id: 't3',
    nip: '197908152005011002',
    name: 'Bambang Sugeng, S.T.',
    subject: 'Fisika',
    contact: '082155443322',
    status: 'aktif',
    photoColor: 'bg-amber-100 text-amber-700'
  },
  {
    id: 't4',
    nip: '198802242015042001',
    name: 'Rina Kartika, S.Si.',
    subject: 'Kimia',
    contact: '085711223344',
    status: 'aktif',
    photoColor: 'bg-rose-100 text-rose-700'
  },
  {
    id: 't5',
    nip: '197110191998031001',
    name: 'Dr. Iwan Setiawan, M.Hum.',
    subject: 'Sejarah',
    contact: '081988776655',
    status: 'aktif',
    photoColor: 'bg-sky-100 text-sky-700'
  },
  {
    id: 't6',
    nip: '199305152019082012',
    name: 'Siti Aminah, S.Pd.',
    subject: 'Bahasa Inggris',
    contact: '089922334455',
    status: 'aktif',
    photoColor: 'bg-teal-100 text-teal-700'
  },
  {
    id: 't7',
    nip: '198507302010121004',
    name: 'Hendra Wijaya, S.Kom.',
    subject: 'Informatika',
    contact: '081299887766',
    status: 'aktif',
    photoColor: 'bg-purple-100 text-purple-700'
  },
  {
    id: 't8',
    nip: '199012012018012003',
    name: 'Dian Lestari, S.Pd.',
    subject: 'Biologi',
    contact: '081388776655',
    status: 'aktif',
    photoColor: 'bg-orange-100 text-orange-700'
  }
];

// Helper to generate attendance for the past 30 days up to July 3, 2026.
export function generateInitialAttendance(teachers: Teacher[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date('2026-07-03');
  
  // Go back 30 days
  for (let i = 30; i >= 0; i--) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - i);
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    const dateString = currentDate.toISOString().split('T')[0];
    
    teachers.forEach((teacher) => {
      // Deterministic random generator based on teacher id and day count to keep the data consistent
      const hash = (teacher.id.charCodeAt(1) || 0) + i;
      const rand = (hash % 100) / 100;
      
      let status: 'hadir' | 'terlambat' | 'izin' | 'sakit' | 'alpa' = 'hadir';
      let checkInTime = '06:45';
      let notes = '';
      
      if (rand < 0.05) {
        status = 'alpa';
      } else if (rand < 0.12) {
        status = 'izin';
        notes = 'Keperluan keluarga mendesak';
      } else if (rand < 0.18) {
        status = 'sakit';
        notes = 'Sakit demam / flu, surat dokter dilampirkan';
      } else if (rand < 0.28) {
        status = 'terlambat';
        // Late arrival between 07:15 and 07:45
        const lateMins = 15 + (hash % 30);
        checkInTime = `07:${lateMins}`;
        notes = 'Terjebak macet di jalan raya';
      } else {
        // Normal arrival between 06:30 and 07:00
        const onTimeMins = 30 + (hash % 30);
        checkInTime = `06:${onTimeMins < 10 ? '0' + onTimeMins : onTimeMins}`;
      }
      
      // Let's make sure the current date (today July 3, 2026) has some unrecorded or partial records,
      // so the admin can experience "recording today's attendance" from scratch, or let's record it as partial.
      // For June (i > 3), everything is recorded.
      records.push({
        id: `${teacher.id}_${dateString}`,
        teacherId: teacher.id,
        date: dateString,
        status,
        checkInTime: (status === 'hadir' || status === 'terlambat') ? checkInTime : undefined,
        notes: notes || undefined
      });
    });
  }
  
  return records;
}
