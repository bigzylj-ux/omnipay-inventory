import React, { useEffect, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

interface ProfileRecord {
  id: string;
  email: string;
  role: 'admin' | 'user';
  approved: boolean;
  vendorAccess: boolean;
}

export const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<ProfileRecord | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newId, setNewId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [newApproved, setNewApproved] = useState(false);
  const [newVendorAccess, setNewVendorAccess] = useState(false);

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true);
      if (!hasSupabaseConfig || !supabase) {
        setError('Missing Supabase config. Please create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, approved, vendorAccess')
        .order('email', { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setProfiles(data || []);
      }
      setLoading(false);
    };

    loadProfiles();
  }, []);

  const updateProfile = async (id: string, fields: Partial<ProfileRecord>) => {
    setActionLoading(id);
    setError(null);

    if (!hasSupabaseConfig || !supabase) {
      setError('Missing Supabase config. Please create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      setActionLoading(null);
      return;
    }

    const { error } = await supabase.from('profiles').update(fields).eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      setProfiles((current) =>
        current.map((profile) => (profile.id === id ? { ...profile, ...fields } : profile))
      );
    }

    setActionLoading(null);
  };

  const onApprove = async (id: string) => updateProfile(id, { approved: true });
  const onRevoke = async (id: string) => updateProfile(id, { approved: false });
  const onToggleVendorAccess = async (id: string, current: boolean) =>
    updateProfile(id, { vendorAccess: !current });

  const searchProfile = async () => {
    if (!lookupQuery.trim()) {
      setLookupMessage('Enter a Supabase user ID or email to find the profile.');
      setLookupResult(null);
      return;
    }

    setLookupLoading(true);
    setLookupMessage(null);
    setLookupResult(null);
    setError(null);

    if (!hasSupabaseConfig || !supabase) {
      setError('Missing Supabase config. Please create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      setLookupLoading(false);
      return;
    }

    const normalizedQuery = lookupQuery.trim();
    const isEmail = normalizedQuery.includes('@');
    const request = supabase.from('profiles').select('id, email, role, approved, vendorAccess');
    const query = isEmail
      ? request.ilike('email', normalizedQuery)
      : request.eq('id', normalizedQuery);

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      setError(error.message || 'Profile lookup returned an unexpected error.');
    } else if (!data) {
      setLookupMessage('No profile found for that user ID or email. You can ask the user to register again or create a profile directly in Supabase.');
    } else {
      setLookupResult(data as ProfileRecord);
      setLookupMessage(null);
    }

    setLookupLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/5 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-500">Admin center</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">User approvals and access control</h1>
            <p className="mt-2 text-slate-600">Approve new users, manage vendor access, and view account status in one place.</p>
          </div>
          <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-slate-100">
            Signed in as <strong>{user?.email}</strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700">{error}</div>
      )}

      <div className="rounded-3xl border border-slate-200/5 bg-white/90 p-6 shadow-sm">
        <div className="mb-6 grid gap-4 md:grid-cols-[1fr_320px]">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Lookup a profile</h2>
            <p className="text-sm text-slate-500">Search by Supabase user ID or email to confirm whether a profile row exists.</p>
          </div>
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-sm font-medium text-slate-700">User ID or email</label>
            <div className="flex gap-2">
              <input
                value={lookupQuery}
                onChange={(event) => setLookupQuery(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Enter user id or email"
              />
              <button
                type="button"
                disabled={lookupLoading}
                onClick={searchProfile}
                className="inline-flex items-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {lookupLoading ? 'Searching…' : 'Search'}
              </button>
            </div>
            {lookupMessage && <p className="text-sm text-slate-500">{lookupMessage}</p>}
            {lookupResult && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-slate-900">
                <p className="text-sm font-semibold">Profile found</p>
                <p className="mt-2 text-sm">Email: {lookupResult.email}</p>
                <p className="text-sm">Role: {lookupResult.role}</p>
                <p className="text-sm">Status: {lookupResult.approved ? 'Approved' : 'Pending'}</p>
                <p className="text-sm">Vendor access: {lookupResult.vendorAccess ? 'Enabled' : 'Disabled'}</p>
              </div>
            )}
            {!lookupResult && lookupMessage && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold">Create profile manually</p>
                <p className="text-sm text-slate-500 mt-1">If the user exists in Auth but no profile row is present, create one here. You will need the user's Supabase UID to link to Auth.</p>
                <div className="mt-3 grid gap-2">
                  <input
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="User ID (Supabase UID)"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                  />
                  <input
                    value={newEmail || lookupQuery}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Role</label>
                    <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    <label className="ml-3 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={newApproved} onChange={(e) => setNewApproved(e.target.checked)} /> Approved
                    </label>
                    <label className="ml-3 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={newVendorAccess} onChange={(e) => setNewVendorAccess(e.target.checked)} /> Vendor
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setError(null);
                        if (!hasSupabaseConfig || !supabase) {
                          setError('Missing Supabase config.');
                          return;
                        }
                        if (!newId.trim()) {
                          setError('User ID is required to link the profile to Auth.');
                          return;
                        }
                        const payload = {
                          id: newId.trim(),
                          email: (newEmail || lookupQuery || '').toLowerCase(),
                          role: newRole,
                          approved: newApproved,
                          vendorAccess: newVendorAccess,
                        };
                        const { error: createErr } = await supabase.from('profiles').insert(payload);
                        if (createErr) {
                          setError(createErr.message);
                        } else {
                          setLookupMessage(null);
                          setLookupResult(payload as ProfileRecord);
                          setProfiles((prev) => [payload as ProfileRecord, ...prev]);
                        }
                      }}
                      className="inline-flex items-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Create profile
                    </button>
                    <button type="button" onClick={() => { setNewId(''); setNewEmail(''); setNewRole('user'); setNewApproved(false); setNewVendorAccess(false); }} className="inline-flex items-center rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Loading users...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3">Email</th>
                  <th className="border-b border-slate-200 px-4 py-3">Role</th>
                  <th className="border-b border-slate-200 px-4 py-3">Status</th>
                  <th className="border-b border-slate-200 px-4 py-3">Vendor Access</th>
                  <th className="border-b border-slate-200 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-slate-200/80 last:border-b-0">
                    <td className="px-4 py-4">{profile.email}</td>
                    <td className="px-4 py-4 capitalize">{profile.role}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          profile.approved ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
                        }`}
                      >
                        {profile.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          profile.vendorAccess ? 'bg-sky-500/10 text-sky-700' : 'bg-slate-300/10 text-slate-700'
                        }`}
                      >
                        {profile.vendorAccess ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-4 space-x-2">
                      {profile.approved ? (
                        <button
                          type="button"
                          disabled={actionLoading === profile.id}
                          onClick={() => onRevoke(profile.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-500/20"
                        >
                          <XCircle className="h-4 w-4" /> Revoke
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={actionLoading === profile.id}
                          onClick={() => onApprove(profile.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={actionLoading === profile.id}
                        onClick={() => onToggleVendorAccess(profile.id, profile.vendorAccess)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-300/20 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {profile.vendorAccess ? 'Disable Vendor' : 'Grant Vendor'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
