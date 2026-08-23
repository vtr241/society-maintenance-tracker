import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Building, Lock, Mail, ArrowRight, Shield, User } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRoleLogging, setActiveRoleLogging] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const executeAuth = async (loginEmail: string, loginPass: string) => {
    if (!loginEmail || !loginPass) {
      setError("Please enter your registered email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/login", {
        email: loginEmail.trim().toLowerCase(),
        password: loginPass,
      });

      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);
        if (user.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/resident");
        }
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(
        err.response?.data?.message ||
          "Authentication failed. Please verify credentials or seed the database."
      );
    } finally {
      setLoading(false);
      setActiveRoleLogging(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeAuth(email, password);
  };

  const handleQuickLogin = async (role: "ADMIN" | "RESIDENT") => {
    const targetEmail = role === "ADMIN" ? "admin@society.com" : "resident@society.com";
    const targetPass = role === "ADMIN" ? "Admin@123" : "Resident@123";

    setEmail(targetEmail);
    setPassword(targetPass);
    setActiveRoleLogging(role);

    // Instant 1-click execution
    await executeAuth(targetEmail, targetPass);
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 shadow-xl shadow-amber-500/10 mb-4">
          <Building className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          SocietyHub Portal
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Palm Grove Residency Maintenance & Operations Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#0f172a] py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs font-semibold text-rose-300">
              {error}
            </div>
          )}

          {/* Quick 1-Click Instant Login Buttons */}
          <div className="mb-6 bg-[#141d30] p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              1-Click Instant Evaluation Login
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("ADMIN")}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-purple-950/80 text-purple-300 border border-purple-800/80 hover:bg-purple-900/60 transition disabled:opacity-50 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                {activeRoleLogging === "ADMIN" ? "Entering..." : "Login as Admin"}
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("RESIDENT")}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 transition disabled:opacity-50 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                {activeRoleLogging === "RESIDENT" ? "Entering..." : "Login as Resident"}
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@society.com"
                  required
                  className="block w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border-slate-700 bg-[#090d16] text-white border focus:ring-1 focus:ring-amber-500 placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border-slate-700 bg-[#090d16] text-white border focus:ring-1 focus:ring-amber-500 placeholder-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition shadow-md shadow-amber-500/10 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? "Authenticating..." : "Sign In to Portal"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Resident without an account?{" "}
            <Link
              to="/register"
              className="font-bold text-amber-400 hover:text-amber-300 underline"
            >
              Register Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
