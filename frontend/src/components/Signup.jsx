import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import ThemeToggle from "./ThemeToggle";


const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleGoogleSignUp = async () => {
    toast.error("Google Sign Up is currently under development.", { 
      duration: 3000,
      icon: '🚧'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullName, email, password } = formData;

    if (!fullName || !email || !password) {
      toast.error("Please fill in all required fields", { duration: 3000 });
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        username: fullName,
        email: email,
        password: password
      });

      toast.success("Account created successfully!", { duration: 3000 });
      localStorage.setItem("token", response.data.access_token);
      navigate("/main", { replace: true });
    } catch (error) {
      console.error("Registration Error:", error);
      const detail = error.response?.data?.detail || "An error occurred while creating your account. Please try again later.";
      toast.error(detail, { duration: 3000 });
    }
  };

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-transparent text-slate-900 dark:text-white selection:bg-sky-500/30">
      <ThemeToggle />

      {/* Main Glassmorphism Form Container */}
      <div className="relative z-20 flex w-full max-w-md flex-col items-center px-4">
        
        {/* Logo/Header */}
        <div className="mb-8 text-center cursor-pointer" onClick={() => navigate("/")}>
           <img src="/voxlogo3_transparent.png" alt="VoxBiz" className="h-40 md:h-48 w-auto mx-auto object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
            <p className="text-slate-500 dark:text-neutral-400 mt-2 text-sm">Create your new account</p>
        </div>

        <div className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-transparent/5 p-8 backdrop-blur-md shadow-2xl">
          
          <button
            onClick={handleGoogleSignUp}
            className="flex items-center justify-center w-full border border-slate-300 dark:border-white/20 bg-white/50 dark:bg-transparent/10 hover:bg-slate-50 dark:hover:bg-transparent/20 text-slate-700 dark:text-white rounded-md py-3 px-4 mb-6 transition-colors font-medium text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 24 24"
            >
              <path
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                fill="#4285F4"
              />
            </svg>
            Sign up with Google
          </button>

          <div className="flex items-center justify-center my-6">
            <div className="border-t border-slate-300 dark:border-white/10 flex-grow"></div>
            <span className="px-4 text-slate-500 dark:text-neutral-500 text-xs uppercase tracking-wider">
              Or continue with email
            </span>
            <div className="border-t border-slate-300 dark:border-white/10 flex-grow"></div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                className="w-full p-3 bg-white/50 dark:bg-transparent/30 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 rounded-md focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors text-sm"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                className="w-full p-3 bg-white/50 dark:bg-transparent/30 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 rounded-md focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors text-sm"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="w-full p-3 pr-10 bg-white/50 dark:bg-transparent/30 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 rounded-md focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors text-sm"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-md font-medium transition-colors text-sm"
            >
              Sign Up
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 dark:text-neutral-400">
            Already have an account?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault(); 
                navigate("/login"); 
              }}
              className="text-sky-500 hover:text-sky-600 dark:text-sky-400 font-medium dark:hover:text-sky-300 transition-colors"
            >
              Log in here
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
