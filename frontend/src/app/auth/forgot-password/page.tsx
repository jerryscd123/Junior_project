"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import logo from "@/assets/logo9.png";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would send a request to the backend
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#1d2b7d] flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-md bg-slate-800/30 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-xl shadow-black overflow-hidden border border-slate-700/30">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <Link href="/auth/login" className="text-white/80 hover:text-white hover:bg-white/10 text-xs sm:text-sm p-2 rounded-lg transition-all duration-200 flex items-center dark:text-black/80 dark:hover:text-black dark:hover:bg-black/10">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to sign in
            </Link>
            <Link href="/auth/signup" className="text-white/80 hover:text-white hover:bg-white/10 text-xs sm:text-sm p-2 rounded-lg transition-all duration-200 dark:text-black/80 dark:hover:text-black dark:hover:bg-black/10">
              Sign Up
            </Link>
          </div>

          <div className="flex justify-center mb-6">
            <Image
              src={logo}
              width={80}
              height={80}
              alt="Logo"
              className="w-16 h-16 animate-pulse object-contain brightness-125"
            />
          </div>

          {!isSubmitted ? (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Reset your password</h1>
                <p className="text-slate-400 text-sm">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-slate-300 text-sm font-medium"
                  >
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 sm:h-12 text-sm sm:text-base rounded-xl transition-all duration-200 hover:border-slate-500"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-white text-[#1d2b7d] hover:bg-[#1d2b7d] hover:text-white font-semibold py-2.5 sm:py-3 h-11 sm:h-12 rounded-xl text-sm sm:text-base transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Send reset link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-slate-400 text-sm mb-6">
                We&apos;ve sent a password reset link to <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-slate-500 text-xs">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <button 
                  onClick={() => setIsSubmitted(false)} 
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  try again
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}