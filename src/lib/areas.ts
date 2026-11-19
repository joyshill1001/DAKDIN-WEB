'use client';
import { useEffect, useState } from 'react';
import type { AreaSel } from './types';

export type Upazila = { bn: string; en: string; unions: string[] };
export type District = { bn: string; en: string; divBn: string; divEn: string; upazilas: Upazila[]; lat: number; lon: number };
export type Division = { bn: string; en: string; districts: District[] };
export type Areas = { divisions: Division[]; districts: District[] };

let cache: Promise<Areas> | null = null;

/** Loads /areas.json once. Format: [distBn, distEn, [[upBn, upEn, [unions]]...], divBn, divEn, lat, lon] */
export function loadAreas(): Promise<Areas> {
  if (!cache) {
    cache = fetch('/areas.json')
      .then((r) => {
        if (!r.ok) throw new Error('areas');
        return r.json() as Promise<unknown[][]>;
      })
      .then((list) => {
        const districts: District[] = list.map((d) => ({
          bn: String(d[0]),
          en: String(d[1]),
          upazilas: (d[2] as unknown[][])
            .map((u) => ({ bn: String(u[0]), en: String(u[1]), unions: (u[2] as unknown[]).map(String) }))
            .sort((a, b) => a.bn.localeCompare(b.bn, 'bn')),
          divBn: String(d[3]),
          divEn: String(d[4]),
          lat: typeof d[5] === 'number' ? d[5] : 0,
          lon: typeof d[6] === 'number' ? d[6] : 0,
        }));
        districts.sort((a, b) => a.bn.localeCompare(b.bn, 'bn'));
        const by = new Map<string, Division>();
        for (const d of districts) {
          if (!by.has(d.divEn)) by.set(d.divEn, { bn: d.divBn, en: d.divEn, districts: [] });
          by.get(d.divEn)!.districts.push(d);
        }
        const divisions = [...by.values()].sort((a, b) => a.bn.localeCompare(b.bn, 'bn'));
        return { divisions, districts };
      });
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

export function useAreas(): { areas: Areas | null; error: boolean } {
  const [areas, setAreas] = useState<Areas | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    loadAreas()
      .then((a) => live && setAreas(a))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, []);
  return { areas, error };
}

export function makeArea(d: District, u: Upazila, union = ''): AreaSel {
  return { divBn: d.divBn, distBn: d.bn, distEn: d.en, upBn: u.bn, upEn: u.en, union, ward: null };
}
