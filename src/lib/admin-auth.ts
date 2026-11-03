import 'server-only';
import { cache } from 'react';
import { createClient } from './supabase/server';
import type { Profile } from './types';

/** Returns the signed-in staff member (admin/manager) or null. */
export const getStaff = cache(async () => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle();
  const profile = data as Profile | null;
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) return null;
  return { user: auth.user, profile, supabase };
});

export async function requireStaff() {
  const staff = await getStaff();
  if (!staff) throw new Error('Forbidden');
  return staff;
}

export async function requireAdmin() {
  const staff = await requireStaff();
  if (staff.profile.role !== 'admin') throw new Error('Forbidden');
  return staff;
}
