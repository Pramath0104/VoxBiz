import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleSendCode = async () => {
    try {
      const response = await api.post("/auth/send-reset-code", { email });
      if (response.data.success) {
        setStep(2);
        setTimer(30);
        toast.success("Reset code sent to your email!");
      } else {
        toast.error(response.data.message || "Failed to send reset code.");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "An error occurred");
    }
  };

  const handleVerifyCode = async () => {
    try {
      const response = await api.post("/auth/verify", { email, code });
      if (response.data.success) {
        setStep(3);
        toast.success("Code verified successfully!");
      } else {
        toast.error(response.data.message || "Invalid or expired code.");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "An error occurred");
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await api.post("/auth/reset-password", { email, code, newPassword });
      if (response.data.success) {
        toast.success("Password reset successfully!");
        navigate("/login");
      } else {
        toast.error(response.data.message || "Failed to reset password.");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "An error occurred");
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-transparent px-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 shadow-2xl relative overflow-hidden">
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-6">
          {step === 1
            ? "Forgot Password"
            : step === 2
              ? "Verify Code"
              : "Reset Password"}
        </h2>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (step === 1) handleSendCode();
          else if (step === 2) handleVerifyCode();
          else handleResetPassword();
        }} className="space-y-4">
          
          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full p-3 bg-white/50 dark:bg-transparent/30 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 rounded-md focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors text-sm"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 mt-2"
              >
                Send Reset Code
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-white/50 dark:bg-transparent/30 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 rounded-md focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors text-sm"
                  placeholder="Enter verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 mt-2"
              >
                Verify Code
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={timer > 0}
                className={`w-full font-medium py-3 rounded-xl transition-all duration-300 transform mt-2 ${
                  timer > 0
                    ? "bg-slate-300 dark:bg-white/5 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    : "bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-white hover:-translate-y-0.5"
                }`}
              >
                {timer > 0 ? `Resend Code in ${timer}s` : "Resend Code"}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full p-3 pr-10 bg-white/50 dark:bg-transparent/30 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 rounded-md focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors text-sm"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-neutral-400 dark:hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 mt-2"
              >
                Reset Password
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
