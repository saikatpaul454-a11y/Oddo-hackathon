import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import FaceScanner from '../components/FaceScanner';
import { User, Mail, ShieldAlert, BadgeCheck, FileEdit, Camera, Save } from 'lucide-react';

const Profile = () => {
  const { user, updateProfileState } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showFaceScanner, setShowFaceScanner] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await api.put('/api/employees/profile', { name, email });
      if (res.data.success) {
        updateProfileState(res.data.user);
        setIsEditing(false);
        setMessageType('success');
        setMessage('Profile updated successfully!');
      }
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handleFaceScanComplete = async (verified) => {
    setShowFaceScanner(false);
    if (!verified) return;

    try {
      const res = await api.post('/api/employees/register-face', { descriptor: [0.1, 0.2, 0.3] });
      if (res.data.success) {
        setMessageType('success');
        setMessage('Facial biometric registration successful!');
        // Update local user state
        updateProfileState({ ...user, isFaceRegistered: true });
      }
    } catch (err) {
      setMessageType('error');
      setMessage('Facial registration failed.');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          My Account
        </h1>
        <p className="text-sm text-slate-500">
          Manage your personal details, credentials, and facial biometric keys.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Card: Summary & Biometric Registration */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 text-white text-3xl font-bold">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            {user?.isFaceRegistered && (
              <span className="absolute bottom-0 right-0 rounded-full bg-emerald-500 p-1.5 text-white border-2 border-white" title="Face Biometric Registered">
                <BadgeCheck className="h-4 w-4" />
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-855">{user?.name}</h3>
          <p className="text-xs text-slate-400 font-medium uppercase mt-0.5">{user?.designation}</p>
          <span className="mt-3 inline-flex rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
            {user?.employeeId}
          </span>

          {/* Biometrics Box */}
          <div className="border-t border-slate-100 mt-6 pt-6 w-full space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-left">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-indigo-500" />
                Facial Key Status
              </h4>
              {user?.isFaceRegistered ? (
                <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <BadgeCheck className="h-4 w-4" /> Registered & Secure
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <ShieldAlert className="h-4 w-4" /> Not Registered Yet
                  </div>
                  <button
                    onClick={() => setShowFaceScanner(true)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-semibold text-white transition"
                  >
                    Register Face
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Account Details Fields */}
        <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800">
              Personal Information
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                <FileEdit className="h-3.5 w-3.5" />
                Edit Info
              </button>
            )}
          </div>

          {message && (
            <div className={`mb-6 rounded-lg border p-4 text-xs font-medium ${
              messageType === 'success'
                ? 'border-emerald-500/10 bg-emerald-500/5 text-emerald-600'
                : 'border-red-500/10 bg-red-500/5 text-red-600'
            }`}>
              {message}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setName(user?.name || '');
                    setEmail(user?.email || '');
                    setIsEditing(false);
                  }}
                  className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/15 transition"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Department</span>
                <p className="text-sm font-semibold text-slate-700">{user?.department}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Designation</span>
                <p className="text-sm font-semibold text-slate-700">{user?.designation}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Joining Date</span>
                <p className="text-sm font-semibold text-slate-700">
                  {new Date(user?.joiningDate || Date.now()).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Salary Tier</span>
                <p className="text-sm font-semibold text-slate-700">INR {user?.salary ? user.salary.toLocaleString() : '35,000'}</p>
              </div>
              <div className="space-y-0.5 border-t border-slate-50 pt-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Security Access Role</span>
                <p className="text-sm font-bold text-slate-700 capitalize">{user?.role}</p>
              </div>
              <div className="space-y-0.5 border-t border-slate-50 pt-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">System ID Hash</span>
                <p className="text-xs font-mono text-slate-400 truncate">{user?.employeeId}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showFaceScanner && (
        <FaceScanner
          onScanComplete={handleFaceScanComplete}
          onClose={() => setShowFaceScanner(false)}
        />
      )}
    </div>
  );
};

export default Profile;
