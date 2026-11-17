import { useState, useEffect, useRef } from "react";
import { adminApi } from "../../adminApi";
import { formatPrice } from "../../price";
import ConfirmDialog from "../../components/ConfirmDialog";

const EMPTY_ITEM = { name: "", price: "", category: "", description: "", image: "", available: true, bestseller: false, recommended: false, newArrival: false, chefsSpecial: false, cinephilesPick: false, customersFavourite: false };

export default function MenuManagement({ onNotify }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_ITEM });
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

  async function loadData() {
    try {
      const [menuData, catData] = await Promise.all([
        adminApi.getMenu(),
        adminApi.getCategories(),
      ]);
      setItems(Array.isArray(menuData) ? menuData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function openAdd() {
    setEditItem(null);
    setSelectedFile(null);
    setForm({ ...EMPTY_ITEM, category: categories[0]?.name || "" });
    setShowForm(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setSelectedFile(null);
    setForm({
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description || "",
      image: item.image || "",
      available: item.available,
      bestseller: item.bestseller || false,
      recommended: item.recommended || false,
      newArrival: item.newArrival || false,
      chefsSpecial: item.chefsSpecial || false,
      cinephilesPick: item.cinephilesPick || false,
      customersFavourite: item.customersFavourite || false,
    });
    setShowForm(true);
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
    if (!editItem && !selectedFile && !form.image) {
      onNotify("Please select an image for the menu item", "error");
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        price: Number(form.price),
      };
      if (editItem) {
        await adminApi.updateMenuItem(editItem._id, data, selectedFile);
        onNotify("Menu item updated");
      } else {
        await adminApi.createMenuItem(data, selectedFile);
        onNotify("Menu item added");
      }
      setShowForm(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadData();
      localStorage.setItem("menuUpdated", Date.now()); try { new BroadcastChannel("menu-updates").postMessage("refresh") } catch(e){}
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
      await adminApi.deleteMenuItem(deleteTarget._id);
      setItems((prev) => prev.filter((i) => i._id !== deleteTarget._id));
      onNotify("Menu item deleted successfully.");
      localStorage.setItem("menuUpdated", Date.now()); try { new BroadcastChannel("menu-updates").postMessage("refresh") } catch(e){}
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  async function toggleField(id, field, value) {
    try {
      await adminApi.updateMenuItem(id, { [field]: value });
      setItems((prev) => prev.map((i) => (i._id === id ? { ...i, [field]: value } : i)));
      localStorage.setItem("menuUpdated", Date.now()); try { new BroadcastChannel("menu-updates").postMessage("refresh") } catch(e){}
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  const filtered = items.filter((item) => {
    if (filterCategory !== "All" && item.category !== filterCategory) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      return item.name.toLowerCase().includes(term) || (item.description || "").toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search menu items..."
          className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <button onClick={openAdd} className="btn-3d-flat rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-gray-950">
          + Add Item
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSave} className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white">{editItem ? "Edit Menu Item" : "Add Menu Item"}</h3>

            <label className="block">
              <span className="mb-1 block text-sm text-gray-400">Name *</span>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold" />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-sm text-gray-400">Price (₹) *</span>
                <input type="number" required min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-gray-400">Category *</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold">
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm text-gray-400">Description</span>
              <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold" />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-gray-400">Image {!editItem && <span className="text-red-500">*</span>}</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-3d-flat rounded-xl bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-gold">Choose Image</button>
                {selectedFile && <span className="text-xs text-gray-400">{selectedFile.name}</span>}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} className="hidden" />
              </div>
              {(selectedFile || form.image) && (
                <img src={selectedFile ? URL.createObjectURL(selectedFile) : form.image} alt="Preview" className="mt-2 h-32 w-full rounded-xl border border-gray-700 object-cover" />
              )}
              <p className="mt-1 text-xs text-gray-500">JPG, PNG, or WEBP — max 5 MB{editItem ? ". Leave empty to keep the current image." : ""}</p>
            </label>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="rounded border-gray-600 bg-gray-700 text-gold" />
                Available
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.bestseller} onChange={(e) => setForm({ ...form, bestseller: e.target.checked })} className="rounded border-gray-600 bg-gray-700 text-gold" />
                Bestseller
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.recommended} onChange={(e) => setForm({ ...form, recommended: e.target.checked })} className="rounded border-gray-600 bg-gray-700 text-gold" />
                Recommended
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.newArrival} onChange={(e) => setForm({ ...form, newArrival: e.target.checked })} className="rounded border-gray-600 bg-gray-700 text-gold" />
                New Arrival
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.chefsSpecial} onChange={(e) => setForm({ ...form, chefsSpecial: e.target.checked })} className="rounded border-gray-600 bg-gray-700 text-gold" />
                Chef's Special
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.cinephilesPick} onChange={(e) => setForm({ ...form, cinephilesPick: e.target.checked })} className="rounded border-gray-600 bg-gray-700 text-gold" />
                Cinephile's Pick
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.customersFavourite} onChange={(e) => setForm({ ...form, customersFavourite: e.target.checked })} className="rounded border-gray-600 bg-gray-700 text-gold" />
                Customer's Favourite
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-3d-flat flex-1 rounded-xl bg-gold py-2.5 text-sm font-semibold text-gray-950 disabled:opacity-50">
                {saving ? (editItem ? "Saving..." : "Uploading image...") : editItem ? "Update" : "Add Item"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-3d-flat rounded-xl bg-gray-800 px-5 py-2.5 text-sm text-gray-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-gray-500">Loading menu...</p>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No menu items found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div key={item._id} className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
              {item.image && (
                <img src={item.image} alt={item.name} className="h-40 w-full object-cover" />
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                  </div>
                  <p className="text-lg font-bold text-gold">₹{formatPrice(item.price)}</p>
                </div>
                {item.description && <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {item.bestseller && <span className="rounded-md bg-gold/10 px-2 py-0.5 text-xs text-gold">Bestseller</span>}
                  {item.recommended && <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400">Recommended</span>}
                  {item.newArrival && <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">New Arrival</span>}
                  {item.chefsSpecial && <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400">Chef's Special</span>}
                  {item.cinephilesPick && <span className="rounded-md bg-fuchsia-500/10 px-2 py-0.5 text-xs text-fuchsia-400">Cinephile's Pick</span>}
                  {item.customersFavourite && <span className="rounded-md bg-pink-500/10 px-2 py-0.5 text-xs text-pink-400">Customer's Favourite</span>}
                  <span className={`rounded-md px-2 py-0.5 text-xs ${item.available ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {item.available ? "Available" : "Unavailable"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => openEdit(item)} className="btn-3d-flat rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-400">Edit</button>
                  <button onClick={() => toggleField(item._id, "available", !item.available)} className={`btn-3d-flat rounded-lg px-3 py-1.5 text-xs ${item.available ? "bg-gold/10 text-gold" : "bg-emerald-500/10 text-emerald-400"}`}>
                    {item.available ? "Unavailable" : "Available"}
                  </button>
                  <button onClick={() => toggleField(item._id, "bestseller", !item.bestseller)} className={`btn-3d-flat rounded-lg px-3 py-1.5 text-xs ${item.bestseller ? "bg-gold/20 text-gold" : "bg-gray-800 text-gray-500"}`}>
                    {item.bestseller ? "Unbestseller" : "Bestseller"}
                  </button>
                  <button onClick={() => toggleField(item._id, "recommended", !item.recommended)} className={`btn-3d-flat rounded-lg px-3 py-1.5 text-xs ${item.recommended ? "bg-purple-500/20 text-purple-400" : "bg-gray-800 text-gray-500"}`}>
                    {item.recommended ? "Unrecommend" : "Recommended"}
                  </button>
                  <button onClick={() => toggleField(item._id, "newArrival", !item.newArrival)} className={`btn-3d-flat rounded-lg px-3 py-1.5 text-xs ${item.newArrival ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-500"}`}>
                    {item.newArrival ? "Remove New Arrival" : "New Arrival"}
                  </button>
                  <button onClick={() => toggleField(item._id, "chefsSpecial", !item.chefsSpecial)} className={`btn-3d-flat rounded-lg px-3 py-1.5 text-xs ${item.chefsSpecial ? "bg-orange-500/20 text-orange-400" : "bg-gray-800 text-gray-500"}`}>
                    {item.chefsSpecial ? "Remove Chef's Special" : "Chef's Special"}
                  </button>
                  <button onClick={() => toggleField(item._id, "cinephilesPick", !item.cinephilesPick)} className={`btn-3d-flat rounded-lg px-3 py-1.5 text-xs ${item.cinephilesPick ? "bg-fuchsia-500/20 text-fuchsia-400" : "bg-gray-800 text-gray-500"}`}>
                    {item.cinephilesPick ? "Remove Cinephile's Pick" : "Cinephile's Pick"}
                  </button>
                  <button onClick={() => toggleField(item._id, "customersFavourite", !item.customersFavourite)} className={`btn-3d-flat rounded-lg px-3 py-1.5 text-xs ${item.customersFavourite ? "bg-pink-500/20 text-pink-400" : "bg-gray-800 text-gray-500"}`}>
                    {item.customersFavourite ? "Remove Customer's Favourite" : "Customer's Favourite"}
                  </button>
                  <button onClick={() => setDeleteTarget(item)} className="btn-3d-flat rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Menu Item"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
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
