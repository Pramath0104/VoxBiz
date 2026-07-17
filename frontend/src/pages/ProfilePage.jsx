import { Activity, Key,Mail, Shield, User } from "lucide-react";
import React, { useEffect,useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { useTheme } from "../contexts/ThemeContext";
import api from "../services/api";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isDarkMode: darkMode } = useTheme();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePassword = async () => {
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (!currentPassword || !newPassword) {
      setPasswordError("Please fill in all fields.");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password successfully updated!", { icon: '✅' });
    } catch (err) {
      setPasswordError(err.response?.data?.detail || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/auth/me');
        setUserData(response.data);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load profile. Please try logging in again.");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  if (isLoading) {
    return (
      <>
<div className="flex-grow flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-b-transparent border-l-sky-500 border-r-sky-500"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col w-screen min-h-screen ${darkMode ? "bg-transparent text-white" : "bg-transparent text-gray-900"}`}>
<div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center bg-red-500/10 p-8 rounded-xl border border-red-500/30">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Oops!</h2>
            <p className="text-lg mb-6">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
        </div>
    );
  }

  return (
    <div className={`flex flex-col w-screen min-h-screen ${darkMode ? "bg-transparent text-white" : "bg-transparent text-gray-900"}`}>
<div className="flex-grow w-full py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        
        {/* Banner Section */}
        <div className="relative w-full mb-20">
          {/* Banner Background */}
          <div className="w-full h-48 md:h-64 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-sky-500 to-blue-600 opacity-90"></div>
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PC9yZWN0Pgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSI+PC9wYXRoPgo8L3N2Zz4=')] mix-blend-overlay"></div>
          </div>
          
          {/* Avatar floating over banner */}
          <div className="absolute -bottom-16 left-8 md:left-12 z-20 group">
            <div className={`relative h-32 w-32 rounded-full border-4 shadow-2xl flex items-center justify-center text-4xl font-bold transition-transform duration-300 group-hover:scale-105 ${darkMode ? "bg-slate-800 border-slate-900 text-white" : "bg-white border-white text-sky-600"}`}>
              {userData?.username?.charAt(0).toUpperCase() || 'U'}
              <div className="absolute bottom-2 right-2 h-6 w-6 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center" title="Active">
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-12 mt-8">
          
          {/* Left Column - User Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight">{userData?.username || 'User'}</h1>
              <p className={`text-sm mt-1 flex items-center ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                <Mail className="h-4 w-4 mr-2 text-sky-500" />
                {userData?.email || 'N/A'}
              </p>
            </div>
            
            <div className={`rounded-2xl p-6 border shadow-sm backdrop-blur-md transition-all hover:shadow-md ${darkMode ? "bg-transparent/50 border-white/10" : "bg-white/50 border-slate-200"}`}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Account Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm font-medium">
                    <Shield className="h-5 w-5 mr-3 text-violet-500" />
                    Role
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                    Standard
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm font-medium">
                    <Activity className="h-5 w-5 mr-3 text-emerald-500" />
                    Status
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center text-sm font-medium">
                    <Key className="h-5 w-5 mr-3 text-amber-500" />
                    User ID
                  </div>
                  <span className={`text-xs font-mono truncate max-w-[120px] ${darkMode ? "text-slate-500" : "text-slate-400"}`} title={userData?._id}>
                    {userData?._id ? `...${userData._id.slice(-6)}` : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings & Security */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Profile Settings Card */}
            <div className={`rounded-2xl p-8 border shadow-sm backdrop-blur-md transition-all hover:shadow-md ${darkMode ? "bg-transparent/50 border-white/10" : "bg-white/50 border-slate-200"}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold flex items-center">
                    <User className="mr-3 h-6 w-6 text-sky-500" /> 
                    Profile Information
                  </h2>
                  <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Your personal details and how you appear to the system.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Full Name</label>
                  <div className={`w-full p-4 rounded-xl border text-sm font-medium transition-colors ${darkMode ? "bg-slate-900/60 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}>
                    {userData?.username || 'Not provided'}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Email Address</label>
                  <div className={`w-full p-4 rounded-xl border text-sm font-medium transition-colors ${darkMode ? "bg-slate-900/60 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}>
                    {userData?.email || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className={`rounded-2xl p-8 border shadow-sm backdrop-blur-md transition-all hover:shadow-md ${darkMode ? "bg-transparent/50 border-white/10" : "bg-white/50 border-red-200"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center text-red-500">
                    <Shield className="mr-3 h-6 w-6" /> 
                    Security Settings
                  </h2>
                  <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Keep your account secure with a strong password.
                  </p>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 flex-shrink-0"
                >
                  Change Password
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-xl ${darkMode ? "bg-slate-800 border border-slate-700 text-white" : "bg-white text-gray-900"}`}>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2 text-red-500" />
              Change Password
            </h3>
            
            {passwordError && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {passwordError}
              </div>
            )}
            
            <div className="space-y-4 mt-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Current Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-300"}`} 
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>New Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-300"}`} 
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Confirm New Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-300"}`} 
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError("");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }} 
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"}`}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdatePassword} 
                disabled={isUpdatingPassword}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
  );
};

export default ProfilePage;
