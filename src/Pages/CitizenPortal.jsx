
import React, { useState, useRef, useEffect } from 'react';
import {
  Camera, MapPin, AlertCircle, Sparkles, CheckCircle2,
  ShieldCheck, User, Upload, X, LocateFixed, Loader2,
  ArrowRight, Image as ImageIcon, Clock, FileText,
  LogOut, RotateCcw, Building2
} from 'lucide-react';

import { supabase } from '../supabaseClient';
import { analyzeImage } from '../geminiClient';

const initialForm = {
  title: '',
  description: '',
  category: 'Pothole',
  severity: 5,
  department: 'Public Works Department (PWD)'
};

const getDepartment = (category = '') => {
  const cat = category.toLowerCase();

  if (cat.includes('pothole') || cat.includes('road')) {
    return 'Public Works Department (PWD)';
  }
  if (cat.includes('garbage') || cat.includes('waste')) {
    return 'Sanitation & Waste Management';
  }
  if (cat.includes('light')) {
    return 'Electricity Department';
  }
  if (cat.includes('drain') || cat.includes('water')) {
    return 'Water Supply & Sewerage';
  }

  return 'Municipal Corporation';
};

export default function CitizenPortal() {
  const [user, setUser] = useState({ loggedIn: false, email: '' });
  const [emailInput, setEmailInput] = useState('');

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [location, setLocation] = useState(null);

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [aiComplete, setAiComplete] = useState(false);

  const [formData, setFormData] = useState(initialForm);

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleLogin = (e) => {
    e.preventDefault();

    const email = emailInput.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setUser({ loggedIn: true, email });
  };

  const handleLogout = () => {
    setUser({ loggedIn: false, email: '' });
    setEmailInput('');
  };

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Image size must be less than 8 MB.');
      return;
    }

    setError('');
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setAiComplete(false);
    setAnalyzing(true);

    setFormData(initialForm);

    try {
      const result = await analyzeImage(file);

      if (!result) {
        throw new Error('No AI response received.');
      }

      const category = result.category || 'Other';
      const severity = Math.min(
        10,
        Math.max(1, Number(result.severity) || 5)
      );

      setFormData({
        title: result.title || `Reported ${category}`,
        description: result.description || 'Please review this civic issue.',
        category,
        severity,
        department: getDepartment(category)
      });

      setAiComplete(true);
    } catch (err) {
      console.error('Gemini analysis error:', err);
      setError(
        'AI analysis could not be completed. You can still fill the complaint details manually.'
      );

      setFormData({
        ...initialForm,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      });
    } finally {
      setAnalyzing(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview('');
    setAiComplete(false);
    setFormData(initialForm);
    setError('');
  };

  const getGPSLocation = () => {
    setError('');

    if (!navigator.geolocation) {
      setError('Your browser does not support GPS location.');
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGpsLoading(false);
      },
      (err) => {
        const message = {
          1: 'Location permission denied. Please allow location access in your browser.',
          2: 'Your current location could not be determined.',
          3: 'Location request timed out. Please try again.'
        };

        setError(message[err.code] || 'Unable to access GPS.');
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!image) {
      setError('Please upload a photo of the civic issue.');
      return;
    }

    if (!location) {
      setError('Please lock your GPS coordinates before submitting.');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please complete the complaint title and description.');
      return;
    }

    setLoading(true);

    try {
      const { error: submitError } = await supabase
        .from('complaints')
        .insert([
          {
            title: formData.title.trim(),
            description: formData.description.trim(),
            category: formData.category,
            severity: Number(formData.severity),
            latitude: location.latitude,
            longitude: location.longitude,
            status: 'Pending',
            deadline_hours: Number(formData.severity) >= 8 ? 24 : 72
          }
        ]);

      if (submitError) throw submitError;

      setSuccess(true);
      setImage(null);
      setPreview('');
      setLocation(null);
      setFormData(initialForm);
      setAiComplete(false);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to register complaint.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setError('');
    setImage(null);
    setPreview('');
    setLocation(null);
    setFormData(initialForm);
    setAiComplete(false);
  };

  // LOGIN SCREEN
  if (!user.loggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#f6f8fb]">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-7 sm:p-9">

          <div className="flex justify-center mb-7">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={34} />
            </div>
          </div>

          <div className="text-center mb-8">
            <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase">
              Citizen Access
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Sign in to report and monitor civic issues in your city.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 transition-all"
            >
              Access Citizen Portal <ArrowRight size={17} />
            </button>
          </form>

          <div className="mt-7 p-4 bg-slate-50 rounded-xl flex gap-3">
            <ShieldCheck size={19} className="text-emerald-600 shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Your civic reports help authorities identify and resolve public infrastructure problems.
            </p>
          </div>

          <p className="text-[10px] text-slate-400 text-center mt-5">
            Demo email access · Authentication is not yet connected
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">

      {/* TOP HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
              <ShieldCheck size={23} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg">
                CivicPulse<span className="text-emerald-600">.AI</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest">
                CITIZEN PORTAL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-800">
                {user.email}
              </p>
              <p className="text-[10px] text-emerald-600">Citizen account</p>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-9">

        {/* HERO */}
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-extrabold tracking-widest uppercase">
            <Sparkles size={13} />
            AI Powered Civic Reporting
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mt-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Report a Civic Issue
              </h1>
              <p className="text-sm text-slate-500 mt-2 max-w-xl leading-relaxed">
                Help make your city better. Upload evidence and let our AI analyze the issue, estimate its priority and suggest the right department.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-3">
              <ShieldCheck size={17} className="text-emerald-600" />
              AI-assisted reporting
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
            <AlertCircle size={19} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{error}</p>
            <button onClick={() => setError('')}>
              <X size={17} />
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {success ? (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-9 text-center shadow-lg">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={43} />
            </div>

            <span className="text-xs text-emerald-600 font-bold uppercase tracking-widest">
              Submission Complete
            </span>

            <h2 className="text-2xl font-extrabold mt-3">
              Complaint Registered!
            </h2>

            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              Your complaint has been successfully submitted. Authorities can now review and process the reported issue.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mt-6 flex items-center justify-center gap-2 text-sm font-bold text-slate-600">
              <Clock size={17} className="text-amber-500" />
              Current Status: Pending
            </div>

            <button
              onClick={resetForm}
              className="mt-7 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw size={17} /> Report Another Issue
            </button>
          </div>
        ) : (

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT COLUMN */}
              <div className="lg:col-span-5 space-y-5">

                {/* UPLOAD CARD */}
                <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Camera size={21} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">Upload Evidence</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Add a clear photo of the problem
                      </p>
                    </div>
                  </div>

                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) {
                        handleImageChange({
                          target: {
                            files: [e.dataTransfer.files[0]],
                            value: ''
                          }
                        });
                      }
                    }}
                    className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/70 rounded-2xl min-h-[250px] flex items-center justify-center relative overflow-hidden transition-all"
                  >
                    {preview ? (
                      <div className="w-full p-3">
                        <img
                          src={preview}
                          alt="Uploaded civic issue"
                          className="w-full max-h-[300px] object-contain rounded-xl"
                        />

                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-slate-500 font-semibold truncate">
                            {image?.name}
                          </span>

                          <button
                            type="button"
                            onClick={removeImage}
                            className="flex items-center gap-1 text-xs text-red-500 font-bold"
                          >
                            <X size={15} /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-12 px-5 flex flex-col items-center"
                      >
                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                          <Upload size={29} />
                        </div>

                        <h4 className="font-bold text-sm">
                          Click to upload or drag & drop
                        </h4>

                        <p className="text-xs text-slate-400 mt-2">
                          PNG, JPG, JPEG · Maximum 8 MB
                        </p>
                      </button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>

                  {analyzing && (
                    <div className="mt-4 bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
                      <Loader2 className="text-emerald-600 animate-spin" size={21} />
                      <div>
                        <p className="text-xs font-bold text-emerald-800">
                          Gemini AI is analyzing your image
                        </p>
                        <p className="text-[10px] text-emerald-600 mt-1">
                          Detecting issue category and severity...
                        </p>
                      </div>
                    </div>
                  )}

                  {aiComplete && (
                    <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 size={17} />
                      <span className="text-xs font-bold">
                        AI analysis completed successfully
                      </span>
                    </div>
                  )}
                </section>

                {/* GPS CARD */}
                <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                      <MapPin size={21} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">Issue Location</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Pinpoint where the problem exists
                      </p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    location
                      ? 'bg-emerald-50 border-emerald-100'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    {location ? (
                      <>
                        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                          <CheckCircle2 size={17} />
                          Location successfully captured
                        </div>

                        <p className="text-xs text-slate-600 mt-3">
                          Latitude: {location.latitude.toFixed(6)}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Longitude: {location.longitude.toFixed(6)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        GPS coordinates are required to identify the location of your civic complaint.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={getGPSLocation}
                    disabled={gpsLoading}
                    className="w-full mt-4 py-3.5 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {gpsLoading ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <LocateFixed size={17} className="text-red-500" />
                    )}
                    {gpsLoading
                      ? 'Detecting location...'
                      : location
                        ? 'Refresh GPS Location'
                        : 'Detect My Location'}
                  </button>
                </section>

                {/* INFO */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                  <div className="flex gap-3">
                    <ShieldCheck className="text-emerald-600 shrink-0" size={22} />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">
                        Why report civic issues?
                      </h4>
                      <p className="text-xs text-emerald-700 mt-2 leading-relaxed">
                        Your reports help identify infrastructure problems, prioritize public safety and improve municipal accountability.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="lg:col-span-7">
                <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 h-full">

                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-5 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Sparkles size={21} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">AI Diagnostic Panel</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Smart issue analysis
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-3 py-2 rounded-full ${
                      aiComplete
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {aiComplete ? 'AI VERIFIED' : 'AWAITING IMAGE'}
                    </span>
                  </div>

                  <div className="space-y-5">

                    {/* CATEGORY */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                          Detected Category
                        </label>
                        <input
                          value={formData.category}
                          onChange={e => {
                            const category = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              category,
                              department: getDepartment(category)
                            }));
                          }}
                          placeholder="e.g. Pothole"
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                          Assigned Department
                        </label>
                        <div className="min-h-[48px] p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                          <Building2 size={16} className="text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-emerald-800">
                            {formData.department}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* TITLE */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                        Complaint Title
                      </label>
                      <input
                        required
                        value={formData.title}
                        onChange={e => updateForm('title', e.target.value)}
                        placeholder="Describe the civic issue briefly"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                        Detailed Description
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={formData.description}
                        onChange={e => updateForm('description', e.target.value)}
                        placeholder="Describe the issue, its impact and any relevant details..."
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 resize-y"
                      />
                    </div>

                    {/* SEVERITY */}
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="flex justify-between items-center gap-3 mb-4">
                        <div>
                          <h4 className="text-sm font-bold">
                            Severity Assessment
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Priority score out of 10
                          </p>
                        </div>

                        <span className={`text-sm font-extrabold px-3 py-2 rounded-xl ${
                          formData.severity >= 8
                            ? 'bg-red-100 text-red-700'
                            : formData.severity >= 5
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {formData.severity}/10
                        </span>
                      </div>

                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.severity}
                        onChange={e => updateForm('severity', Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />

                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>Critical</span>
                      </div>
                    </div>

                    {/* SUBMISSION CHECKLIST */}
                    <div className="border border-slate-100 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700">
                        Submission Checklist
                      </h4>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-2">
                          <ImageIcon size={15} /> Evidence photo
                        </span>
                        {image ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : (
                          <span className="text-amber-600 font-semibold">Required</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-2">
                          <MapPin size={15} /> GPS location
                        </span>
                        {location ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : (
                          <span className="text-amber-600 font-semibold">Required</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-2">
                          <FileText size={15} /> Complaint details
                        </span>
                        {formData.title.trim() && formData.description.trim() ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : (
                          <span className="text-amber-600 font-semibold">Required</span>
                        )}
                      </div>
                    </div>

                    {/* SUBMIT */}
                    <button
                      type="submit"
                      disabled={loading || analyzing}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={19} className="animate-spin" />
                          Registering Complaint...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={19} />
                          Submit Official Complaint
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>

                    <p className="text-center text-[10px] text-slate-400">
                      Your complaint will be submitted to the CivicPulse database.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </form>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-10 py-6 text-center">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} CivicPulse.AI · Building Better Communities
        </p>
      </footer>
    </div>
  );
}
