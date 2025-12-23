import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, Building2 } from "lucide-react";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("employee");

  const { signIn, signUp, user, isAdmin } = useAuth();

  if (user) {
    // Role-based redirect
    const redirectPath = isAdmin ? '/' : '/attendance';
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const response = await signUp(email, password, { firstName, lastName, role });
        if ((response as { error?: string }).error) throw new Error((response as { error: string }).error);
      } else {
        const response = await signIn(email, password);
        if ((response as { error?: string }).error) throw new Error((response as { error: string }).error);
      }
      // No explicit navigate - let the component re-render and if (user) handle redirect
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-300 via-indigo-200 to-blue-300 animate-gradient-x">
      {/* Glassmorphism Card */}
      <div className="backdrop-blur-xl bg-white/20 shadow-2xl rounded-3xl p-10 w-full max-w-md transition-all transform hover:scale-105 motion-safe:animate-fadeIn">
        {/* Logo / Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-3xl shadow-lg animate-bounce">
            <Building2 className="h-14 w-14 text-white" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-center text-gray-900 drop-shadow-lg animate-pulse">
          {isSignUp ? "Create Your Account" : "Welcome Back"}
        </h2>
        <p className="mt-2 text-sm text-center text-gray/600 animate-pulse dark:text-white/600">
          {isSignUp ? "Join the Employee Management System" : "Sign in to continue"}
        </p>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="px-4 py-3 w-full rounded-xl bg-white/20 text-slate-600 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-400 transition-all duration-300 hover:scale-105"
                    placeholder="First name"
                  />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="px-4 py-3 w-full rounded-xl bg-white/20 text-slate-600 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-400 transition-all duration-300 hover:scale-105"
                    placeholder="Last name"
                  />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-gray-400 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-400 transition-all duration-300 hover:scale-105"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </>
            )}

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 w-full rounded-xl bg-white/20 text-slate-600 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-400 transition-all duration-300 hover:scale-105"
              placeholder="Email address"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-3 w-full rounded-xl bg-white/20 text-slate-600 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-400 pr-12 transition-all duration-300 hover:scale-105"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-white/70 hover:text-white transition-transform duration-300 hover:scale-110"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/20 border border-red-400 p-3 text-sm text-white animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-transform duration-300 shadow-lg hover:scale-105"
          >
            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-slate-600 hover:text-white font-medium transition-transform duration-300 hover:scale-105"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
