import { api } from "../services/api";
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import { Mail, Sparkles } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedInput, setFocusedInput] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login");
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);

        if (!data.user.onboardingCompleted) {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.message || "Email não cadastrado. Entre em contato com o suporte."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080808] flex flex-col md:flex-row">
      {/* Left Section - Desktop Only */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        {/* Subtle Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#262626] to-[#1f1f1f]" />

        {/* Soft Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative w-full h-full flex flex-col justify-center items-center p-12 text-white">
          <img
            src="/images/conteudos/logopfd-removebg-preview.png"
            alt="Relationship Portal Logo"
            className="h-20 mb-12 animate-float filter brightness-110"
          />
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-light mb-6 tracking-wide">
              Transform your{" "}
              <span className="font-medium text-white">relationship</span> today
            </h2>
            <p className="text-[#a0a0a0] leading-relaxed">
              Discover personalized strategies and learn how to win back the
              person you love. Follow your daily plan and transform your story.
            </p>
          </div>
        </div>

        {/* Subtle Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#202020] rounded-full filter blur-[128px] opacity-40 animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#252525] rounded-full filter blur-[128px] opacity-40 animate-float-delayed" />
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-[#080808]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-12">
            <img
              src="/images/conteudos/logopfd-removebg-preview.png"
              alt="Relationship Portal Logo"
              className="h-16 filter brightness-110"
            />
          </div>

          {/* Form Container */}
          <div className="relative">
            {/* Glassmorphism Container */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent rounded-2xl" />

            {/* Content */}
            <div className="relative p-8 md:p-10">
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-light text-white mb-3 tracking-wide">
                  Welcome back
                </h1>
                <p className="text-[#a0a0a0] text-sm md:text-base">
                  Continue your transformation journey
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                    Your registered email
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                        focusedInput
                          ? "bg-white/[0.02] scale-105 blur-sm"
                          : "opacity-0"
                      }`}
                    />
                    <div className="relative flex items-center">
                      <Mail
                        size={20}
                        className={`absolute left-4 transition-colors duration-300 ${
                          focusedInput ? "text-white" : "text-[#505050]"
                        }`}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedInput(true)}
                        onBlur={() => setFocusedInput(false)}
                        className="w-full bg-white/[0.03] border border-[#202020] rounded-xl px-12 py-4 text-white placeholder-[#404040] focus:outline-none focus:border-[#404040] transition-all duration-300"
                        placeholder="Enter your email"
                        required
                      />
                      <Sparkles
                        size={20}
                        className={`absolute right-4 transition-all duration-300 ${
                          email
                            ? "text-white opacity-100"
                            : "text-[#505050] opacity-0"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/5 border border-red-500/10 text-red-400 text-sm rounded-xl p-4 animate-fade-in">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full group"
                >
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-[#202020] to-[#252525] rounded-xl opacity-50 group-hover:opacity-100 blur-sm transition-all duration-300" />
                  <div className="relative w-full py-4 bg-[#151515] rounded-xl flex items-center justify-center group-hover:bg-[#1a1a1a] transition-all duration-300 border border-[#252525] group-hover:border-[#303030]">
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="text-white font-light">
                          Signing in...
                        </span>
                      </div>
                    ) : (
                      <span className="text-white font-light tracking-wide">
                        Sign in
                      </span>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>

          {/* Footer Message */}
          <p className="text-[#505050] text-sm text-center mt-8">
            Sign in with your registered email to access the portal
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
