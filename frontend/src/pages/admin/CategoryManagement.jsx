import { useState, useEffect } from "react";
import { adminApi } from "../../adminApi";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function CategoryManagement({ onNotify }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadCategories() {
    try {
      const data = await adminApi.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCategories(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await adminApi.createCategory({ name: newName.trim() });
      setNewName("");
      onNotify("Category added");
      loadCategories();
      localStorage.setItem("menuUpdated", Date.now()); try { new BroadcastChannel("menu-updates").postMessage("refresh") } catch(e){}
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return;
    try {
      await adminApi.updateCategory(id, { name: editName.trim() });
      setEditId(null);
      setEditName("");
      onNotify("Category updated");
      loadCategories();
      localStorage.setItem("menuUpdated", Date.now()); try { new BroadcastChannel("menu-updates").postMessage("refresh") } catch(e){}
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteCategory(deleteTarget._id);
      setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      onNotify("Category deleted successfully.");
      localStorage.setItem("menuUpdated", Date.now()); try { new BroadcastChannel("menu-updates").postMessage("refresh") } catch(e){}
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  async function moveUp(index) {
    if (index === 0) return;
    const updated = [...categories];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setCategories(updated);
    try {
      const order = updated.map((c, i) => ({ id: c._id, order: i }));
      await adminApi.reorderCategories(order);
    } catch (err) {
      onNotify(err.message, "error");
      loadCategories();
    }
  }

  async function moveDown(index) {
    if (index === categories.length - 1) return;
    const updated = [...categories];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setCategories(updated);
    try {
      const order = updated.map((c, i) => ({ id: c._id, order: i }));
      await adminApi.reorderCategories(order);
    } catch (err) {
      onNotify(err.message, "error");
      loadCategories();
    }
  }

  if (loading) return <p className="py-16 text-center text-gray-500">Loading categories...</p>;

  return (
    <div className="space-y-5 max-w-xl">
      <form onSubmit={handleAdd} className="flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name..."
          className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-gold"
        />
        <button type="submit" disabled={saving || !newName.trim()} className="btn-3d-flat rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-gray-950 disabled:opacity-50">
          + Add
        </button>
      </form>

      {categories.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No categories yet.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat, index) => (
            <div key={cat._id} className="flex items-center gap-3 rounded-xl bg-gray-900 border border-gray-800 px-4 py-3">
              <span className="w-6 text-center text-xs text-gray-500">{index + 1}</span>
              {editId === cat._id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdate(cat._id)}
                  autoFocus
                  className="flex-1 rounded-lg border border-gold bg-gray-800 px-3 py-1.5 text-sm text-white outline-none"
                />
              ) : (
                <span className="flex-1 text-sm text-white">{cat.name}</span>
              )}
              <div className="flex gap-1.5">
                <button onClick={() => moveUp(index)} disabled={index === 0} className="btn-3d-flat rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400 disabled:opacity-30">↑</button>
                <button onClick={() => moveDown(index)} disabled={index === categories.length - 1} className="btn-3d-flat rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400 disabled:opacity-30">↓</button>
                {editId === cat._id ? (
                  <>
                    <button onClick={() => handleUpdate(cat._id)} className="btn-3d-flat rounded-lg bg-gold/10 px-2 py-1 text-xs text-gold">Save</button>
                    <button onClick={() => { setEditId(null); setEditName(""); }} className="btn-3d-flat rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditId(cat._id); setEditName(cat.name); }} className="btn-3d-flat rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400">Edit</button>
                    <button onClick={() => setDeleteTarget(cat)} className="btn-3d-flat rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400">Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
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
