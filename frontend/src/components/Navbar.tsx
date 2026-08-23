import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Building,
  LogOut,
  Mail,
  Shield,
  Layers,
  FileText,
  Sliders,
  Menu,
  X,
} from "lucide-react";
import { EmailPreviewModal } from "./EmailPreviewModal";

export const Navbar: React.FC<{ societyName?: string }> = ({
  societyName = "Palm Grove Residency",
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showEmailLogs, setShowEmailLogs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="bg-[#0b1120]/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 shadow-md shadow-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/10 group-hover:scale-105 transition">
                  <Building className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <span className="text-base font-extrabold text-white tracking-tight block leading-tight">
                    SocietyHub
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {societyName}
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            {user && (
              <div className="hidden md:flex items-center gap-1">
                {user.role === "ADMIN" ? (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                        isActive("/admin/dashboard")
                          ? "bg-slate-800 text-amber-400 border border-slate-700"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/complaints"
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                        isActive("/admin/complaints")
                          ? "bg-slate-800 text-amber-400 border border-slate-700"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Complaints Management
                    </Link>
                    <Link
                      to="/notices"
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                        isActive("/notices")
                          ? "bg-slate-800 text-amber-400 border border-slate-700"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Notice Board
                    </Link>
                    <Link
                      to="/admin/settings"
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                        isActive("/admin/settings")
                          ? "bg-slate-800 text-amber-400 border border-slate-700"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Settings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/resident"
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                        isActive("/resident")
                          ? "bg-slate-800 text-amber-400 border border-slate-700"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      My Maintenance Requests
                    </Link>
                    <Link
                      to="/notices"
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                        isActive("/notices")
                          ? "bg-slate-800 text-amber-400 border border-slate-700"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Notice Board
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Right Action Items */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEmailLogs(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800/90 hover:bg-slate-700/90 rounded-lg border border-slate-700 transition"
                title="View notification logs"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Notification Logs</span>
              </button>

              {user ? (
                <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-100 leading-tight">
                      {user.name}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                          user.role === "ADMIN"
                            ? "bg-purple-950 text-purple-300 border-purple-800"
                            : "bg-amber-950 text-amber-300 border-amber-800"
                        }`}
                      >
                        {user.role}
                      </span>
                      {user.flatNumber && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {user.flatNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition border border-transparent hover:border-rose-900/50"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile menu trigger */}
              <div className="flex md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && user && (
          <div className="md:hidden border-t border-slate-800 bg-[#0f172a] px-4 pt-2 pb-4 space-y-1">
            {user.role === "ADMIN" ? (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/complaints"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Complaints Management
                </Link>
                <Link
                  to="/notices"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Notice Board
                </Link>
                <Link
                  to="/admin/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/resident"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  My Complaints
                </Link>
                <Link
                  to="/notices"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Notice Board
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {showEmailLogs && <EmailPreviewModal onClose={() => setShowEmailLogs(false)} />}
    </>
  );
};
