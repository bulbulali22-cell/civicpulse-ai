
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutDashboard, MapPin, ClipboardList, Bell, Users,
  Settings, Search, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, ArrowUpRight, ArrowDownRight,
  Filter, ChevronDown, MoreHorizontal, ShieldCheck,
  Activity, CalendarDays, X, Menu
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const INITIAL_MOCKS = [
  {
    id: 'mock-1',
    title: 'Severe Asphalt Potholes',
    location: 'Main Junction, Block A',
    category: 'Pothole',
    severity: 9,
    status: 'In Progress',
    latitude: 27.6033,
    longitude: 77.5957,
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    deadline_hours: '24h remaining'
  },
  {
    id: 'mock-2',
    title: 'Overflowing Municipal Wastebin',
    location: 'Sanjay Chowk Walking Path',
    category: 'Garbage',
    severity: 7,
    status: 'Pending',
    latitude: 27.6050,
    longitude: 77.5980,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    deadline_hours: '72h remaining'
  },
  {
    id: 'mock-3',
    title: 'Defunct Streetlight',
    location: 'Sector 4, Metro Pillar 12',
    category: 'Streetlight',
    severity: 5,
    status: 'Resolved',
    latitude: 27.6010,
    longitude: 77.5930,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    deadline_hours: 'SLA Met'
  }
];

const statusStyles = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-100',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Rejected: 'bg-red-50 text-red-700 border-red-100'
};

const formatDate = (date) => {
  if (!date) return 'Recently';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export default function AdminDashboard() {
  const [dbComplaints, setDbComplaints] = useState([]);
  const [mockComplaints, setMockComplaints] = useState(INITIAL_MOCKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [activeSection, setActiveSection] = useState('overview');
  const [updatingId, setUpdatingId] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(null);

  const complaints = useMemo(
    () => [...dbComplaints, ...mockComplaints],
    [dbComplaints, mockComplaints]
  );

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('severity', { ascending: false });

      if (error) throw error;
      setDbComplaints(data || []);
    } catch (err) {
      console.error('Complaint fetch error:', err);
      setError(err.message || 'Unable to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Filter and search
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      const matchesSearch =
        `${item.title || ''} ${item.location || ''} ${item.category || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        category === 'ALL' ||
        (item.category || '').toLowerCase() === category.toLowerCase();

      const matchesStatus =
        status === 'ALL' ||
        (item.status || '').toLowerCase() === status.toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [complaints, search, category, status]);

  const total = complaints.length;
  const urgent = complaints.filter(
    c => Number(c.severity) >= 8 && c.status !== 'Resolved'
  ).length;
  const progress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const pending = complaints.filter(c => c.status === 'Pending').length;

  // Update complaint status
  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);

    try {
      if (String(id).startsWith('mock-')) {
        setMockComplaints(prev =>
          prev.map(item =>
            item.id === id ? { ...item, status: newStatus } : item
          )
        );
      } else {
        const { error } = await supabase
          .from('complaints')
          .update({ status: newStatus })
          .eq('id', id);

        if (error) throw error;
        await fetchComplaints();
      }
    } catch (err) {
      alert(err.message || 'Could not update complaint.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (loading || !mapRef.current || !window.L) return;

    const L = window.L;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false
      }).setView([27.6033, 77.5957], 14);

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { attribution: '&copy; OpenStreetMap & CartoDB' }
      ).addTo(mapInstanceRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);
      markersRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    markersRef.current.clearLayers();

    complaints.forEach(item => {
      const lat = Number(item.latitude);
      const lng = Number(item.longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const color = Number(item.severity) >= 8
        ? '#ef4444'
        : Number(item.severity) >= 5
          ? '#f59e0b'
          : '#10b981';

      const popup = document.createElement('div');
      const heading = document.createElement('strong');
      const detail = document.createElement('p');

      heading.textContent = item.title || 'Civic issue';
      detail.textContent = `${item.category || 'Other'} • ${item.status || 'Pending'}`;

      popup.append(heading, detail);

      L.circleMarker([lat, lng], {
        radius: 9,
        fillColor: color,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
      })
        .bindPopup(popup)
        .addTo(markersRef.current);
    });

    setTimeout(() => map.invalidateSize(), 100);

    return () => {};
  }, [loading, complaints]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const navigation = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'reports', label: 'Reports & Complaints', icon: ClipboardList },
    { id: 'map', label: 'Civic Heatmap', icon: MapPin },
    { id: 'alerts', label: 'System Alerts', icon: Bell }
  ];

  const goToSection = (id) => {
    setActiveSection(id);
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const StatCard = ({ title, value, icon: Icon, color, note, trend }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-3">{value}</h2>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={21} />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
        {trend && <TrendingUp size={14} className="text-emerald-600" />}
        {note}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-5 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
        mobileMenu ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <ShieldCheck size={23} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg tracking-tight">
                CivicPulse<span className="text-emerald-600">.AI</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-bold tracking-wider">
                ADMIN CONSOLE
              </p>
            </div>
          </div>
          <button onClick={() => setMobileMenu(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-3 px-3">
          WORKSPACE
        </p>

        <nav className="space-y-1">
          {navigation.map(item => (
            <button
              key={item.id}
              onClick={() => goToSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeSection === item.id
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <item.icon size={19} />
              {item.label}
              {item.id === 'alerts' && urgent > 0 && (
                <span className="ml-auto bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded-full">
                  {urgent}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-9">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-3 px-3">
            MANAGEMENT
          </p>
          <button className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl">
            <Users size={19} /> Admin Team
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl">
            <Settings size={19} /> Preferences
          </button>
        </div>

        <div className="mt-auto bg-emerald-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
            <Activity size={16} /> System Operational
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            CivicPulse AI monitoring dashboard
          </p>
        </div>
      </aside>

      {mobileMenu && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">

        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-5 lg:px-9 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden"
                onClick={() => setMobileMenu(true)}
              >
                <Menu size={23} />
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight">
                  Operations Center
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Monitor and manage your city's civic issues.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchComplaints}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                A
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 lg:p-9 space-y-7">

          {/* Welcome */}
          <section id="overview" className="scroll-mt-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-emerald-700 text-xs font-bold uppercase tracking-widest">
                  Municipal Administration
                </p>
                <h2 className="text-2xl lg:text-3xl font-extrabold mt-2">
                  Dashboard Overview
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Here's what's happening with civic complaints today.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-3">
                <CalendarDays size={16} />
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
          </section>

          {/* Critical alert */}
          {urgent > 0 && (
            <section id="alerts" className="scroll-mt-24">
              <div className="flex items-center gap-4 bg-red-50 border border-red-100 p-4 rounded-2xl">
                <div className="bg-red-100 text-red-600 p-3 rounded-xl">
                  <AlertTriangle size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-800">
                    {urgent} high-priority complaints need attention
                  </h3>
                  <p className="text-xs text-red-600 mt-1">
                    Review critical civic issues and take timely action.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStatus('ALL');
                    setCategory('ALL');
                    goToSection('reports');
                  }}
                  className="text-xs font-bold text-red-700 hover:underline"
                >
                  Review
                </button>
              </div>
            </section>
          )}

          {/* Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total Complaints"
              value={total}
              icon={ClipboardList}
              color="bg-slate-100 text-slate-700"
              note="All reported civic issues"
            />
            <StatCard
              title="Critical Issues"
              value={urgent}
              icon={AlertTriangle}
              color="bg-red-50 text-red-600"
              note="Severity score 8 or higher"
            />
            <StatCard
              title="In Progress"
              value={progress}
              icon={Clock}
              color="bg-blue-50 text-blue-600"
              note="Currently being handled"
            />
            <StatCard
              title="Resolved"
              value={resolved}
              icon={CheckCircle2}
              color="bg-emerald-50 text-emerald-600"
              note={`${total ? Math.round(resolved / total * 100) : 0}% of all complaints`}
              trend
            />
          </section>

          {/* Progress overview */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-base">Resolution Overview</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Current distribution of complaints
                </p>
              </div>
              <Activity className="text-emerald-600" size={21} />
            </div>

            <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
              {total > 0 && (
                <>
                  <div className="bg-amber-400" style={{ width: `${pending / total * 100}%` }} />
                  <div className="bg-blue-500" style={{ width: `${progress / total * 100}%` }} />
                  <div className="bg-emerald-500" style={{ width: `${resolved / total * 100}%` }} />
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-6 mt-4 text-xs font-semibold text-slate-500">
              <span>🟡 Pending: {pending}</span>
              <span>🔵 In Progress: {progress}</span>
              <span>🟢 Resolved: {resolved}</span>
            </div>
          </section>

          {/* Complaints and map */}
          <section className="grid grid-cols-1 xl:grid-cols-5 gap-5">

            {/* Complaint list */}
            <div id="reports" className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 scroll-mt-24">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-bold text-base">Recent Complaints</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage and review citizen reports
                  </p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg font-bold">
                  {filteredComplaints.length} Reports
                </span>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-3 text-slate-400" size={17} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search complaints, locations..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Pothole">Potholes</option>
                  <option value="Garbage">Garbage</option>
                  <option value="Streetlight">Streetlights</option>
                </select>

                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    Loading complaints...
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No complaints match your filters.
                  </div>
                ) : filteredComplaints.map(item => (
                  <div
                    key={item.id}
                    className="border border-slate-100 rounded-xl p-4 hover:border-emerald-200 hover:bg-slate-50/60 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                          Number(item.severity) >= 8 ? 'bg-red-500' :
                          Number(item.severity) >= 5 ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`} />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800">
                            {item.title || 'Untitled Complaint'}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <MapPin size={12} />
                            {item.location || 'Mathura, India'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                              {item.category || 'Other'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                              Number(item.severity) >= 8
                                ? 'bg-red-50 text-red-600'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              Priority {item.severity}/10
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-[10px] font-bold border px-2 py-1 rounded-full ${
                          statusStyles[item.status] || statusStyles.Pending
                        }`}>
                          {item.status || 'Pending'}
                        </span>
                        <select
                          value={item.status || 'Pending'}
                          disabled={updatingId === item.id}
                          onChange={e => handleUpdateStatus(item.id, e.target.value)}
                          className="text-[10px] border border-slate-200 rounded-lg p-1.5 bg-white outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div id="map" className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 scroll-mt-24">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base">Civic Issue Map</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Geographic complaint distribution
                  </p>
                </div>
                <MapPin className="text-emerald-600" size={21} />
              </div>

              <div
                ref={mapRef}
                className="w-full h-[350px] rounded-xl border border-slate-100 overflow-hidden"
              />

              <div className="flex flex-wrap gap-4 mt-4 text-[10px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low
                </span>
              </div>
            </div>
          </section>

          {/* Detailed ledger */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-bold text-base">Complaint Records</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Complete incident register
                </p>
              </div>
              <ClipboardList className="text-slate-400" size={21} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[650px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th className="py-3">Complaint</th>
                    <th className="py-3">Category</th>
                    <th className="py-3">Priority</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Reported On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4">
                        <p className="text-xs font-bold text-slate-800">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {item.location || 'Mathura, India'}
                        </p>
                      </td>
                      <td className="py-4 text-xs font-medium text-slate-600">
                        {item.category}
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                          Number(item.severity) >= 8
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {item.severity}/10
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          statusStyles[item.status] || statusStyles.Pending
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-slate-500">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="text-center text-[11px] text-slate-400 py-4">
            CivicPulse.AI · Smart Civic Governance Platform
          </footer>
        </div>
      </main>
    </div>
  );
}
