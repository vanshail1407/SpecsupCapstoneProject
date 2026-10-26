import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Plus, Edit2, Trash2, X, Glasses, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminProducts() {
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [lensWidth, setLensWidth] = useState('');
  const [lensHeight, setLensHeight] = useState('');
  const [bridgeWidth, setBridgeWidth] = useState('');
  const [frameShape, setFrameShape] = useState('Rectangular');
  const [frameMaterial, setFrameMaterial] = useState('Acetate');
  const [frameStatus, setFrameStatus] = useState('active');

  const fetchFrames = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.admin.getFrames();
      setFrames(data);
    } catch (err) {
      setError(err.message || 'Failed to load frames.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrames();
  }, []);

  const openAddModal = () => {
    setEditingFrame(null);
    setName('');
    setBrand('');
    setPrice('');
    setImageUrl('https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80');
    setQuantity(5);
    setDescription('');
    setLensWidth(52);
    setLensHeight(38);
    setBridgeWidth(18);
    setFrameShape('Rectangular');
    setFrameMaterial('Acetate');
    setFrameStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (frame) => {
    setEditingFrame(frame);
    setName(frame.name);
    setBrand(frame.brand);
    setPrice(frame.price);
    setImageUrl(frame.image_url);
    setQuantity(frame.quantity);
    setDescription(frame.description || '');
    setLensWidth(frame.lens_width_mm ?? '');
    setLensHeight(frame.lens_height_mm ?? '');
    setBridgeWidth(frame.bridge_width_mm ?? '');
    setFrameShape(frame.frame_shape || 'Rectangular');
    setFrameMaterial(frame.frame_material || 'Acetate');
    setFrameStatus(frame.frame_status || 'active');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFrame(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      price: parseFloat(price),
      image_url: imageUrl.trim(),
      quantity: parseInt(quantity, 10),
      description: description.trim() || null,
      lens_width_mm: lensWidth !== '' ? parseFloat(lensWidth) : null,
      lens_height_mm: lensHeight !== '' ? parseFloat(lensHeight) : null,
      bridge_width_mm: bridgeWidth !== '' ? parseFloat(bridgeWidth) : null,
      frame_shape: frameShape.trim() || null,
      frame_material: frameMaterial.trim() || null,
      frame_status: frameStatus || 'active',
    };

    try {
      if (editingFrame) {
        await api.admin.updateFrame(editingFrame.id, payload);
        setSuccess('Frame updated successfully.');
      } else {
        await api.admin.createFrame(payload);
        setSuccess('New frame added to inventory.');
      }
      closeModal();
      fetchFrames();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err.message || 'Failed to save frame.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFrame = async (frameId, frameName) => {
    if (!window.confirm(`Are you sure you want to delete "${frameName}"?`)) return;

    try {
      setError('');
      await api.admin.deleteFrame(frameId);
      setSuccess(`Frame "${frameName}" deleted.`);
      fetchFrames();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err.message || 'Failed to delete frame.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Inventory Frames</h2>
          <p className="text-xs text-slate-600">
            Create, view, update, and manage in-shop frame stock
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Frame
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center text-xs text-slate-600">Loading frames...</div>
      )}

      {/* Frames Table */}
      {!loading && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Frame</th>
                  <th className="py-3.5 px-4">Brand</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Dimensions & Style</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {frames.map((frame) => (
                  <tr key={frame.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={frame.image_url}
                          alt={frame.name}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=200&q=80';
                          }}
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{frame.name}</div>
                          {frame.description && (
                            <div className="text-xs text-slate-600 line-clamp-1 max-w-xs">
                              {frame.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">{frame.brand}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      ₹{Number(frame.price).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          frame.quantity > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {frame.quantity > 0 ? `${frame.quantity} units` : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {frame.lens_width_mm && frame.bridge_width_mm && frame.lens_height_mm ? (
                        <div className="space-y-0.5">
                          <span className="inline-block font-mono text-xs font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                            {frame.lens_width_mm} - {frame.bridge_width_mm} - {frame.lens_height_mm} mm
                          </span>
                          <div className="text-[11px] text-slate-500">
                            {frame.frame_shape || 'Standard'} • {frame.frame_material || 'Mixed'}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                          Dimensions Unset
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(frame)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                          title="Edit Frame"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFrame(frame.id, frame.name)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Delete Frame"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {frames.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-xs text-slate-600">
                      No frames in database. Add a frame to populate the catalog.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-6 sm:p-8 shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-900">
                {editingFrame ? 'Edit Frame' : 'Add New Frame'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Frame Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Titan Classic"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Titan"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="2499.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quantity (Stock) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Optical Measurements for Smart Recommendations */}
              <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    Optical Dimensions (mm)
                  </span>
                  <span className="text-[11px] text-indigo-600">Power match & Decentration</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Lens Width (A)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="30"
                      max="75"
                      placeholder="52"
                      value={lensWidth}
                      onChange={(e) => setLensWidth(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Bridge (DBL)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max="30"
                      placeholder="18"
                      value={bridgeWidth}
                      onChange={(e) => setBridgeWidth(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Lens Height (B)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="20"
                      max="65"
                      placeholder="38"
                      value={lensHeight}
                      onChange={(e) => setLensHeight(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Shape</label>
                    <select
                      value={frameShape}
                      onChange={(e) => setFrameShape(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Rectangular">Rectangular</option>
                      <option value="Round">Round</option>
                      <option value="Square">Square</option>
                      <option value="Aviator">Aviator</option>
                      <option value="Cat-Eye">Cat-Eye</option>
                      <option value="Geometric">Geometric</option>
                      <option value="Oval">Oval</option>
                      <option value="Browline">Browline</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Material</label>
                    <select
                      value={frameMaterial}
                      onChange={(e) => setFrameMaterial(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Acetate">Acetate</option>
                      <option value="TR90">TR90 (Ultra-light)</option>
                      <option value="Metal">Metal</option>
                      <option value="Titanium">Titanium</option>
                      <option value="Rimless">Rimless</option>
                      <option value="Semi-Rimless">Semi-Rimless</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Status</label>
                    <select
                      value={frameStatus}
                      onChange={(e) => setFrameStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Image URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Frame material, shape, styling..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>


              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingFrame ? 'Update Frame' : 'Create Frame'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
