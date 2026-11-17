import { useState, useEffect } from "react";
import { adminApi } from "../../adminApi";

const CONTENT_FIELDS = [
  { key: "cafeName", label: "Cafe Name", type: "text" },
  { key: "heroTitle", label: "Hero Title", type: "text" },
  { key: "heroSubtitle", label: "Hero Subtitle", type: "text" },
  { key: "heroDescription", label: "Hero Description", type: "textarea" },
  { key: "heroImage", label: "Hero Image URL", type: "url" },
  { key: "aboutUs", label: "About Us", type: "textarea" },
  { key: "openingHours", label: "Opening Hours", type: "text" },
  { key: "contactNumber", label: "Contact Number", type: "tel" },
  { key: "address", label: "Address", type: "textarea" },
];

export default function WebsiteContentSection({ onNotify }) {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await adminApi.getWebsiteContent();
        setContent(data || {});
      } catch (err) {
        onNotify(err.message, "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(key, value) {
    setContent((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = await adminApi.updateWebsiteContent(content);
      setContent(data || {});
      setSaved(true);
      onNotify("Website content updated");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-gray-500">Loading content...</p>;

  return (
    <div className="max-w-2xl space-y-5">
      <p className="text-sm text-gray-400">Edit the website content below. Changes will reflect on the customer website after saving.</p>

      <div className="space-y-4">
        {CONTENT_FIELDS.map(({ key, label, type }) => (
          <label key={key} className="block">
            <span className="mb-1.5 block text-sm text-gray-400">{label}</span>
            {type === "textarea" ? (
              <textarea
                rows="3"
                value={content[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold"
              />
            ) : (
              <input
                type={type}
                value={content[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold"
              />
            )}
          </label>
        ))}
      </div>

      {content.heroImage && (
        <div>
          <span className="mb-1.5 block text-sm text-gray-400">Hero Image Preview</span>
          <img src={content.heroImage} alt="Hero preview" className="h-48 w-full rounded-xl object-cover" />
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full rounded-xl py-3 text-sm font-semibold transition ${
          saved
            ? "bg-emerald-500 text-white"
            : "bg-gold text-gray-950 hover:bg-gold-hover"
        } disabled:opacity-50`}
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
