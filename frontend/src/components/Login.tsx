import { useState, useEffect } from 'react';
import { MapPin, MessageCircle, Calendar, DollarSign } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

// [NEW] Define your Backend URL
const BACKEND_URL = "http://127.0.0.1:5000";

export function Login({ onLogin }: LoginProps) {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    setIsAnimated(true);
  }, []);

  // [NEW] Handler for Google Login
  const handleGoogleLogin = () => {
    // Redirect the browser window to the Flask Backend
    window.location.href = `${BACKEND_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 flex items-center justify-center p-4 overflow-hidden relative transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-pink-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div
        className={`relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center transition-all duration-1000 ${
          isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Left Side - Branding & Info */}
        <div className="text-white space-y-6 px-4 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl transform hover:rotate-12 transition-transform duration-300">
              <MapPin className="w-10 h-10 text-blue-600 absolute" />
              <div className="absolute top-2 right-2 text-blue-600 transform rotate-45">
                ✈️
              </div>
            </div>
            <div>
              <h1 className="text-5xl">FriendUS</h1>
              <p className="text-xl text-white/80 flex items-center gap-2">
                🇻🇳 Explore Vietnam Together
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl leading-tight">
              Connect, Travel &
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Create Memories
              </span>
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              Join the ultimate social platform for discovering Vietnam's hidden gems, 
              planning adventures with friends, and making every journey unforgettable.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <MapPin className="w-8 h-8 mb-2 text-yellow-300" />
              <h3 className="font-semibold mb-1">Discover Places</h3>
              <p className="text-sm text-white/80">Top destinations across Vietnam</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <MessageCircle className="w-8 h-8 mb-2 text-green-300" />
              <h3 className="font-semibold mb-1">Group Chat</h3>
              <p className="text-sm text-white/80">Plan trips with friends</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <DollarSign className="w-8 h-8 mb-2 text-pink-300" />
              <h3 className="font-semibold mb-1">Split Expenses</h3>
              <p className="text-sm text-white/80">Easy money management</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <Calendar className="w-8 h-8 mb-2 text-blue-300" />
              <h3 className="font-semibold mb-1">Trip Planner</h3>
              <p className="text-sm text-white/80">Organize your itinerary</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 lg:p-12 space-y-8 backdrop-blur-xl border border-white/20 transform hover:scale-[1.02] transition-all duration-300">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg mb-4">
              <span className="text-4xl">👋</span>
            </div>
            <h2 className="text-3xl text-gray-800 dark:text-white">Welcome Back!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to continue your adventure
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Sign in with
              </span>
            </div>
          </div>

          {/* Google OAuth Button - UPDATED */}
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 rounded-xl px-6 py-4 flex items-center justify-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105 group"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-lg">Continue with Google</span>
          </button>

          {/* Alternative Login Options */}
          <div className="space-y-3">
            <button
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-6 py-3 flex items-center justify-center gap-3 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 opacity-50 cursor-not-allowed"
              disabled
            >
              <span className="text-2xl">📱</span>
              <span>Phone Number</span>
              <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full">Soon</span>
            </button>
            <button
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-6 py-3 flex items-center justify-center gap-3 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 opacity-50 cursor-not-allowed"
              disabled
            >
              <span className="text-2xl">✉️</span>
              <span>Email Address</span>
              <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full">Soon</span>
            </button>
          </div>

          <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              By continuing, you agree to FriendUS's
              <br />
              <button className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</button>
              {' & '}
              <button className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</button>
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
            <p className="text-center text-sm text-gray-700 dark:text-gray-300">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              <strong>Demo Mode:</strong> Click any button to explore the app
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
    </div>
  );
}