import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BloodGroup } from '../backend';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isExpired(timestamp: bigint): boolean {
  const ms = Number(timestamp) / 1_000_000;
  return ms < Date.now();
}

export function isExpiringSoon(timestamp: bigint): boolean {
  const ms = Number(timestamp) / 1_000_000;
  const in7Days = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return ms <= in7Days && ms >= Date.now();
}

export function dateToNanoseconds(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

export function bloodGroupLabel(bg: BloodGroup): string {
  const map: Record<BloodGroup, string> = {
    [BloodGroup.Apos]: 'A+',
    [BloodGroup.Aneg]: 'A-',
    [BloodGroup.Bpos]: 'B+',
    [BloodGroup.Bneg]: 'B-',
    [BloodGroup.ABpos]: 'AB+',
    [BloodGroup.ABneg]: 'AB-',
    [BloodGroup.Opos]: 'O+',
    [BloodGroup.Oneg]: 'O-',
  };
  return map[bg] ?? bg;
}

export function truncatePrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 8)}...${principal.slice(-6)}`;
}
