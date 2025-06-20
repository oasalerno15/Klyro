'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/lib/auth';
import ModernGraph from '@/components/ModernGraph';
import AIInsightsSection from '@/components/AIInsightsSection';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const { user } = useAuth();
  const supabase = createClient();

  // Payment links
  const PAYMENT_LINKS = {
    starter: 'https://buy.stripe.com/test_00w4gy5ikd3j4cx8PmcbC00',
    pro: 'https://buy.stripe.com/test_8x27sK124fbr4cx4z6cbC01',
    premium: 'https://buy.stripe.com/test_6oU7sKaCE8N39wRghOcbC02'
  };
  
  // Check for payment success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true') {
      setShowSuccessMessage(true);
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);
    }
    
    if (canceled === 'true') {
      setAuthError('Payment was canceled. You can try again anytime.');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  // Check for auth errors from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    
    if (error) {
      if (error === 'auth_error' && message) {
        setAuthError(`Authentication failed: ${decodeURIComponent(message)}`);
      } else if (error === 'no_code') {
        setAuthError('No authentication code received from Google');
      } else {
        setAuthError('Authentication error occurred');
      }
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setAuthError('');
      
      console.log('Attempting Google sign-in...');
      console.log('Current origin:', window.location.origin);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('Google sign-in error:', error);
        console.error('Redirect URL used:', `${window.location.origin}/auth/callback`);
        
        if (error.message.includes('provider is not enabled')) {
          setAuthError('Google sign-in is not properly configured. Please check Supabase settings.');
        } else if (error.message.includes('redirect_uri_mismatch')) {
          setAuthError('Redirect URL mismatch. Please check Google OAuth configuration.');
        } else if (error.message.includes('Project not specified')) {
          setAuthError('Supabase project configuration error. Please check your environment variables.');
        } else {
          setAuthError(`Google sign-in failed: ${error.message}`);
        }
      } else {
        console.log('Google sign-in initiated successfully', data);
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setAuthError(`Failed to sign in with Google: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!email || !password) {
      setAuthError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      let result;
      
      if (isSignUp) {
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password
        });
      }
      
      if (result.error) {
        if (result.error.message.includes('Invalid login credentials')) {
          setAuthError('Invalid email or password');
        } else if (result.error.message.includes('User already registered')) {
          setAuthError('Email already in use');
        } else if (result.error.message.includes('Password should be at least')) {
          setAuthError('Password is too weak (minimum 6 characters)');
        } else {
          setAuthError(result.error.message);
        }
      } else {
        if (isSignUp && !result.data.user?.email_confirmed_at) {
          setAuthError('Please check your email to confirm your account');
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setAuthError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setAuthError('');
  };
  
  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const shimmer = {
    hidden: { 
      opacity: 0,
      backgroundPosition: '200% 0',
    },
    visible: { 
      opacity: 1,
      backgroundPosition: '-200% 0',
      transition: {
        duration: 3,
        ease: "linear",
        repeat: Infinity
      }
    }
  };

  const slideInLeft = {
    hidden: { 
      opacity: 0,
      x: -100,
      rotate: -5
    },
    visible: {
      opacity: 1,
      x: 0,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  };

  const slideInRight = {
    hidden: { 
      opacity: 0,
      x: 100,
      rotate: 5
    },
    visible: {
      opacity: 1,
      x: 0,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  };

  const scaleIn = {
    hidden: { 
      opacity: 0,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  };

  const staggerChildren = {
    visible: {
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const floatingCard = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      rotate: -10,
      x: -100
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 3,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 1
      }
    }
  };

  const textReveal = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const checkmarkAnimation = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeInOut"
      }
    }
  };

  // Pre-calculated grid positions for a more professional look
  const gridElements = Array.from({ length: 25 }, (_, i) => ({
    x: (i % 5) * 20 + 10,
    y: Math.floor(i / 5) * 20 + 10,
  }));

  // Handle payment flow
  const handlePayment = (tier: 'starter' | 'pro' | 'premium') => {
    // If user is not signed in, prompt them to sign in first
    if (!user) {
      setAuthError('Please sign in or create an account before purchasing a subscription. This helps us associate your payment with your account.');
      setShowAuthModal(true);
      return;
    }

    // Construct the payment URL with proper success/cancel URLs
    const baseUrl = window.location.origin;
    const paymentUrl = PAYMENT_LINKS[tier];
    
    // Store user info in localStorage so webhook can find them
    localStorage.setItem('klyro_payment_user_email', user.email || '');
    localStorage.setItem('klyro_payment_tier', tier);
    localStorage.setItem('klyro_payment_timestamp', Date.now().toString());
    
    console.log(`Redirecting ${user.email} to ${tier} payment...`);
    console.log(`Success URL should be: ${baseUrl}/?success=true`);
    console.log(`Cancel URL should be: ${baseUrl}/?canceled=true`);
    
    // Note: For Stripe Payment Links, you need to configure the success and cancel URLs
    // in your Stripe Dashboard under the Payment Link settings:
    // Success URL: https://your-domain.com/?success=true
    // Cancel URL: https://your-domain.com/?canceled=true
    
    // Redirect to Stripe
    window.location.href = paymentUrl;
  };

  return (
    <div className="relative">
      {/* Success Message Modal */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
          <motion.div 
            className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600">
                Thank you for subscribing to Klyro. Please wait while we redirect you to your dashboard...
              </p>
            </div>
            
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-600">Redirecting...</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative min-h-screen">
        {/* Background image with parallax */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1421789665209-c9b2a435e3dc?q=80&w=2942&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.8)',
          }}
          initial={{ scale: 1.1 }}
          animate={{ 
            scale: 1,
            transition: { duration: 0.8, ease: "easeOut" }
          }}
        />
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50 z-10"></div>

        {/* Navigation with cream white background - Made sticky */}
        <motion.nav 
          className="fixed top-0 left-0 right-0 z-20 bg-cream-50/95 backdrop-blur-md border-b border-cream-200/50"
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          style={{ backgroundColor: 'rgba(254, 252, 232, 0.95)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo - Made MUCH MUCH bigger and black */}
              <motion.div 
                className="flex items-center"
                variants={slideInLeft}
              >
                <img 
                  src="https://i.imgur.com/yk9L9Nx.png" 
                  alt="Klyro Logo" 
                  className="w-24 h-24 mr-2 brightness-0"
                  style={{ filter: 'brightness(0)' }}
                />
                <span className="text-2xl font-bold text-gray-900">Klyro</span>
              </motion.div>

              {/* Center Navigation - Removed Blog */}
              <motion.div 
                className="hidden md:flex items-center space-x-8"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.2
                    }
                  }
                }}
              >
                {[
                  {name: "Product", href: "#features"},
                  {name: "Pricing", href: "#pricing"},
                  {name: "Resources", href: "#resources"},
                  {name: "About", href: "#about"}
                ].map((item, i) => (
                  <motion.a
                    key={i}
                    href={item.href}
                    className="text-gray-700/80 hover:text-gray-900 text-lg font-medium transition-colors duration-200 relative group"
                    variants={{
                      hidden: { opacity: 0, y: -10 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.4,
                          ease: "easeOut"
                        }
                      }
                    }}
                    whileHover={{ y: -1 }}
                  >
                    {item.name}
                    <span className="absolute inset-x-0 -bottom-1 h-px bg-gray-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
                  </motion.a>
                ))}
              </motion.div>

              {/* Right side buttons */}
              <motion.div 
                className="flex items-center space-x-4"
                variants={slideInRight}
              >
                <motion.button
                  onClick={() => setShowAuthModal(true)}
                  className="text-gray-700/80 hover:text-gray-900 text-sm font-medium transition-colors duration-200"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Log in
                </motion.button>
                <motion.button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors duration-200 shadow-lg"
                  whileHover={{ y: -1, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign up
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.nav>

        {/* Main content with staggered animations - Added top padding for sticky nav */}
        <main className="relative z-10 flex items-center justify-center min-h-screen pt-16">
          <motion.div 
            className="text-center px-4"
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
          >
            <motion.h1 
              className="text-7xl font-bold text-white mb-6 tracking-tight"
              variants={fadeInUp}
            >
              <motion.span 
                className="block"
                variants={slideInLeft}
              >
                Master Your Money.
              </motion.span>
              <motion.span 
                className="block mt-4"
                variants={slideInRight}
              >
                Understand Your Emotions.
              </motion.span>
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-200 mb-32 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Klyro connects your emotional wellbeing with your financial health, helping you make more mindful money decisions.
            </motion.p>
            
            <div className="flex flex-col items-center justify-center gap-4 mx-auto">
              <motion.button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="bg-white text-gray-900 rounded-lg px-8 py-4 font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-2 w-64 relative overflow-hidden group"
                variants={scaleIn}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-gray-50 via-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ x: '100%' }}
                  whileHover={{ 
                    x: '-100%',
                    transition: { duration: 1, ease: "easeInOut" }
                  }}
                />
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                  className="w-5 h-5 relative z-10"
                />
                <span className="relative z-10">
                  {loading ? 'Signing in...' : 'Sign in with Google'}
                </span>
              </motion.button>
              
              <motion.button
                onClick={() => setShowAuthModal(true)}
                disabled={loading}
                className="bg-gray-900 text-white rounded-lg px-8 py-4 font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 w-64 relative overflow-hidden group"
                variants={scaleIn}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ x: '100%' }}
                  whileHover={{ 
                    x: '-100%',
                    transition: { duration: 1, ease: "easeInOut" }
                  }}
                />
                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="relative z-10">
                  {loading ? 'Processing...' : 'Email Sign In'}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Email/Password Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
          <motion.div 
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isSignUp ? 'Create an Account' : 'Welcome Back'}
              </h2>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {authError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {authError}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-colors"
                  placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white rounded-lg py-3 font-medium hover:bg-gray-800 transition-colors"
              >
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button 
                onClick={toggleAuthMode}
                className="text-gray-900 text-sm hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* About Us Section - MOVED TO SECOND POSITION */}
      <motion.section 
        id="about"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="bg-gradient-to-b from-gray-50 to-white py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div variants={slideInLeft} className="space-y-8">
              <h2 className="text-4xl font-bold text-gray-900">Our Story</h2>
              <div className="space-y-6">
                <p className="text-lg text-gray-700 leading-relaxed">
                  At Klyro, we believe true financial wellness requires understanding both your money and emotions. Traditional finance apps focus on numbers but miss the human behind the transaction.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  I founded Klyro because I was tired of spending so much money via my Iphone. I often found myself constantly using Apple Pay without really feeling like I was spending money. It was just a tap and done. However once I started to ask for receipts, everything changed. That simple piece of paper made transactions feel real. For the first time I could actually process that I just spent money somewhere.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Digital payments have made spending so effortless we have lost the true feeling of what it means to spend money. When everything happens on your phone, it doesn't feel real. We're building a platform that brings back awareness, helping you understand not just how much you spend, but why.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              variants={slideInRight}
              className="rounded-2xl overflow-hidden shadow-xl h-[400px]"
            >
              <img 
                src="https://i.postimg.cc/FsQF5Grx/IMG-4493.jpg"
                alt="Klyro team"
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* AI Insights Section */}
      <AIInsightsSection />

      {/* Modern Features Section with enhanced animations */}
      <motion.section 
        id="features"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="bg-white py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24">
            {/* Enhanced Placeholder Image */}
            <motion.div
              variants={slideInLeft}
              className="relative rounded-3xl overflow-hidden group h-[650px]"
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
            >
              {/* Professional image */}
              <img 
                src="https://images.unsplash.com/photo-1696992443065-64eadfc2ded1?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                alt="Business professional checking finances"
                className="w-full h-full object-cover object-center"
              />
              
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
              
              {/* Klyro metric cards in a 2x2 grid */}
              <div className="absolute left-6 bottom-6 flex space-x-4">
                {/* Left column - stacked cards */}
                <div className="space-y-3">
              <motion.div
                    className="bg-white rounded-xl shadow-lg p-4 w-48"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">Today's mood score</p>
                      <button className="text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-1">
                      <p className="text-2xl font-semibold">86/100</p>
                      <div className="flex items-center mt-1">
                        <span className="text-emerald-500 text-sm flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          12%
                        </span>
                        <span className="text-xs text-gray-500 ml-1">from yesterday</span>
                      </div>
                    </div>
              </motion.div>
                  
              <motion.div
                    className="bg-white rounded-xl shadow-lg p-4 w-48"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">Calm Capital</p>
                      <button className="text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-1">
                      <p className="text-2xl font-semibold">$1,245.89</p>
                      <div className="flex items-center mt-1">
                        <span className="text-rose-500 text-sm flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          3%
                        </span>
                        <span className="text-xs text-gray-500 ml-1">this week</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Right column - stacked cards */}
                <div className="space-y-3">
                  <motion.div 
                    className="bg-white rounded-xl shadow-lg p-4 w-48"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">Monthly savings</p>
                      <button className="text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-1">
                      <p className="text-2xl font-semibold">$748.50</p>
                      <div className="flex items-center mt-1">
                        <span className="text-emerald-500 text-sm flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          8.2%
                        </span>
                        <span className="text-xs text-gray-500 ml-1">from last month</span>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-white rounded-xl shadow-lg p-4 w-48"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">Mood x Money Score</p>
                      <button className="text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-1">
                      <p className="text-2xl font-semibold">92.3%</p>
                      <div className="flex items-center mt-1">
                        <span className="text-emerald-500 text-sm flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          5.6%
                        </span>
                        <span className="text-xs text-gray-500 ml-1">this week</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
              
              {/* Pagination dots */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                <div className="w-2 h-2 bg-white/50 rounded-full"></div>
              </div>
            </motion.div>

            {/* Content with enhanced animations */}
            <div className="space-y-16">
              <div className="space-y-4">
                <motion.h2 
                  variants={slideInRight}
                  className="text-5xl font-bold text-gray-900"
                >
                  Financial wellness meets emotional intelligence
                </motion.h2>
                <motion.p 
                  variants={fadeInUp}
                  className="text-xl text-gray-600"
                >
                  Your emotions and finances, connected in one innovative platform.
                </motion.p>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-12">
                {[
                  {
                    title: "Emotional Intelligence Meets Financial Wisdom",
                    description: "Klyro analyzes the connection between your emotional state and spending habits, providing personalized insights that help you make more mindful financial decisions."
                  },
                  {
                    title: "Track Your Complete Financial Story",
                    description: "Track both your financial transactions and emotional wellbeing in one place. Klyro helps you understand patterns and correlations that traditional finance apps miss."
                  },
                  {
                    title: "AI-powered guidance",
                    description: "Our conversational AI assistant provides empathetic, personalized financial advice that considers both your financial goals and emotional context, delivering guidance when you need it most."
                  },
                  {
                    title: "Simple visualization",
                    description: "Beautiful, intuitive dashboards help you visualize your financial health alongside emotional trends. Gain clarity with metrics that measure both aspects of your wellbeing in one unified view."
                  }
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { 
                        opacity: 0,
                        y: 20,
                        x: i % 2 === 0 ? -20 : 20
                      },
                      visible: {
                        opacity: 1,
                        y: 0,
                        x: 0,
                        transition: {
                          type: "spring",
                          stiffness: 100,
                          damping: 20,
                          delay: i * 0.1
                        }
                      }
                    }}
                    className="space-y-3 group"
                    whileHover={{
                      y: -5,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-base leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* NEW TESTIMONIALS SECTION */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="bg-gradient-to-b from-gray-50 to-white py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real stories from people who've transformed their financial wellness with Klyro
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <motion.div 
              variants={slideInLeft}
              className="bg-white rounded-2xl shadow-lg p-8 relative"
            >
              <div className="flex items-center mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                  alt="Sarah M."
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">Sarah M.</h4>
                  <p className="text-gray-600 text-sm">Marketing Director</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                "Klyro helped me understand why I was overspending during stressful weeks. The mood tracking feature was eye-opening—I saved $800 last month just by being more mindful!"
              </p>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div 
              variants={fadeInUp}
              className="bg-white rounded-2xl shadow-lg p-8 relative"
            >
              <div className="flex items-center mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                  alt="Michael R."
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">Michael R.</h4>
                  <p className="text-gray-600 text-sm">Software Engineer</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                "The AI insights are incredible. Klyro spotted patterns I never noticed and helped me align my spending with my actual values. My financial stress has decreased significantly."
              </p>
            </motion.div>

            {/* Testimonial 3 */}
            <motion.div 
              variants={slideInRight}
              className="bg-white rounded-2xl shadow-lg p-8 relative"
            >
              <div className="flex items-center mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                  alt="Jessica L."
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">Jessica L.</h4>
                  <p className="text-gray-600 text-sm">Small Business Owner</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                "As an entrepreneur, my emotions directly impact my business decisions. Klyro's mood-money connection insights have made me a more strategic spender and saver."
              </p>
            </motion.div>
          </div>
          
          {/* Stats Row */}
          <motion.div 
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center"
          >
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">94%</div>
              <p className="text-gray-600">Report better financial decisions</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">$1,200</div>
              <p className="text-gray-600">Average monthly savings increase</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">85%</div>
              <p className="text-gray-600">Reduced financial stress levels</p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Pricing Plans Section - MOVED TO END */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="bg-gradient-to-b from-gray-50 to-white py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Start your journey to financial wellness with the plan that fits your needs</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan - $9.99 */}
            <motion.div 
              variants={slideInLeft}
              className="bg-white rounded-2xl shadow-lg overflow-visible transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-200 flex flex-col h-full"
            >
              <div className="p-8 flex flex-col flex-grow">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">$9.99</div>
                  <p className="text-gray-500">per month</p>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    20 transactions per month
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    20 receipt scans per month
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    10 AI chats per month
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Mood tracking
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Email support
                  </li>
                </ul>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePayment('starter')}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors mt-auto"
                >
                  Get Started
                </motion.button>
              </div>
            </motion.div>
            
            {/* Pro Plan - $24.99 (Popular) */}
            <motion.div 
              variants={fadeInUp}
              className="bg-white rounded-2xl shadow-xl overflow-visible transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 border-gray-900 relative flex flex-col h-full mt-4"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg whitespace-nowrap">Most Popular</span>
              </div>
              <div className="p-8 pt-12 flex flex-col flex-grow">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">$24.99</div>
                  <p className="text-gray-500">per month</p>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    50 transactions per month
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    50 receipt scans per month
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    100 AI chats per month
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    All Starter features
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Email support
                  </li>
                </ul>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePayment('pro')}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors mt-auto"
                >
                  Get Started
                </motion.button>
              </div>
            </motion.div>
            
            {/* Premium Plan - $49.99 */}
            <motion.div 
              variants={slideInRight}
              className="bg-white rounded-2xl shadow-lg overflow-visible transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-200 flex flex-col h-full"
            >
              <div className="p-8 flex flex-col flex-grow">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">$49.99</div>
                  <p className="text-gray-500">per month</p>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    500 transactions per month
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    500 receipt scans per month
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    500 AI chats per month
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    All Pro features
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Email support
                  </li>
                </ul>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePayment('premium')}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors mt-auto"
                >
                  Get Started
                </motion.button>
              </div>
            </motion.div>
          </div>
          
          {/* Additional info */}
          <motion.div variants={fadeInUp} className="text-center mt-12">
            <p className="text-gray-600 mb-4">All plans include a 14-day free trial. No credit card required.</p>
            <p className="text-sm text-gray-500">Cancel anytime. Upgrade or downgrade your plan as needed.</p>
          </motion.div>
        </div>
      </motion.section>

      {/* Floating Card Section with enhanced animations */}
      <motion.section 
        id="contact"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="bg-gradient-to-b from-gray-50 to-white py-32 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-8">
            <motion.div 
              variants={fadeInUp}
              className="text-center"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h2>
              <p className="text-xl text-gray-600 mb-8">Have questions? We'd love to hear from you.</p>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col items-center space-y-4"
            >
              <a href="mailto:support@klyro.app" className="text-gray-600 hover:text-gray-900 transition-colors text-lg">
                support@klyro.app
              </a>
              
              {/* Legal Links */}
              <div className="flex space-x-6 text-sm">
                <a href="/terms" className="text-gray-500 hover:text-gray-700 transition-colors">
                  Terms of Service
                </a>
                <a href="/privacy" className="text-gray-500 hover:text-gray-700 transition-colors">
                  Privacy Policy
                </a>
              </div>
              
              <div className="flex space-x-6">
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
