import type { Timestamp } from 'firebase/firestore';
import { isValidPhone } from './util';

type M = Record<string, unknown>;
export const str = (m: M, k: string): string => (typeof m[k] === 'string' ? (m[k] as string).trim() : '');
export const sl = (v: unknown): string[] => (Array.isArray(v) ? v.map((e) => String(e)) : []);
export const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);
export const dt = (v: unknown): Date | null => (v && typeof (v as Timestamp).toDate === 'function' ? (v as Timestamp).toDate() : null);

// ---------------- area ----------------
export type AreaSel = {
  divBn: string;
  distBn: string;
  distEn: string;
  upBn: string;
  upEn: string;
  union: string;
  ward: number | null;
};

export const areaKey = (a: AreaSel) => `${a.distEn}/${a.upEn}`;

export function areaLabel(a: AreaSel, en: boolean): string {
  const parts: string[] = [];
  if (a.union) parts.push(a.union);
  parts.push(en ? `${a.upEn}, ${a.distEn}` : `${a.upBn}, ${a.distBn}`);
  let s = parts.join(', ');
  if (a.ward != null) s += en ? ` · Ward ${a.ward}` : ` · ওয়ার্ড ${a.ward}`;
  return s;
}

export function areaFrom(m: unknown): AreaSel | null {
  if (!m || typeof m !== 'object') return null;
  const x = m as M;
  const up = str(x, 'upEn');
  if (!up) return null;
  return {
    divBn: str(x, 'divBn'),
    distBn: str(x, 'distBn'),
    distEn: str(x, 'distEn'),
    upBn: str(x, 'upBn'),
    upEn: up,
    union: str(x, 'union'),
    ward: num(x.ward),
  };
}

// ---------------- user ----------------
export type AppUser = {
  uid: string;
  name: string;
  email: string;
  photo: string;
  role: 'client' | 'worker' | 'admin' | string;
  status: string;
  phone: string;
  address: string;
  area: AreaSel | null;
  createdAt: Date | null;
};

export function userFrom(uid: string, m: M): AppUser {
  return {
    uid,
    name: str(m, 'name'),
    email: str(m, 'email'),
    photo: str(m, 'photo'),
    role: str(m, 'role') || 'client',
    status: str(m, 'status') || 'active',
    phone: str(m, 'phone'),
    address: str(m, 'address'),
    area: areaFrom(m.area),
    createdAt: dt(m.createdAt),
  };
}

export const profileComplete = (u: AppUser) =>
  u.name.trim().length >= 3 && isValidPhone(u.phone) && u.area != null && u.address.trim().length >= 5;

// ---------------- worker ----------------
export type Worker = {
  uid: string;
  name: string;
  photo: string;
  catId: string;
  catName: string;
  desc: string;
  address: string;
  homeKey: string;
  divBn: string;
  distBn: string;
  upBn: string;
  union: string;
  fb: string;
  yt: string;
  tt: string;
  approval: string;
  skills: string[];
  serveKeys: string[];
  serveNames: string[];
  serveEntries: string[];
  exp: number;
  ratingSum: number;
  ratingCount: number;
  jobs: number;
  hr: number | null;
  day: number | null;
  nego: boolean;
  available: boolean;
  verified: boolean;
  featured: boolean;
  busyDays: string[];
  createdAt: Date | null;
};

export function workerFrom(uid: string, m: M): Worker {
  return {
    uid,
    name: str(m, 'name'),
    photo: str(m, 'photo'),
    catId: str(m, 'catId'),
    catName: str(m, 'catName'),
    desc: str(m, 'desc'),
    address: str(m, 'address'),
    homeKey: str(m, 'homeKey'),
    divBn: str(m, 'divBn'),
    distBn: str(m, 'distBn'),
    upBn: str(m, 'upBn'),
    union: str(m, 'union'),
    fb: str(m, 'fb'),
    yt: str(m, 'yt'),
    tt: str(m, 'tt'),
    approval: str(m, 'approval') || 'pending',
    skills: sl(m.skills),
    serveKeys: sl(m.serveKeys),
    serveNames: sl(m.serveNames),
    serveEntries: sl(m.serveEntries),
    exp: num(m.exp) ?? 0,
    ratingSum: num(m.ratingSum) ?? 0,
    ratingCount: num(m.ratingCount) ?? 0,
    jobs: num(m.jobs) ?? 0,
    hr: num(m.hr),
    day: num(m.day),
    nego: m.nego === true,
    available: m.available !== false,
    verified: m.verified === true,
    featured: m.featured === true,
    busyDays: sl(m.busyDays),
    createdAt: dt(m.createdAt),
  };
}

export const workerRating = (w: Worker) => (w.ratingCount === 0 ? 0 : w.ratingSum / w.ratingCount);
export const workerAreaText = (w: Worker) => `${w.union ? w.union + ', ' : ''}${w.upBn}, ${w.distBn}`;

/** Entries look like 'Dist/Upazila|Union' ('Dist/Upazila|' = whole upazila). */
export function servesAt(w: Worker, key: string, union: string): boolean {
  if (!union) return true;
  const entries = w.serveEntries.length ? w.serveEntries : w.serveKeys.map((k) => `${k}|`);
  const rel = entries.filter((e) => e.split('|')[0] === key);
  if (rel.length === 0) return true;
  return rel.some((e) => {
    const u = e.includes('|') ? e.slice(e.indexOf('|') + 1) : '';
    return u === '' || u === union;
  });
}

// ---------------- booking ----------------
export type Booking = {
  id: string;
  clientUid: string;
  workerUid: string;
  clientName: string;
  workerName: string;
  catId: string;
  catName: string;
  desc: string;
  locText: string;
  date: string;
  time: string;
  instr: string;
  status: string;
  note: string;
  images: string[];
  reviewed: boolean;
  createdAt: Date | null;
};

export function bookingFrom(id: string, m: M): Booking {
  return {
    id,
    clientUid: str(m, 'clientUid'),
    workerUid: str(m, 'workerUid'),
    clientName: str(m, 'clientName'),
    workerName: str(m, 'workerName'),
    catId: str(m, 'catId'),
    catName: str(m, 'catName'),
    desc: str(m, 'desc'),
    locText: str(m, 'locText'),
    date: str(m, 'date'),
    time: str(m, 'time'),
    instr: str(m, 'instr'),
    status: str(m, 'status') || 'pending',
    note: str(m, 'note'),
    images: sl(m.images),
    reviewed: m.reviewed === true,
    createdAt: dt(m.createdAt),
  };
}

// ---------------- chat ----------------
export type Conv = {
  id: string;
  clientUid: string;
  workerUid: string;
  clientName: string;
  workerName: string;
  clientPhoto: string;
  workerPhoto: string;
  lastText: string;
  unread: Record<string, number>;
  deletedBy: string[];
  blockedBy: string[];
  updatedAt: Date | null;
};

export function convFrom(id: string, m: M): Conv {
  const un = (m.unread && typeof m.unread === 'object' ? m.unread : {}) as Record<string, unknown>;
  const unread: Record<string, number> = {};
  for (const k of Object.keys(un)) unread[k] = typeof un[k] === 'number' ? (un[k] as number) : 0;
  return {
    id,
    clientUid: str(m, 'clientUid'),
    workerUid: str(m, 'workerUid'),
    clientName: str(m, 'clientName'),
    workerName: str(m, 'workerName'),
    clientPhoto: str(m, 'clientPhoto'),
    workerPhoto: str(m, 'workerPhoto'),
    lastText: str(m, 'lastText'),
    unread,
    deletedBy: sl(m.deletedBy),
    blockedBy: sl(m.blockedBy),
    updatedAt: dt(m.updatedAt),
  };
}

export type Message = {
  id: string;
  from: string;
  type: 'text' | 'phone_request' | 'phone_share' | 'location' | string;
  text: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  createdAt: Date | null;
};

export function messageFrom(id: string, m: M): Message {
  return {
    id,
    from: str(m, 'from'),
    type: str(m, 'type') || 'text',
    text: str(m, 'text'),
    phone: str(m, 'phone'),
    lat: num(m.lat),
    lng: num(m.lng),
    createdAt: dt(m.createdAt),
  };
}

// ---------------- notification ----------------
export type Notif = {
  id: string;
  toUid: string;
  type: string;
  title: string;
  body: string;
  refId: string;
  read: boolean;
  createdAt: Date | null;
};

export function notifFrom(id: string, m: M): Notif {
  return {
    id,
    toUid: str(m, 'toUid'),
    type: str(m, 'type'),
    title: str(m, 'title'),
    body: str(m, 'body'),
    refId: str(m, 'refId'),
    read: m.read === true,
    createdAt: dt(m.createdAt),
  };
}

export type Review = {
  id: string;
  workerUid: string;
  clientName: string;
  rating: number;
  text: string;
  createdAt: Date | null;
};

export function reviewFrom(id: string, m: M): Review {
  return {
    id,
    workerUid: str(m, 'workerUid'),
    clientName: str(m, 'clientName'),
    rating: num(m.rating) ?? 0,
    text: str(m, 'text'),
    createdAt: dt(m.createdAt),
  };
}
