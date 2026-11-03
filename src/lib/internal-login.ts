import 'server-only';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { createAdminClient } from './supabase/admin';
import { createClient } from './supabase/server';

/**
 * Accounts that sign in without e-mail (Telegram) get an internal, pre-confirmed e-mail address
 * so Supabase can issue a normal session. It is never shown to customers.
 */
export const INTERNAL_EMAIL_DOMAIN = 'telegram.dionn.uz';
export const isInternalEmail = (email?: string | null) => !!email && email.endsWith(`@${INTERNAL_EMAIL_DOMAIN}`);

export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

export function hashCode(scope: string, code: string) {
  return createHash('sha256').update(`${scope}:${code}:${process.env.SUPABASE_SERVICE_ROLE_KEY}`).digest('hex');
}

export function sameHash(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Finds or creates the account for `email` and starts a session for it (sets auth cookies). */
export async function signInInternal(email: string, metadata: Record<string, unknown>) {
  const admin = createAdminClient();
  // Create first: for unknown e-mails generateLink would return a *signup* token instead of a login token.
  const { error: createErr } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: metadata });
  if (createErr && !/already|exists|registered/i.test(createErr.message)) throw new Error(`createUser: ${createErr.message}`);

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (linkErr || !link?.properties?.hashed_token) throw new Error(`generateLink: ${linkErr?.message}`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type: 'email', token_hash: link.properties.hashed_token });
  if (error || !data.user) throw new Error(`verifyOtp: ${error?.message}`);
  return data.user;
}
