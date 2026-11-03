'use client';
import { useState } from 'react';
import { useI18n } from '@/i18n/provider';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';

export function ProfileForm({ id, fullName, phone, email }: { id: string; fullName: string; phone: string; email: string }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await createClient()
      .from('profiles')
      .update({ full_name: String(fd.get('full_name')).slice(0, 120), phone: String(fd.get('phone')).slice(0, 40) })
      .eq('id', id);
    setLoading(false);
    if (error) toast.error(t.common.error);
    else toast.ok(t.account.saved);
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">{t.checkout.name}</label>
        <input name="full_name" defaultValue={fullName} className="input" />
      </div>
      <div>
        <label className="label">{t.checkout.phone}</label>
        <input name="phone" type="tel" defaultValue={phone} placeholder="+998" className="input" />
      </div>
      {email && (
        <div>
          <label className="label">E-mail</label>
          <input value={email} disabled className="input opacity-60" />
        </div>
      )}
      <button disabled={loading} className="btn-primary w-full">
        {t.common.save}
      </button>
    </form>
  );
}
