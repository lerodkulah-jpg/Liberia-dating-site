"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Save } from "lucide-react";
import OnlineStatus from "@/components/OnlineStatus";

type ProfileForm = {
  firstName: string;
  phone: string;
  county: string;
  city: string;
  bio: string;
  relationshipGoal: string;
  occupation: string;
  education: string;
  height: string;
  languages: string;
  interests: string;
  hobbies: string;
  religion: string;
  smokingPreference: string;
  drinkingPreference: string;
  childrenPreference: string;
  hideOnlineStatus: boolean;
  hideLastActive: boolean;
  messagePermission: "EVERYONE" | "MATCHES";
  incognitoMode: boolean;
  profileViewTracking: boolean;
  interestedIn: string;
  minAge: number;
  maxAge: number;
  profileImage: string;
};

type GalleryPhoto = { id: string; url: string };
type VerificationState = {
  email: string;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  photoVerified: boolean;
  photoVerificationStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
};

const emptyForm: ProfileForm = {
  firstName: "",
  phone: "",
  county: "",
  city: "",
  bio: "",
  relationshipGoal: "",
  occupation: "",
  education: "",
  height: "",
  languages: "",
  interests: "",
  hobbies: "",
  religion: "",
  smokingPreference: "",
  drinkingPreference: "",
  childrenPreference: "",
  hideOnlineStatus: false,
  hideLastActive: false,
  messagePermission: "EVERYONE",
  incognitoMode: false,
  profileViewTracking: true,
  interestedIn: "Everyone",
  minAge: 18,
  maxAge: 60,
  profileImage: "",
};

export default function EditProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verification, setVerification] = useState<VerificationState | null>(null);
  const [verificationType, setVerificationType] = useState<"EMAIL" | "PHONE">("EMAIL");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(data.error || "Unable to load profile.");
        }

        if (!active) return;
        const user = data.user;
        const preferences = data.preferences;
        const verificationResponse = await fetch("/api/verification", { cache: "no-store" });
        if (verificationResponse.ok) setVerification((await verificationResponse.json()).verification);
        setGalleryPhotos(user.profilePhotos || []);
        setForm({
          firstName: user.firstName || "",
          phone: user.phone || "",
          county: user.county || "",
          city: user.city || "",
          bio: user.bio || "",
          relationshipGoal: user.relationshipGoal || "",
          occupation: user.occupation || "",
          education: user.education || "",
          height: user.height || "",
          languages: user.languages || "",
          interests: user.interests || "",
          hobbies: user.hobbies || "",
          religion: user.religion || "",
          smokingPreference: user.smokingPreference || "",
          drinkingPreference: user.drinkingPreference || "",
          childrenPreference: user.childrenPreference || "",
          hideOnlineStatus: Boolean(user.hideOnlineStatus),
          hideLastActive: Boolean(user.hideLastActive),
          messagePermission: user.messagePermission === "MATCHES" ? "MATCHES" : "EVERYONE",
          incognitoMode: Boolean(user.incognitoMode),
          profileViewTracking: user.profileViewTracking !== false,
          interestedIn: preferences?.interestedIn || "Everyone",
          minAge: preferences?.minAge || 18,
          maxAge: preferences?.maxAge || 60,
          profileImage: user.profileImage || "",
        });
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load your profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [router]);

  function updateField<Key extends keyof ProfileForm>(field: Key, value: ProfileForm[Key]) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function requestVerification() {
    setVerificationLoading(true);
    setVerificationMessage("");
    try {
      const response = await fetch("/api/verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request", type: verificationType }) });
      const data = await response.json();
      setVerificationMessage(data.developmentCode ? `${data.message} Development code: ${data.developmentCode}` : data.message || data.error);
    } catch { setVerificationMessage("Unable to send a verification code."); } finally { setVerificationLoading(false); }
  }

  async function confirmVerification() {
    setVerificationLoading(true);
    setVerificationMessage("");
    try {
      const response = await fetch("/api/verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "confirm", type: verificationType, code: verificationCode }) });
      const data = await response.json();
      setVerificationMessage(data.message || data.error);
      if (response.ok) {
        setVerification((current) => current ? { ...current, emailVerified: verificationType === "EMAIL" ? true : current.emailVerified, phoneVerified: verificationType === "PHONE" ? true : current.phoneVerified } : current);
        setVerificationCode("");
      }
    } catch { setVerificationMessage("Unable to confirm verification."); } finally { setVerificationLoading(false); }
  }

  async function submitPhotoVerification(file: File) {
    setVerificationLoading(true);
    setVerificationMessage("");
    const body = new FormData();
    body.append("photo", file);
    try {
      const response = await fetch("/api/verification/photo", { method: "POST", body });
      const data = await response.json();
      setVerificationMessage(data.message || data.error);
      if (response.ok) setVerification((current) => current ? { ...current, photoVerificationStatus: "PENDING" } : current);
    } catch { setVerificationMessage("Unable to submit photo verification."); } finally { setVerificationLoading(false); }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to save profile.");
        return;
      }

      setMessage("Profile updated successfully!");
      window.setTimeout(() => router.push("/profile"), 800);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(file: File) {
    setMessage("");
    setError("");

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to upload photo.");
        return;
      }

      setMessage(
        "Profile photo uploaded successfully!"
      );

      setForm((previous) => ({
        ...previous,
        profileImage: data.user.profileImage,
      }));

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      setError("Something went wrong while uploading.");
    }
  }

  async function uploadGalleryPhotos(files: File[]) {
    if (files.length === 0) return;

    setUploadingGallery(true);
    setMessage("");
    setError("");
    const formData = new FormData();
    files.forEach((file) => formData.append("photo", file));

    try {
      const response = await fetch("/api/profile/photos", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to upload photo.");
        return;
      }
      setGalleryPhotos((photos) => [...photos, ...(data.photos || [])]);
      setMessage(`${files.length} additional photo${files.length === 1 ? "" : "s"} uploaded successfully!`);
    } catch {
      setError("Something went wrong while uploading.");
    } finally {
      setUploadingGallery(false);
    }
  }

  async function deleteGalleryPhoto(photoId: string) {
    const response = await fetch(`/api/profile/photos?id=${encodeURIComponent(photoId)}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to delete photo.");
      return;
    }
    setGalleryPhotos((photos) => photos.filter((photo) => photo.id !== photoId));
    const deletedPhoto = galleryPhotos.find((photo) => photo.id === photoId);
    if (deletedPhoto?.url === form.profileImage) {
      setForm((previous) => ({ ...previous, profileImage: "" }));
    }
  }

  async function setMainPhoto(photoId: string) {
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to set main profile photo.");
        return;
      }

      setForm((previous) => ({ ...previous, profileImage: data.profileImage }));
      setMessage("Main profile photo updated.");
    } catch {
      setError("Unable to set main profile photo.");
    }
  }

  async function deleteMainPhoto() {
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile/photo", { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to remove main profile photo.");
        return;
      }

      setForm((previous) => ({ ...previous, profileImage: "" }));
      setMessage("Main profile photo removed.");
    } catch {
      setError("Unable to remove main profile photo.");
    }
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white"><p className="text-gray-400">Loading profile...</p></main>;
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:gap-4 sm:py-4">
          <OnlineStatus />
          <Link href="/profile" aria-label="Back to profile" className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-gray-300 hover:bg-gray-800"><ArrowLeft size={22} /></Link>
          <div><h1 className="text-xl font-bold">Edit Profile</h1><p className="text-sm text-gray-400">Update your information</p></div>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <form onSubmit={saveProfile} className="space-y-6 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:p-6">
          {message && <div className="rounded-xl bg-green-950/60 p-3 text-sm text-green-300">{message}</div>}
          {error && <div className="rounded-xl bg-red-950/60 p-3 text-sm text-red-200">{error}</div>}

          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5">
            <h2 className="mb-4 text-lg font-semibold">Profile Photo</h2>
            <div className="flex flex-col items-center">
              <div className="mb-4">
                {form.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.profileImage}
                    alt="Profile"
                    className="h-32 w-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-pink-100 text-4xl font-bold text-pink-600">
                    {form.firstName
                      ? form.firstName.charAt(0).toUpperCase()
                      : "L"}
                  </div>
                )}
              </div>
              <label className="flex min-h-12 cursor-pointer items-center rounded-xl bg-rose-500 px-5 py-3 font-semibold text-white hover:bg-rose-600">
                Choose Photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadPhoto(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {form.profileImage && (
                <button type="button" onClick={() => void deleteMainPhoto()} className="mt-3 text-sm font-semibold text-red-400 hover:text-red-300">
                  Remove main photo
                </button>
              )}
              <p className="mt-3 text-xs text-gray-500">JPG, PNG or WEBP. Maximum 5MB.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5">
            <h2 className="text-lg font-semibold">Additional Photos</h2>
          <p className="mt-1 text-sm text-gray-400">Upload up to 10 additional photos for people to view. You have {galleryPhotos.length}/10.</p>
            {galleryPhotos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {galleryPhotos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl">
                    <Image src={photo.url} alt="Additional profile" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                    <div className="absolute inset-x-2 bottom-2 flex gap-2">
                      {form.profileImage === photo.url ? (
                        <span className="rounded-md bg-emerald-600/90 px-2 py-1 text-xs font-bold text-white">Main photo</span>
                      ) : (
                        <button type="button" onClick={() => void setMainPhoto(photo.id)} className="rounded-md bg-black/70 px-2 py-1 text-xs text-white hover:bg-black">Set as main</button>
                      )}
                      <button type="button" onClick={() => void deleteGalleryPhoto(photo.id)} className="rounded-md bg-red-600/90 px-2 py-1 text-xs text-white hover:bg-red-700">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {galleryPhotos.length < 10 && (
              <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-600 px-5 py-3 text-center font-semibold text-rose-300 hover:border-rose-400 hover:bg-rose-950/30">
                {uploadingGallery ? "Uploading photos..." : "Add photos"}
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingGallery} onChange={(event) => { const files = Array.from(event.target.files || []); void uploadGalleryPhotos(files); event.currentTarget.value = ""; }} />
              </label>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">First Name<input type="text" value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500" required /></label>
            <label className="block text-sm font-medium">Phone<input type="text" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500" /></label>
            <label className="block text-sm font-medium">County<input type="text" value={form.county} onChange={(event) => updateField("county", event.target.value)} placeholder="e.g. Montserrado" className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500" /></label>
            <label className="block text-sm font-medium">City<input type="text" value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="e.g. Monrovia" className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500" /></label>
          </div>

          <label className="block text-sm font-medium">About Me<textarea value={form.bio} onChange={(event) => updateField("bio", event.target.value)} rows={5} maxLength={500} className="mt-2 w-full resize-none rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500" /><span className="mt-1 block text-right text-xs text-gray-500">{form.bio.length}/500</span></label>

          <div className="border-t border-gray-800 pt-6">
            <h2 className="text-xl font-bold">About yourself</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium">Occupation<input value={form.occupation} onChange={(event) => updateField("occupation", event.target.value)} placeholder="e.g. Teacher" className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500" /></label>
              <label className="block text-sm font-medium">Education<input value={form.education} onChange={(event) => updateField("education", event.target.value)} placeholder="e.g. University" className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500" /></label>
              <label className="block text-sm font-medium">Height<input value={form.height} onChange={(event) => updateField("height", event.target.value)} placeholder="e.g.  five feet eight inches" className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500" /></label>
              <label className="block text-sm font-medium">Languages<input value={form.languages} onChange={(event) => updateField("languages", event.target.value)} placeholder="e.g. English, Kpelle" className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500" /></label>
              <label className="block text-sm font-medium">Interests<input value={form.interests} onChange={(event) => updateField("interests", event.target.value)} placeholder="e.g. Travel, music" className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500" /></label>
              <label className="block text-sm font-medium">Hobbies<input value={form.hobbies} onChange={(event) => updateField("hobbies", event.target.value)} placeholder="e.g. Cooking, football" className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500" /></label>
              <label className="block text-sm font-medium">Religion <span className="font-normal text-gray-500">(optional)</span><input value={form.religion} onChange={(event) => updateField("religion", event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500" /></label>
              <label className="block text-sm font-medium">Smoking preference<select value={form.smokingPreference} onChange={(event) => updateField("smokingPreference", event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500"><option value="">Prefer not to say</option><option>Non-smoker</option><option>Occasionally</option><option>Smoker</option></select></label>
              <label className="block text-sm font-medium">Drinking preference<select value={form.drinkingPreference} onChange={(event) => updateField("drinkingPreference", event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500"><option value="">Prefer not to say</option><option>Never</option><option>Socially</option><option>Often</option></select></label>
              <label className="block text-sm font-medium">Children preference<select value={form.childrenPreference} onChange={(event) => updateField("childrenPreference", event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500"><option value="">Prefer not to say</option><option>Want children</option><option>Do not want children</option><option>Have children</option><option>Open to discussion</option></select></label>
            </div>
          </div>

          <label className="block text-sm font-medium">Relationship Goal<select value={form.relationshipGoal} onChange={(event) => updateField("relationshipGoal", event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500"><option value="">Select your goal</option><option>Long-term relationship</option><option>Marriage</option><option>Serious dating</option><option>Friendship</option><option>Something casual</option></select></label>
          <label className="block text-sm font-medium">Interested In<select value={form.interestedIn} onChange={(event) => updateField("interestedIn", event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 outline-none focus:border-rose-500"><option>Men</option><option>Women</option><option>Everyone</option></select></label>

          <fieldset><legend className="text-sm font-medium">Preferred Age Range</legend><div className="mt-2 grid grid-cols-2 gap-4"><label className="text-xs text-gray-400">Minimum<input type="number" min="18" max="100" value={form.minAge} onChange={(event) => updateField("minAge", Number(event.target.value))} className="mt-1 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-rose-500" /></label><label className="text-xs text-gray-400">Maximum<input type="number" min="18" max="100" value={form.maxAge} onChange={(event) => updateField("maxAge", Number(event.target.value))} className="mt-1 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-rose-500" /></label></div></fieldset>

          {verification && <section className="border-t border-gray-800 pt-6">
            <h2 className="text-xl font-bold">Profile verification</h2>
            <p className="mt-1 text-sm text-gray-400">Verification is optional. Government ID is not required for ordinary registration.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-800 p-4"><p className="font-semibold">Email</p><p className="mt-1 text-sm text-gray-400">{verification.emailVerified ? "✓ Verified" : "Not verified"}</p>{!verification.emailVerified && <><button type="button" onClick={() => { setVerificationType("EMAIL"); void requestVerification(); }} disabled={verificationLoading} className="mt-3 rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Send code</button></>}</div>
              <div className="rounded-xl border border-gray-800 p-4"><p className="font-semibold">Phone</p><p className="mt-1 text-sm text-gray-400">{verification.phoneVerified ? "✓ Verified" : verification.phone ? "Not verified" : "Add a phone number first"}</p>{!verification.phoneVerified && verification.phone && <><button type="button" onClick={() => { setVerificationType("PHONE"); void requestVerification(); }} disabled={verificationLoading} className="mt-3 rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Send code</button></>}</div>
              <div className="rounded-xl border border-gray-800 p-4"><p className="font-semibold">Photo</p><p className="mt-1 text-sm text-gray-400">{verification.photoVerified ? "✓ Verified" : verification.photoVerificationStatus === "PENDING" ? "Review pending" : "Not submitted"}</p>{!verification.photoVerified && verification.photoVerificationStatus !== "PENDING" && <label className="mt-3 inline-flex cursor-pointer rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white">Submit photo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={verificationLoading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void submitPhotoVerification(file); event.currentTarget.value = ""; }} /></label>}</div>
            </div>
            {!verification.emailVerified || !verification.phoneVerified ? <div className="mt-4 flex flex-wrap gap-2"><input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} inputMode="numeric" maxLength={6} placeholder="6-digit code" className="min-h-11 rounded-lg border border-gray-700 bg-gray-950 px-3 text-white" /><button type="button" onClick={() => void confirmVerification()} disabled={verificationLoading || verificationCode.length !== 6} className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">Confirm {verificationType === "EMAIL" ? "email" : "phone"}</button></div> : null}
            {verificationMessage && <p className="mt-3 text-sm text-rose-300">{verificationMessage}</p>}
          </section>}

          <fieldset className="border-t border-gray-800 pt-6">
            <legend className="text-xl font-bold">Privacy controls</legend>
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-800 p-4"><input type="checkbox" checked={form.hideOnlineStatus} onChange={(event) => updateField("hideOnlineStatus", event.target.checked)} className="mt-1 h-5 w-5 accent-rose-500" /><span><span className="block font-semibold">Hide online status</span><span className="text-sm text-gray-400">Other members will not see when you are online.</span></span></label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-800 p-4"><input type="checkbox" checked={form.hideLastActive} onChange={(event) => updateField("hideLastActive", event.target.checked)} className="mt-1 h-5 w-5 accent-rose-500" /><span><span className="block font-semibold">Hide last active</span><span className="text-sm text-gray-400">Hide your recent activity time from other members.</span></span></label>
              <label className="block rounded-xl border border-gray-800 p-4 text-sm font-semibold">Who can message you<select value={form.messagePermission} onChange={(event) => updateField("messagePermission", event.target.value as ProfileForm["messagePermission"])} className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 font-normal outline-none focus:border-rose-500"><option value="EVERYONE">Everyone</option><option value="MATCHES">Matches only</option></select></label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-800 p-4"><input type="checkbox" checked={form.incognitoMode} onChange={(event) => updateField("incognitoMode", event.target.checked)} className="mt-1 h-5 w-5 accent-rose-500" /><span><span className="block font-semibold">Incognito mode</span><span className="text-sm text-gray-400">Hide your profile from discovery until you choose to interact.</span></span></label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-800 p-4"><input type="checkbox" checked={form.profileViewTracking} onChange={(event) => updateField("profileViewTracking", event.target.checked)} className="mt-1 h-5 w-5 accent-rose-500" /><span><span className="block font-semibold">Show profile visitors</span><span className="text-sm text-gray-400">Allow your visits to appear in other members&apos; visitor lists.</span></span></label>
              <p className="rounded-xl bg-gray-950 p-4 text-sm text-gray-400">To hide your profile from a specific person, use Block from their profile or conversation.</p>
            </div>
          </fieldset>

          <button type="submit" disabled={saving} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 font-semibold text-white hover:bg-rose-600 disabled:opacity-50"><Save size={18} />{saving ? "Saving..." : "Save Changes"}</button>
        </form>
      </section>
    </main>
  );
}
