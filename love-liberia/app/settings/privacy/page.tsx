"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

 type Privacy = {
  hideOnlineStatus: boolean;
  hideLastActive: boolean;
  messagePermission: "EVERYONE" | "MATCHES";
  incognitoMode: boolean;
  profileViewTracking: boolean;
};

type Person = { id: string; firstName: string; username: string; profileImage: string | null };
type SecuritySession = { tokenVersion: string; ipAddress: string | null; userAgent: string | null; createdAt: string; lastActiveAt: string; expiresAt: string; current: boolean };

export default function PrivacySettingsPage() {
  const [privacy, setPrivacy] = useState<Privacy | null>(null);
  const [blocks, setBlocks] = useState<{ id: string; blocked: Person }[]>([]);
  const [hidden, setHidden] = useState<{ id: string; hidden: Person }[]>([]);
  const [cookiePreferences, setCookiePreferences] = useState({ analytics: false, personalization: false });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [deletionText, setDeletionText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState("dark");
  const [sessions, setSessions] = useState<SecuritySession[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [privacyResponse, blocksResponse, hiddenResponse, cookiesResponse, securityResponse] = await Promise.all([
          fetch("/api/privacy"), fetch("/api/blocks"), fetch("/api/hidden-profiles"), fetch("/api/privacy/cookies"), fetch("/api/account/security"),
        ]);
        const privacyData = await privacyResponse.json();
        const blocksData = await blocksResponse.json();
        const hiddenData = await hiddenResponse.json();
        const cookiesData = await cookiesResponse.json();
        const securityData = await securityResponse.json();
        if (!privacyResponse.ok) throw new Error(privacyData.error || "Please sign in again.");
        setPrivacy(privacyData.privacy);
        setBlocks(blocksData.blocks || []);
        setHidden(hiddenData.hiddenProfiles || []);
        setCookiePreferences(cookiesData.preferences || { analytics: false, personalization: false });
        setSessions(securityData.sessions || []);
        setTwoFactorEnabled(Boolean(securityData.twoFactorEnabled));
        setLanguage(localStorage.getItem("love-liberia-language") || "English");
        setTheme(localStorage.getItem("love-liberia-theme") || "dark");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load privacy settings.");
      }
    }
    void load();
  }, []);

  async function savePrivacy(field: keyof Privacy, value: boolean | string) {
    setStatus(""); setError("");
    const response = await fetch("/api/privacy", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Unable to save setting."); return; }
    setPrivacy(data.privacy); setStatus("Privacy settings saved.");
  }

  function savePreference(key: string, value: string) {
    localStorage.setItem(key, value);
    setStatus("Account preferences saved.");
  }

  async function securityAction(body: Record<string, unknown>) {
    setError(""); setStatus("");
    const response = await fetch("/api/account/security", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Unable to update security settings."); return false; }
    if (typeof data.twoFactorEnabled === "boolean") setTwoFactorEnabled(data.twoFactorEnabled);
    setStatus("Security settings updated.");
    return true;
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    if (await securityAction({ action: "change-password", currentPassword, newPassword })) { setCurrentPassword(""); setNewPassword(""); }
  }

  async function logoutAll() {
    if (await securityAction({ action: "logout-all" })) window.location.href = "/login";
  }

  async function saveCookies() {
    const response = await fetch("/api/privacy/cookies", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cookiePreferences) });
    if (response.ok) setStatus("Cookie preferences saved.");
  }

  async function unblock(id: string) {
    const response = await fetch("/api/blocks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blockedId: id }) });
    if (response.ok) setBlocks((current) => current.filter((item) => item.blocked.id !== id));
  }

  async function unhide(id: string) {
    const response = await fetch("/api/hidden-profiles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hiddenId: id }) });
    if (response.ok) setHidden((current) => current.filter((item) => item.hidden.id !== id));
  }

  async function deleteAccount() {
    setDeleting(true); setError("");
    const response = await fetch("/api/account/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation: deletionText }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Unable to delete account."); setDeleting(false); return; }
    window.location.href = "/register";
  }

  if (!privacy) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><p>{error || "Loading privacy settings..."}</p></main>;

  const toggle = (field: keyof Privacy, label: string, description: string) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
      <input type="checkbox" checked={Boolean(privacy[field])} onChange={(event) => void savePrivacy(field, event.target.checked)} className="mt-1 h-5 w-5 accent-rose-500" />
      <span><span className="block font-semibold">{label}</span><span className="text-sm text-slate-400">{description}</span></span>
    </label>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/dashboard" className="text-sm font-bold text-rose-400">Back to dashboard</Link>
        <h1 className="mt-3 text-3xl font-black">Privacy & data settings</h1>
        <p className="mt-2 text-slate-400">Choose who can find, contact, and see activity from your account.</p>
        {status && <p className="mt-4 rounded-lg bg-emerald-950 p-3 text-sm text-emerald-300">{status}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-950 p-3 text-sm text-red-200">{error}</p>}

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold">Visibility and contact</h2>
          {toggle("hideOnlineStatus", "Hide online status", "Do not show when you are online.")}
          {toggle("hideLastActive", "Hide last active", "Do not show your recent activity time.")}
          {toggle("incognitoMode", "Incognito mode", "Stay out of recommendations until you choose to interact.")}
          {toggle("profileViewTracking", "Show profile visitors", "Allow your profile visits to appear in visitor lists.")}
          <label className="block rounded-xl border border-slate-800 bg-slate-950 p-4 font-semibold">Who can message you<select value={privacy.messagePermission} onChange={(event) => void savePrivacy("messagePermission", event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 font-normal"><option value="EVERYONE">Everyone</option><option value="MATCHES">Matches only</option></select></label>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-bold">Account preferences</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Language<select value={language} onChange={(event) => { setLanguage(event.target.value); savePreference("love-liberia-language", event.target.value); }} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-normal"><option>English</option><option>French</option></select></label><label className="text-sm font-semibold">Theme<select value={theme} onChange={(event) => { setTheme(event.target.value); savePreference("love-liberia-theme", event.target.value); }} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-normal"><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></label></div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-bold">Security settings</h2>
          <form onSubmit={changePassword} className="mt-4 grid gap-3 sm:grid-cols-2"><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3" required /><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password (8+ characters)" minLength={8} className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3" required /><button className="rounded-lg bg-rose-600 px-4 py-3 text-sm font-bold sm:col-span-2">Change password</button></form>
          <div className="mt-6 border-t border-slate-800 pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">Two-factor authentication</h3><p className="mt-1 text-sm text-slate-400">Add an extra verification step when signing in.</p></div><button type="button" onClick={() => void securityAction({ action: "two-factor", enabled: !twoFactorEnabled })} className={`rounded-lg px-4 py-2 text-sm font-bold ${twoFactorEnabled ? "bg-emerald-700 text-white" : "border border-slate-600"}`}>{twoFactorEnabled ? "Enabled" : "Enable"}</button></div></div>
          <div className="mt-6 border-t border-slate-800 pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">Active sessions</h3><p className="mt-1 text-sm text-slate-400">Review devices that have accessed your account.</p></div><button type="button" onClick={() => void logoutAll()} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold">Log out all devices</button></div><div className="mt-4 space-y-2">{sessions.map((session, index) => <div key={session.tokenVersion || `${session.userAgent || "session"}-${session.ipAddress || "ip"}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 p-3 text-sm"><span>{session.current ? "This device" : session.userAgent || "Unknown device"} · {session.ipAddress || "Unknown IP"}</span>{!session.current && <button type="button" onClick={() => void securityAction({ action: "revoke-session", tokenVersion: session.tokenVersion })} className="font-bold text-rose-400">Revoke</button>}</div>)}</div></div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-bold">Blocked profiles</h2>
          {blocks.length === 0 ? <p className="mt-3 text-sm text-slate-400">You have not blocked anyone.</p> : blocks.map((item) => <div key={item.id} className="mt-3 flex items-center justify-between gap-3 border-b border-slate-800 pb-3"><span>@{item.blocked.username}</span><button type="button" onClick={() => void unblock(item.blocked.id)} className="text-sm font-bold text-rose-400">Unblock</button></div>)}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-bold">Hidden profiles</h2>
          {hidden.length === 0 ? <p className="mt-3 text-sm text-slate-400">You have not hidden any profiles.</p> : hidden.map((item) => <div key={item.id} className="mt-3 flex items-center justify-between gap-3 border-b border-slate-800 pb-3"><span>@{item.hidden.username}</span><button type="button" onClick={() => void unhide(item.hidden.id)} className="text-sm font-bold text-rose-400">Show again</button></div>)}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-bold">Data controls</h2>
          <p className="mt-2 text-sm text-slate-400">Download a copy of your profile, preferences, photos, connections, and messages.</p>
          <a href="/api/account/export" className="mt-4 inline-flex rounded-lg bg-rose-600 px-4 py-3 text-sm font-bold text-white">Download my data</a>
          <div className="mt-6 border-t border-slate-800 pt-5">
            <h3 className="font-bold text-red-300">Delete account</h3>
            <p className="mt-2 text-sm text-slate-400">This permanently removes your account and associated data. Type the confirmation phrase to continue.</p>
            <input value={deletionText} onChange={(event) => setDeletionText(event.target.value)} placeholder="DELETE MY ACCOUNT" className="mt-3 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" />
            <button type="button" disabled={deleting || deletionText !== "DELETE MY ACCOUNT"} onClick={() => void deleteAccount()} className="mt-3 rounded-lg bg-red-700 px-4 py-3 text-sm font-bold disabled:opacity-50">{deleting ? "Deleting..." : "Permanently delete account"}</button>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-bold">Cookie preferences</h2>
          <label className="mt-4 flex gap-3 text-sm"><input type="checkbox" checked={cookiePreferences.analytics} onChange={(event) => setCookiePreferences((current) => ({ ...current, analytics: event.target.checked }))} /> Analytics cookies</label>
          <label className="mt-3 flex gap-3 text-sm"><input type="checkbox" checked={cookiePreferences.personalization} onChange={(event) => setCookiePreferences((current) => ({ ...current, personalization: event.target.checked }))} /> Personalization cookies</label>
          <button type="button" onClick={() => void saveCookies()} className="mt-4 rounded-lg border border-slate-600 px-4 py-2 text-sm font-bold">Save cookie preferences</button>
        </section>

        <div className="mt-5"><Link href="/login" onClick={(event) => { event.preventDefault(); void fetch("/api/auth/logout", { method: "POST" }).then(() => { window.location.href = "/login"; }); }} className="font-bold text-red-400">Log out</Link></div><nav className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-rose-400"><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms of service</Link><Link href="/cookies">Cookie policy</Link></nav>
      </section>
    </main>
  );
}
