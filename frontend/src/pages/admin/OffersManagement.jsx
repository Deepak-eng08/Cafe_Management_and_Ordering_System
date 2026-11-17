import { useState, useEffect, useRef } from "react";
import { adminApi } from "../../adminApi";
import ConfirmDialog from "../../components/ConfirmDialog";

const DURATION_OPTIONS = [
  { value: "custom", label: "Custom Date Range" },
  { value: "today", label: "Today Only" },
  { value: "tomorrow", label: "Until Tomorrow" },
  { value: "7days", label: "7 Days" },
  { value: "30days", label: "30 Days" },
  { value: "year", label: "Whole Year" },
];

const EMPTY_OFFER = { title: "", description: "", image: "", duration: "custom", startDate: "", endDate: "" };

function toInputDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

function computePreviewDates(duration, startDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (duration) {
    case "today":
      return { start: toInputDate(today), end: toInputDate(today) };
    case "tomorrow": {
      const t = new Date(today);
      t.setDate(t.getDate() + 1);
      return { start: toInputDate(today), end: toInputDate(t) };
    }
    case "7days": {
      const e = new Date(today);
      e.setDate(e.getDate() + 7);
      return { start: toInputDate(today), end: toInputDate(e) };
    }
    case "30days": {
      const e = new Date(today);
      e.setDate(e.getDate() + 30);
      return { start: toInputDate(today), end: toInputDate(e) };
    }
    case "year": {
      const s = startDate ? new Date(startDate) : today;
      const endYear = s.getFullYear();
      return { start: toInputDate(s), end: `${endYear}-12-31` };
    }
    case "custom":
    default:
      return { start: startDate || "", end: "" };
  }
}

export default function OffersManagement({ onNotify }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editOffer, setEditOffer] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_OFFER });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

  async function loadOffers() {
    try {
      const data = await adminApi.getOffers();
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOffers(); }, []);

  function openAdd() {
    setEditOffer(null);
    setSelectedFile(null);
    const preview = computePreviewDates("custom", "");
    setForm({ ...EMPTY_OFFER, ...preview });
    setShowForm(true);
  }

  function openEdit(offer) {
    setEditOffer(offer);
    setSelectedFile(null);
    const dur = offer.duration || "custom";
    const preview = computePreviewDates(dur, toInputDate(offer.startDate));
    setForm({
      title: offer.title,
      description: offer.description || "",
      image: offer.image || "",
      duration: dur,
      startDate: preview.start,
      endDate: preview.end,
    });
    setShowForm(true);
  }

  function handleDurationChange(dur) {
    const preview = computePreviewDates(dur, form.startDate);
    setForm({ ...form, duration: dur, startDate: preview.start, endDate: preview.end });
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      onNotify("Only JPG, JPEG, PNG, or WEBP images are allowed", "error");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onNotify("Image is too large. Maximum size is 5 MB", "error");
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (saving) return;
    if (!editOffer && !selectedFile && !form.image) {
      onNotify("Please select an image for the offer", "error");
      return;
    }
    setSaving(true);
    try {
      const data = { ...form };
      if (editOffer) {
        await adminApi.updateOffer(editOffer._id, data, selectedFile);
        onNotify("Offer updated");
      } else {
        await adminApi.createOffer(data, selectedFile);
        onNotify("Offer created");
      }
      setShowForm(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadOffers();
      localStorage.setItem("offerUpdated", Date.now());
      try { new BroadcastChannel("offer-updates").postMessage("refresh") } catch(e){}
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteOffer(deleteTarget._id);
      setOffers((prev) => prev.filter((o) => o._id !== deleteTarget._id));
      onNotify("Offer deleted successfully.");
      localStorage.setItem("offerUpdated", Date.now());
      try { new BroadcastChannel("offer-updates").postMessage("refresh") } catch(e){}
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const isCustom = form.duration === "custom";
  const isYear = form.duration === "year";
  const showStartOnly = isYear;
  const showEndOnly = false;
  const showBothDates = isCustom;
  const hideDates = !isCustom && !isYear;

  const statusBadge = (status) => {
    switch (status) {
      case "active":
        return <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">Active</span>;
      case "upcoming":
        return <span className="rounded-lg bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">Upcoming</span>;
      case "expired":
        return <span className="rounded-lg bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">Expired</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={openAdd} className="btn-3d-flat rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-gray-950">
          + Add Offer
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSave} className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white">{editOffer ? "Edit Offer" : "Add Offer"}</h3>

            <label className="block">
              <span className="mb-1 block text-sm text-gray-400">Offer Title *</span>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold" />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-gray-400">Description</span>
              <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold" />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-gray-400">Offer Image {!editOffer && <span className="text-red-500">*</span>}</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-3d-flat rounded-xl bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-gold">Choose Image</button>
                {selectedFile && <span className="text-xs text-gray-400">{selectedFile.name}</span>}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} className="hidden" />
              </div>
              {(selectedFile || form.image) && (
                <img src={selectedFile ? URL.createObjectURL(selectedFile) : form.image} alt="Preview" className="mt-2 h-32 w-full rounded-xl border border-gray-700 object-cover" />
              )}
              <p className="mt-1 text-xs text-gray-500">JPG, PNG, or WEBP — max 5 MB. Uploads automatically to Cloudinary.{editOffer ? " Leave empty to keep the current image." : ""}</p>
            </label>

            <div>
              <span className="mb-2 block text-sm text-gray-400">Offer Duration *</span>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleDurationChange(opt.value)}
                    className={`btn-3d-flat rounded-xl px-3 py-2.5 text-xs font-semibold ${
                      form.duration === opt.value
                        ? "bg-gold/20 text-gold ring-1 ring-gold/50"
                        : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {!hideDates && (
              <div className="grid grid-cols-2 gap-4">
                {(showBothDates || showStartOnly) && (
                  <label className="block">
                    <span className="mb-1 block text-sm text-gray-400">Start Date *</span>
                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(e) => {
                        if (isYear) {
                          const preview = computePreviewDates("year", e.target.value);
                          setForm({ ...form, startDate: preview.start, endDate: preview.end });
                        } else {
                          setForm({ ...form, startDate: e.target.value });
                        }
                      }}
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold"
                    />
                  </label>
                )}
                {showBothDates && (
                  <label className="block">
                    <span className="mb-1 block text-sm text-gray-400">End Date *</span>
                    <input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold" />
                  </label>
                )}
              </div>
            )}

            {hideDates && (
              <p className="text-xs text-gray-500">
                Dates are set automatically. Starts today and expires based on the selected duration.
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-3d-flat flex-1 rounded-xl bg-gold py-2.5 text-sm font-semibold text-gray-950 disabled:opacity-50">
                {saving ? (editOffer ? "Saving..." : "Uploading image...") : editOffer ? "Update" : "Create Offer"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-3d-flat rounded-xl bg-gray-800 px-5 py-2.5 text-sm text-gray-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-gray-500">Loading offers...</p>
      ) : offers.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No offers yet.</p>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => {
            const start = new Date(offer.startDate);
            const end = new Date(offer.endDate);
            const status = offer.status || "active";
            const durLabel = DURATION_OPTIONS.find((d) => d.value === offer.duration)?.label || "Custom";
            return (
              <div key={offer._id} className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{offer.title}</p>
                    {offer.description && <p className="mt-1 text-sm text-gray-400">{offer.description}</p>}
                    <p className="mt-2 text-xs text-gray-500">
                      {start.toLocaleDateString()} — {end.toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {statusBadge(status)}
                      <span className="rounded-lg bg-gray-700/50 px-2 py-0.5 text-xs font-medium text-gray-400">
                        {durLabel}
                      </span>
                    </div>
                  </div>
                  {offer.image && <img src={offer.image} alt={offer.title} className="h-16 w-24 rounded-lg object-cover" />}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(offer)} className="btn-3d-flat rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-400">Edit</button>
                  <button onClick={() => setDeleteTarget(offer)} className="btn-3d-flat rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Offer"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        icon="🗑️"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
