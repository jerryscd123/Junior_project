"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import logo from "@/assets/logo9.png";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Redux imports
import { useAppDispatch } from "@/store/hooks";
import { useAuth } from "@/store/hooks";
import { loginUser, registerUser, clearError } from "@/store/slices/authSlice";
import { LoginPayload, RegisterPayload } from "@/store/types/auth";

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
}

export default function AuthPage({ initialMode = 'login' }: AuthPageProps) {
  const router = useRouter();
  
  // Redux hooks
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAuth();

  // State management
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    isAnonymous: false,
  });

  // Clear errors when switching between login/signup
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [isLogin, dispatch, error]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("✅ User authenticated, redirecting...", { 
        userName: user.name, 
        userRole: user.role 
      });
      
      // Redirect based on user role
      if (user.role === 'admin') {
        router.push('/admin-dashboard');
      } else {
        router.push('/user-dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleLoginChange = (field: string, value: string | boolean) => {
    setLoginData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignupChange = (field: string, value: string | boolean) => {
    setSignupData((prev) => ({ ...prev, [field]: value }));
  };

  const switchMode = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setShowPassword(false);
      // Clear errors when switching modes
      if (error) {
        dispatch(clearError());
      }
      setTimeout(() => setIsAnimating(false), 50);
    }, 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        // Login flow
        const loginPayload: LoginPayload = {
          email: loginData.email,
          password: loginData.password,
        };
        
        console.log("🔐 Attempting login with:", { email: loginPayload.email });
        await dispatch(loginUser(loginPayload)).unwrap();
        console.log("✅ Login successful");
      } else {
        // Register flow
        const registerPayload: RegisterPayload = {
          name: `${signupData.firstName} ${signupData.lastName}`.trim(),
          email: signupData.email,
          password: signupData.password,
          password_confirmation: signupData.password,
          bio: "", // Optional bio, can be empty
          is_anonymous: signupData.isAnonymous || false, // Ensure it's always a boolean
        };
        
        console.log("📝 Attempting registration with:", { 
          name: registerPayload.name, 
          email: registerPayload.email,
          isAnonymous: registerPayload.is_anonymous
        });
        await dispatch(registerUser(registerPayload)).unwrap();
        console.log("✅ Registration successful");
      }
    } catch (error: unknown) {
      console.error(`❌ ${isLogin ? 'Login' : 'Registration'} failed:`, error);
      // Error is automatically handled by Redux and will show in the UI
    }
  };

  // Mobile header component
  const MobileHeader = () => (
    <div className="lg:hidden relative bg-[#1d2b7d] p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-1000"></div>
      </div>

      {/* Background Pattern for Mobile */}
      <div className="absolute inset-0 opacity-10 rounded-t-2xl sm:rounded-t-3xl overflow-hidden">
        <svg
          className="absolute bottom-0 w-full h-24 sm:h-32"
          viewBox="0 0 400 100"
          fill="none"
        >
          <path
            d="M0 60C50 50 100 40 150 45C200 50 250 35 300 40C350 45 400 30 400 30V100H0V60Z"
            fill="rgba(0,0,0,0.3)"
          />
        </svg>
      </div>

      <div className="relative z-10 flex items-center justify-between mb-3 sm:mb-4">
      <Image
            src={logo}
            width={80}
            height={80}
            alt="Logo"
            className="w-16 h-16 lg:w-20 animate-pulse lg:h-20 object-contain brightness-125"
          />
        <Link href={isLogin ? "/auth/signup" : "/auth/login"} passHref>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 transition-all duration-200 dark:text-black/80 dark:hover:text-black dark:hover:bg-black/10"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {isLogin ? "Sign up" : "Sign in"}
          </Button>
        </Link>
      </div>

      <div
        className={`relative z-10 text-center transition-all duration-300 ${
          isAnimating
            ? "opacity-0 transform translate-y-2"
            : "opacity-100 transform translate-y-0"
        }`}
      >
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 leading-tight">
          {isLogin ? "Welcome Back!" : "Join MINDSPEAK Today"}
        </h1>
        <p className="text-white/80 text-xs sm:text-sm">
          {isLogin
            ? "Sign in to continue your journey"
            : "Create your account to get started"}
        </p>
      </div>
    </div>
  );

  // Decorative panel component
  const DecorativePanel = () => (
    <div className="hidden lg:flex lg:w-1/2 relative bg-[#1d2b7d] p-8 flex-col justify-between overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/40 to-transparent"></div>
        <svg
          className="absolute bottom-0 w-full h-64"
          viewBox="0 0 400 200"
          fill="none"
        >
          <path
            d="M0 120C50 100 100 80 150 90C200 100 250 70 300 80C350 90 400 60 400 60V200H0V120Z"
            fill="rgba(0,0,0,0.3)"
          />
          <path
            d="M0 140C60 120 120 100 180 110C240 120 300 90 360 100C380 105 400 95 400 95V200H0V140Z"
            fill="rgba(0,0,0,0.2)"
          />
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="text-white font-bold text-2xl tracking-wider">
            MINDSPEAK
          </div>
          <Link href={isLogin ? "/auth/signup" : "/auth/login"} passHref>
            <Button
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 dark:text-black/80 dark:hover:text-black dark:hover:bg-black/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isLogin ? "Back to sign up" : "Back to sign in"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Image */}
      <div className="flex justify-center my-8">
        <div className="relative">
          <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <Image
            src={logo}
            width={200}
            height={200}
            alt="Form Illustration"
            className="relative z-10 w-48 h-48 animate-pulse lg:w-64 lg:h-64 object-contain brightness-125"
          />
        </div>
      </div>

      {/* Content */}
      <div
        className={`relative z-10 text-center lg:text-left transition-all duration-300 ${
          isAnimating
            ? "opacity-0 transform translate-y-4"
            : "opacity-100 transform translate-y-0"
        }`}
      >
        <h1 className="text-xl lg:text-2xl font-bold text-white mb-4 leading-tight">
          {isLogin
            ? "Welcome Back To Mindspeak?"
            : "Creating Memories With MINDSPEAK"}
        </h1>
        <p className="text-white/80 text-lg">
          {isLogin
            ? "Sign in to access your personalized dashboard and continue where you left off."
            : "Join thousands of users who trust MINDSPEAK for their creative journey."}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1d2b7d] flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-6xl bg-slate-800/30 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-xl shadow-black overflow-hidden border border-slate-700/30">
        {/* Mobile Header */}
        <MobileHeader />

        <div className="flex flex-col lg:flex-row lg:min-h-[600px]">
          {/* Animated form switching */}
          <div
            className={`flex flex-col lg:flex-row w-full transition-all duration-500 ease-in-out ${
              isLogin ? "" : "lg:flex-row-reverse"
            }`}
          >
            {/* Form Panel */}
            <div className="w-full lg:w-1/2 p-3 sm:p-4 lg:p-8 xl:p-12 bg-black lg:backdrop-blur-sm">
              <div
                className={`max-w-md mx-auto transition-all duration-300 ${
                  isAnimating
                    ? "opacity-0 transform scale-95"
                    : "opacity-100 transform scale-100"
                }`}
              >
                {/* Logo - Hidden on mobile, shown on desktop */}
                <div className="hidden lg:flex justify-center mb-6 lg:mb-8">
                  <div className="flex items-center justify-center p-4">
                    <Image
                      src={logo}
                      width={80}
                      height={80}
                      alt="Logo"
                      className="w-16 h-16 lg:w-20 animate-pulse lg:h-20 object-contain brightness-125"
                    />
                  </div>
                </div>

                {/* Mobile Logo */}
                <div className="lg:hidden flex justify-center mb-4 sm:mb-6">
                  <div className="flex items-center justify-center shadow-lg bg-white/5 rounded-xl p-3 backdrop-blur-sm">
                    <Image
                      src={logo}
                      width={50}
                      height={50}
                      alt="Logo"
                      className="w-12 h-12 sm:w-16 animate-pulse sm:h-16 object-contain brightness-125"
                    />
                  </div>
                </div>

                {/* Header */}
                <div className="mb-4 sm:mb-6 lg:mb-8 text-center">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                    {isLogin ? "Welcome back" : "Create an account"}
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm lg:text-base">
                    {isLogin
                      ? "Don't have an account? "
                      : "Already have an account? "}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="text-indigo-400 hover:text-indigo-300 underline font-medium transition-colors duration-200"
                      disabled={isAnimating || isLoading}
                    >
                      {isLogin ? "Sign up" : "Log in"}
                    </button>
                  </p>
                  
                  {/* Error Display */}
                  {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-sm font-medium">
                        {error}
                      </p>
                    </div>
                  )}
                </div>

                {/* Forms */}
                {isLogin ? (
                  /* Login Form */
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 sm:space-y-5"
                  >
                    {/* Email */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="login-email"
                        className="text-slate-300 text-sm font-medium"
                      >
                        Email
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChange={(e) =>
                          handleLoginChange("email", e.target.value)
                        }
                        className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 sm:h-12 text-sm sm:text-base rounded-xl transition-all duration-200 hover:border-slate-500"
                        required
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="login-password"
                          className="text-slate-300 text-sm font-medium"
                        >
                          Password
                        </Label>
                        <Link 
                          href="/auth/forgot-password"
                          className="text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
                        >
                          Forgot?
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={loginData.password}
                          onChange={(e) =>
                            handleLoginChange("password", e.target.value)
                          }
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 sm:h-12 text-sm sm:text-base pr-12 rounded-xl transition-all duration-200 hover:border-slate-500"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2  text-slate-400 hover:bg-blur hover:text-white h-10 w-10 sm:h-12 sm:w-12 rounded-lg transition-all duration-200"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-6 h-6 sm:w-8 sm:h-8" />
                          ) : (
                            <Eye className="w-6 h-6 sm:w-8 sm:h-8" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="remember"
                        checked={loginData.rememberMe}
                        onCheckedChange={(checked) =>
                          handleLoginChange("rememberMe", checked as boolean)
                        }
                        className="border-slate-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white h-4 w-4 sm:h-5 sm:w-5 rounded-md transition-all duration-200"
                      />
                      <Label
                        htmlFor="remember"
                        className="text-slate-300 text-xs sm:text-sm"
                      >
                        Remember me for 30 days
                      </Label>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white text-[#1d2b7d] hover:bg-[#1d2b7d] hover:text-white font-semibold py-2.5 sm:py-3 h-11 sm:h-12 rounded-xl text-sm sm:text-base transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isLoading ? "Signing in..." : "Sign in"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Signup Form */
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 sm:space-y-5"
                  >
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="firstName"
                          className="text-slate-300 text-sm font-medium"
                        >
                          First name
                        </Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Fletcher"
                          value={signupData.firstName}
                          onChange={(e) =>
                            handleSignupChange("firstName", e.target.value)
                          }
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 sm:h-12 text-sm sm:text-base rounded-xl transition-all duration-200 hover:border-slate-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="lastName"
                          className="text-slate-300 text-sm font-medium"
                        >
                          Last name
                        </Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Last name"
                          value={signupData.lastName}
                          onChange={(e) =>
                            handleSignupChange("lastName", e.target.value)
                          }
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 sm:h-12 text-sm sm:text-base rounded-xl transition-all duration-200 hover:border-slate-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="signup-email"
                        className="text-slate-300 text-sm font-medium"
                      >
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signupData.email}
                        onChange={(e) =>
                          handleSignupChange("email", e.target.value)
                        }
                        className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 sm:h-12 text-sm sm:text-base rounded-xl transition-all duration-200 hover:border-slate-500"
                        required
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="signup-password"
                        className="text-slate-300 text-sm font-medium"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={signupData.password}
                          onChange={(e) =>
                            handleSignupChange("password", e.target.value)
                          }
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 sm:h-12 text-sm sm:text-base pr-12 rounded-xl transition-all duration-200 hover:border-slate-500"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white hover:bg-blur h-10 w-10 sm:h-12 sm:w-12 rounded-lg transition-all duration-200"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-6 h-6 sm:w-8 sm:h-8" />
                          ) : (
                            <Eye className="w-6 h-6 sm:w-8 sm:h-8" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Anonymous Checkbox */}
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="anonymous"
                        checked={signupData.isAnonymous}
                        onCheckedChange={(checked) =>
                          handleSignupChange("isAnonymous", checked as boolean)
                        }
                        className="border-slate-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white h-4 w-4 sm:h-5 sm:w-5 rounded-md transition-all duration-200 mt-0.5"
                      />
                      <Label
                        htmlFor="anonymous"
                        className="text-slate-300 text-xs sm:text-sm leading-relaxed"
                      >
                        Remain Anonymous
                      </Label>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full bg-white text-[#1d2b7d] hover:bg-[#1d2b7d] hover:text-white font-semibold py-2.5 sm:py-3 h-11 sm:h-12 rounded-xl text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:transform-none"
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating account..." : "Create account"}
                      </Button>
                    </div>
                  </form>
                )}


              </div>
            </div>

            {/* Decorative Panel */}
            <DecorativePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
