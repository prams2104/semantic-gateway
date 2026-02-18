'use client';

import { useState, useEffect } from 'react';

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  type: string;
  cuisine: string | null;
  priceRange: string | null;
  description: string | null;
  imageUrl: string | null;
  phone: string | null;
  email: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  ratingValue: number | null;
  reviewCount: number | null;
  reservationUrl: string | null;
  orderUrl: string | null;
  directionsUrl: string | null;
  menuUrl: string | null;
  status: string;
  lastVerified: string | null;
  lastAuditScore: number | null;
  hours: { id: string; dayOfWeek: string; opens: string; closes: string; isClosed: boolean; label: string | null }[];
  menuSections: { id: string; name: string; sortOrder: number; items: { id: string; name: string; description: string | null; price: number | null; currency: string; dietaryFlags: string[]; available: boolean; sortOrder: number }[] }[];
  verifiedFields: { id: string; fieldName: string; provenance: string; confidence: number; lastVerified: string; notes: string | null }[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // New restaurant form
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newWebsite, setNewWebsite] = useState('');

  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/restaurants', { headers });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setRestaurants(data);
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/admin/restaurants', { headers: { ...headers, Authorization: `Bearer ${secret}` } });
      if (res.ok) { setAuthed(true); await fetchAll(); }
      else { setMsg('Invalid secret'); }
    } catch { setMsg('Connection failed'); }
  };

  const handleCreate = async () => {
    if (!newName || !newSlug || !newWebsite) { setMsg('All fields required'); return; }
    try {
      const res = await fetch('/api/admin/restaurants', {
        method: 'POST', headers,
        body: JSON.stringify({ name: newName, slug: newSlug, websiteUrl: newWebsite }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const created = await res.json();
      setRestaurants(prev => [created, ...prev]);
      setSelected(created);
      setShowCreate(false);
      setNewName(''); setNewSlug(''); setNewWebsite('');
      setMsg('Created!');
    } catch (e: any) { setMsg(e.message); }
  };

  const handleImport = async () => {
    if (!selected || !importUrl) return;
    setLoading(true); setMsg('Importing...');
    try {
      const res = await fetch(`/api/admin/restaurants/${selected.id}/import`, {
        method: 'POST', headers,
        body: JSON.stringify({ url: importUrl }),
      });
      if (!res.ok) throw new Error('Import failed');
      const data = await res.json();
      const s = data.suggested_fields;

      // Merge suggested fields into selected
      setSelected(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          name: s.name || prev.name,
          type: s.type || prev.type,
          cuisine: s.cuisine || prev.cuisine,
          priceRange: s.priceRange || prev.priceRange,
          description: s.description || prev.description,
          phone: s.phone || prev.phone,
          email: s.email || prev.email,
          imageUrl: s.imageUrl || prev.imageUrl,
          streetAddress: s.streetAddress || prev.streetAddress,
          city: s.city || prev.city,
          state: s.state || prev.state,
          postalCode: s.postalCode || prev.postalCode,
          ratingValue: s.ratingValue ?? prev.ratingValue,
          reviewCount: s.reviewCount ?? prev.reviewCount,
          menuUrl: s.menuUrl || prev.menuUrl,
          reservationUrl: s.reservationUrl || prev.reservationUrl,
          hours: s.hours?.length ? s.hours.map((h: any) => ({
            id: '', dayOfWeek: h.dayOfWeek, opens: h.opens, closes: h.closes, isClosed: false, label: null,
          })) : prev.hours,
        };

        // Merge heuristic menu sections if available
        if (s.menuSections?.length && prev.menuSections.length === 0) {
          updated.menuSections = s.menuSections.map((sec: any, i: number) => ({
            id: `temp-${i}`,
            name: sec.name,
            sortOrder: i,
            items: sec.items.map((item: any, j: number) => ({
              id: `temp-${i}-${j}`,
              name: item.name,
              description: item.description,
              price: item.price,
              currency: 'USD',
              dietaryFlags: [],
              available: true,
              sortOrder: j,
            })),
          }));
        }

        return updated;
      });

      const menuCount = data.heuristic_menu_items?.length || 0;
      const hoursCount = data.heuristic_hours?.length || 0;
      const parts = [`${data.suggested_confidence.length} fields`];
      if (menuCount) parts.push(`${menuCount} menu items`);
      if (hoursCount) parts.push(`${hoursCount} hour entries`);
      setMsg(`Imported ${parts.join(', ')} from ${importUrl}`);
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${selected.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({
          name: selected.name,
          type: selected.type,
          cuisine: selected.cuisine,
          priceRange: selected.priceRange,
          description: selected.description,
          phone: selected.phone,
          email: selected.email,
          imageUrl: selected.imageUrl,
          streetAddress: selected.streetAddress,
          city: selected.city,
          state: selected.state,
          postalCode: selected.postalCode,
          ratingValue: selected.ratingValue,
          reviewCount: selected.reviewCount,
          menuUrl: selected.menuUrl,
          reservationUrl: selected.reservationUrl,
          orderUrl: selected.orderUrl,
          directionsUrl: selected.directionsUrl,
          hours: selected.hours.map(h => ({
            dayOfWeek: h.dayOfWeek,
            opens: h.opens,
            closes: h.closes,
            isClosed: h.isClosed,
            label: h.label,
          })),
          menuSections: selected.menuSections.map((sec, i) => ({
            name: sec.name,
            sortOrder: i,
            items: sec.items.map((item, j) => ({
              name: item.name,
              description: item.description,
              price: item.price,
              currency: item.currency,
              dietaryFlags: item.dietaryFlags,
              available: item.available,
              sortOrder: j,
            })),
          })),
          verifiedFields: selected.verifiedFields.map(vf => ({
            fieldName: vf.fieldName,
            provenance: vf.provenance,
            confidence: Math.max(0, Math.min(1, parseFloat(String(vf.confidence)) || 0)),
            notes: vf.notes,
          })),
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      setSelected(updated);
      setRestaurants(prev => prev.map(r => r.id === updated.id ? updated : r));
      setMsg('Saved!');
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  };

  const handlePublish = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${selected.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ status: 'published' }),
      });
      if (!res.ok) throw new Error('Publish failed');
      const updated = await res.json();
      setSelected(updated);
      setRestaurants(prev => prev.map(r => r.id === updated.id ? updated : r));
      setMsg('Published!');
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected || !confirm('Delete this restaurant?')) return;
    try {
      await fetch(`/api/admin/restaurants/${selected.id}`, { method: 'DELETE', headers });
      setRestaurants(prev => prev.filter(r => r.id !== selected.id));
      setSelected(null);
      setMsg('Deleted');
    } catch (e: any) { setMsg(e.message); }
  };

  const updateField = (field: string, value: any) => {
    setSelected(prev => prev ? { ...prev, [field]: value } : null);
  };

  const updateHour = (day: string, field: string, value: any) => {
    setSelected(prev => {
      if (!prev) return null;
      const hours = [...prev.hours];
      const idx = hours.findIndex(h => h.dayOfWeek === day);
      if (idx >= 0) {
        hours[idx] = { ...hours[idx], [field]: value };
      } else {
        hours.push({ id: '', dayOfWeek: day, opens: '', closes: '', isClosed: false, label: null, [field]: value });
      }
      return { ...prev, hours };
    });
  };

  // ── Menu helpers ──────────────────────────────────────────────────────────

  const addMenuSection = () => {
    setSelected(prev => {
      if (!prev) return null;
      const newSection = {
        id: `new-${Date.now()}`,
        name: '',
        sortOrder: prev.menuSections.length,
        items: [],
      };
      return { ...prev, menuSections: [...prev.menuSections, newSection] };
    });
  };

  const removeMenuSection = (sectionIndex: number) => {
    setSelected(prev => {
      if (!prev) return null;
      const sections = prev.menuSections.filter((_, i) => i !== sectionIndex);
      return { ...prev, menuSections: sections };
    });
  };

  const updateSectionName = (sectionIndex: number, name: string) => {
    setSelected(prev => {
      if (!prev) return null;
      const sections = [...prev.menuSections];
      sections[sectionIndex] = { ...sections[sectionIndex], name };
      return { ...prev, menuSections: sections };
    });
  };

  const addMenuItem = (sectionIndex: number) => {
    setSelected(prev => {
      if (!prev) return null;
      const sections = [...prev.menuSections];
      const section = { ...sections[sectionIndex] };
      const newItem = {
        id: `new-${Date.now()}-${section.items.length}`,
        name: '',
        description: null as string | null,
        price: null as number | null,
        currency: 'USD',
        dietaryFlags: [] as string[],
        available: true,
        sortOrder: section.items.length,
      };
      section.items = [...section.items, newItem];
      sections[sectionIndex] = section;
      return { ...prev, menuSections: sections };
    });
  };

  const removeMenuItem = (sectionIndex: number, itemIndex: number) => {
    setSelected(prev => {
      if (!prev) return null;
      const sections = [...prev.menuSections];
      const section = { ...sections[sectionIndex] };
      section.items = section.items.filter((_, i) => i !== itemIndex);
      sections[sectionIndex] = section;
      return { ...prev, menuSections: sections };
    });
  };

  const updateMenuItem = (sectionIndex: number, itemIndex: number, field: string, value: any) => {
    setSelected(prev => {
      if (!prev) return null;
      const sections = [...prev.menuSections];
      const section = { ...sections[sectionIndex] };
      const items = [...section.items];
      items[itemIndex] = { ...items[itemIndex], [field]: value };
      section.items = items;
      sections[sectionIndex] = section;
      return { ...prev, menuSections: sections };
    });
  };

  const updateVerifiedField = (vfId: string, field: string, value: any) => {
    setSelected(prev => {
      if (!prev) return null;
      const verifiedFields = prev.verifiedFields.map(vf =>
        vf.id === vfId ? { ...vf, [field]: value } : vf
      );
      return { ...prev, verifiedFields };
    });
  };

  const PROVENANCE_OPTIONS = [
    { value: 'owner-submitted', label: 'Owner verified', icon: '✓' },
    { value: 'manual-entry', label: 'Manual entry', icon: '✏' },
    { value: 'json-ld-extracted', label: 'JSON-LD extracted', icon: '📋' },
    { value: 'heuristic-parsed', label: 'Heuristic parsed', icon: '🤖' },
    { value: 'regex-body-text', label: 'Regex / body text', icon: '🔍' },
  ];

  // Login screen
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e8e8', fontFamily: 'system-ui', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Semantic Gateway Admin</h1>
          <input
            type="password" value={secret} onChange={e => setSecret(e.target.value)}
            placeholder="Admin secret" onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ padding: '12px 16px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#e8e8e8', fontSize: '1rem', width: '280px', marginBottom: '12px', display: 'block' }}
          />
          <button onClick={handleLogin}
            style={{ padding: '12px 32px', background: '#e8e8e8', color: '#0a0a0a', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            Login
          </button>
          {msg && <p style={{ color: '#f87171', marginTop: '12px', fontSize: '0.9rem' }}>{msg}</p>}
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px',
    color: '#e8e8e8', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e8e8', fontFamily: 'system-ui' }}>
      {/* Top bar */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem' }}>SG Admin</div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {msg && <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>{msg}</span>}
          <button onClick={() => { setShowCreate(true); setSelected(null); }}
            style={{ padding: '8px 16px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
            + New Restaurant
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
        {/* Sidebar — restaurant list */}
        <div style={{ width: '280px', borderRight: '1px solid #1e1e1e', padding: '16px', overflowY: 'auto' }}>
          {loading && <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Loading...</p>}
          {restaurants.map(r => (
            <div key={r.id} onClick={() => { setSelected(r); setShowCreate(false); }}
              style={{
                padding: '12px 14px', borderRadius: '8px', marginBottom: '4px', cursor: 'pointer',
                background: selected?.id === r.id ? '#1e1e1e' : 'transparent',
              }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{r.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', gap: '8px' }}>
                <span>/r/{r.slug}</span>
                <span style={{
                  color: r.status === 'published' ? '#22c55e' : r.status === 'verified' ? '#eab308' : '#6b7280',
                }}>
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {/* Create form */}
          {showCreate && (
            <div style={{ maxWidth: '500px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px', marginTop: 0 }}>Create Restaurant</h2>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} placeholder="George's at the Cove" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Slug (URL-safe)</label>
                <input value={newSlug} onChange={e => setNewSlug(e.target.value)} style={inputStyle} placeholder="georges-at-the-cove" />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Website URL</label>
                <input value={newWebsite} onChange={e => setNewWebsite(e.target.value)} style={inputStyle} placeholder="https://www.georgesatthecove.com" />
              </div>
              <button onClick={handleCreate}
                style={{ padding: '10px 24px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                Create
              </button>
            </div>
          )}

          {/* Edit form */}
          {selected && !showCreate && (
            <div style={{ maxWidth: '720px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>{selected.name}</h2>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                    /r/{selected.slug} · {selected.status}
                    {selected.lastVerified && ` · Verified ${new Date(selected.lastVerified).toLocaleDateString()}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSave} disabled={loading}
                    style={{ padding: '8px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                    Save
                  </button>
                  <button onClick={handlePublish} disabled={loading}
                    style={{ padding: '8px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                    Publish
                  </button>
                  <button onClick={handleDelete}
                    style={{ padding: '8px 20px', background: '#333', color: '#f87171', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                    Delete
                  </button>
                </div>
              </div>

              {/* Import from URL */}
              <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '16px', marginBottom: '28px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Import from URL</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={importUrl} onChange={e => setImportUrl(e.target.value)}
                    placeholder={selected.websiteUrl} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={handleImport} disabled={loading}
                    style={{ padding: '10px 20px', background: '#fbbf24', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                    {loading ? 'Importing...' : 'Import'}
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '6px' }}>
                  Runs the extraction engine and pre-fills fields from JSON-LD + contact info. Review before saving.
                </div>
              </div>

              {/* Fields grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                {[
                  { key: 'name', label: 'Name' },
                  { key: 'type', label: 'Type (Schema.org)' },
                  { key: 'cuisine', label: 'Cuisine' },
                  { key: 'priceRange', label: 'Price Range' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'email', label: 'Email' },
                  { key: 'streetAddress', label: 'Street Address' },
                  { key: 'city', label: 'City' },
                  { key: 'state', label: 'State' },
                  { key: 'postalCode', label: 'Postal Code' },
                  { key: 'ratingValue', label: 'Rating (0-5)' },
                  { key: 'reviewCount', label: 'Review Count' },
                  { key: 'reservationUrl', label: 'Reservation URL' },
                  { key: 'orderUrl', label: 'Order URL' },
                  { key: 'directionsUrl', label: 'Directions URL' },
                  { key: 'menuUrl', label: 'Menu URL' },
                  { key: 'imageUrl', label: 'Image URL' },
                  { key: 'websiteUrl', label: 'Website URL' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label}</label>
                    <input
                      value={(selected as any)[f.key] ?? ''}
                      onChange={e => updateField(f.key, e.target.value || null)}
                      style={inputStyle}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={selected.description ?? ''}
                    onChange={e => updateField('description', e.target.value || null)}
                    style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Hours editor */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Hours</h3>
                <div style={{ background: '#111', borderRadius: '10px', padding: '16px' }}>
                  {DAYS.map(day => {
                    const h = selected.hours.find(hr => hr.dayOfWeek === day);
                    return (
                      <div key={day} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ width: '80px', fontSize: '0.85rem', color: '#a8a29e' }}>{day.substring(0, 3)}</span>
                        <input value={h?.opens ?? ''} onChange={e => updateHour(day, 'opens', e.target.value)}
                          placeholder="11:00" style={{ ...inputStyle, width: '100px' }} />
                        <span style={{ color: '#6b7280' }}>—</span>
                        <input value={h?.closes ?? ''} onChange={e => updateHour(day, 'closes', e.target.value)}
                          placeholder="22:00" style={{ ...inputStyle, width: '100px' }} />
                        <label style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input type="checkbox" checked={h?.isClosed ?? false}
                            onChange={e => updateHour(day, 'isClosed', e.target.checked)} />
                          Closed
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Menu editor */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    Menu ({selected.menuSections.reduce((n, s) => n + s.items.length, 0)} items)
                  </h3>
                  <button onClick={addMenuSection}
                    style={{ padding: '6px 14px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
                    + Add Section
                  </button>
                </div>

                {selected.menuSections.length === 0 && (
                  <div style={{ background: '#111', borderRadius: '10px', padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
                    No menu sections yet. Click &quot;+ Add Section&quot; to start building the menu.
                  </div>
                )}

                {selected.menuSections.map((sec, si) => (
                  <div key={sec.id || si} style={{ background: '#111', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
                    {/* Section header */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                      <input
                        value={sec.name}
                        onChange={e => updateSectionName(si, e.target.value)}
                        placeholder="Section name (e.g. Appetizers, Mains, Desserts)"
                        style={{ ...inputStyle, flex: 1, fontWeight: 700, color: '#fbbf24', background: '#0a0a0a' }}
                      />
                      <button onClick={() => removeMenuSection(si)}
                        style={{ padding: '6px 12px', background: '#333', color: '#f87171', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        Remove Section
                      </button>
                    </div>

                    {/* Items */}
                    {sec.items.map((item, ii) => (
                      <div key={item.id || ii} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 0', borderTop: ii > 0 ? '1px solid #1e1e1e' : 'none' }}>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 90px', gap: '6px' }}>
                          <input
                            value={item.name}
                            onChange={e => updateMenuItem(si, ii, 'name', e.target.value)}
                            placeholder="Item name"
                            style={{ ...inputStyle, fontSize: '0.85rem' }}
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={item.price ?? ''}
                            onChange={e => updateMenuItem(si, ii, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="Price"
                            style={{ ...inputStyle, fontSize: '0.85rem', textAlign: 'right' }}
                          />
                          <input
                            value={item.description ?? ''}
                            onChange={e => updateMenuItem(si, ii, 'description', e.target.value || null)}
                            placeholder="Description (optional)"
                            style={{ ...inputStyle, fontSize: '0.8rem', color: '#a8a29e', gridColumn: '1 / -1' }}
                          />
                          <input
                            value={item.dietaryFlags.join(', ')}
                            onChange={e => updateMenuItem(si, ii, 'dietaryFlags', e.target.value ? e.target.value.split(',').map(s => s.trim()) : [])}
                            placeholder="Dietary flags (e.g. GF, V, VG)"
                            style={{ ...inputStyle, fontSize: '0.75rem', color: '#6b7280', gridColumn: '1 / -1' }}
                          />
                        </div>
                        <button onClick={() => removeMenuItem(si, ii)}
                          style={{ padding: '8px', background: 'none', color: '#6b7280', border: 'none', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
                          title="Remove item">
                          &times;
                        </button>
                      </div>
                    ))}

                    {/* Add item button */}
                    <button onClick={() => addMenuItem(si)}
                      style={{ marginTop: '10px', padding: '6px 14px', background: '#1e1e1e', color: '#a8a29e', border: '1px dashed #333', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', width: '100%' }}>
                      + Add Item
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
                {selected.status === 'published' && (
                  <>
                    <a href={`/r/${selected.slug}`} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '8px 16px', background: '#1e1e1e', color: '#e8e8e8', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem' }}>
                      View Profile →
                    </a>
                    <a href={`/api/v1/restaurants/${selected.id}`} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '8px 16px', background: '#1e1e1e', color: '#e8e8e8', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem' }}>
                      JSON Endpoint →
                    </a>
                    <div style={{ padding: '8px 16px', background: '#1e1e1e', borderRadius: '6px', fontSize: '0.85rem', color: '#a8a29e' }}>
                      Embed: {'<'}script src=&quot;/api/embed/{selected.id}&quot;{'>'}&lt;/script&gt;
                    </div>
                  </>
                )}
                <a href={`/report`} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '8px 16px', background: '#1e1e1e', color: '#fbbf24', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem' }}>
                  Run AI Audit →
                </a>
              </div>

              {/* Verified fields — editable */}
              {selected.verifiedFields.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Verified Fields</h3>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '12px' }}>
                    Edit confidence (0–1), provenance, and notes. Click Save to persist.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                    {selected.verifiedFields.map(vf => {
                      const conf = Math.max(0, Math.min(1, Number(vf.confidence) || 0));
                      const nextDue = vf.lastVerified ? new Date(new Date(vf.lastVerified).getTime() + 30 * 24 * 60 * 60 * 1000) : null;
                      const provOpt = PROVENANCE_OPTIONS.find(p => p.value === vf.provenance) || PROVENANCE_OPTIONS[1];
                      return (
                        <div key={vf.id} style={{ background: '#111', borderRadius: '8px', padding: '14px', border: '1px solid #222' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span title={provOpt.label}>{provOpt.icon}</span> {vf.fieldName}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '2px' }}>Confidence (0–1)</label>
                              <input
                                type="number"
                                min={0}
                                max={1}
                                step={0.1}
                                value={conf}
                                onChange={e => updateVerifiedField(vf.id, 'confidence', Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
                                style={{ ...inputStyle, width: '100%', fontSize: '0.85rem', padding: '6px 10px' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '2px' }}>Provenance</label>
                              <select
                                value={vf.provenance}
                                onChange={e => updateVerifiedField(vf.id, 'provenance', e.target.value)}
                                style={{ ...inputStyle, width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                              >
                                {PROVENANCE_OPTIONS.map(p => (
                                  <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '2px' }}>Notes</label>
                              <input
                                value={vf.notes ?? ''}
                                onChange={e => updateVerifiedField(vf.id, 'notes', e.target.value || null)}
                                placeholder="Optional"
                                style={{ ...inputStyle, width: '100%', fontSize: '0.8rem', padding: '6px 10px', color: '#a8a29e' }}
                              />
                            </div>
                            {nextDue && (
                              <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                Verify by {nextDue.toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!selected && !showCreate && (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: '#6b7280' }}>
              <p style={{ fontSize: '1.1rem' }}>Select a restaurant or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
