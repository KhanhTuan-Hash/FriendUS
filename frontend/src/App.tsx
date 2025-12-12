import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, MessageCircle, CloudSun, User, Moon, Sun } from 'lucide-react';
import { Homepage } from './components/Homepage';
import { MapView } from './components/MapView';
import { Chat } from './components/Chat';
import { Weather } from './components/Weather';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Navigation Config
const NAV_ITEMS = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/map', icon: Map, label: 'Map' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/weather', icon: CloudSun, label: 'Weather' },
  { path: '/profile', icon: User, label: 'Profile' },
];

function MainLayout() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Force browser to go to Backend Logout to clear cookies
    window.location.href = "http://127.0.0.1:5000/auth/logout";
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300 relative z-[200]">
        <div className="max-w-full px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* --- RESTORED LOGO --- */}
            <div 
              className="flex items-center gap-3 flex-shrink-0 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 1C8 1 6 3 6 5.5C6 8 11 13 11 13C11 13 16 8 16 5.5C16 3 14 1 11 1Z" fill="white" />
                  <g transform="translate(11, 5.5)">
                    <g transform="rotate(-45)">
                      <rect x="-4" y="-0.5" width="8" height="1" fill="#3B82F6" rx="0.5"/>
                      <polygon points="-1,-2.5 1,-2.5 1,-0.5 -1,-0.5" fill="#3B82F6"/>
                    </g>
                  </g>
                  <path d="M5 15C7 13 9 10 11 7" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 2"/>
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  FriendUS
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Discover together</p>
              </div>
            </div>

            {/* Navigation Tabs (Working with Router) */}
            <nav className="flex items-center gap-1 sm:gap-2 flex-1 justify-center max-w-2xl mx-4">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`
                      relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-300
                      ${isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-400/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                    <span className="hidden md:inline text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* --- RESTORED SLIDING THEME TOGGLE --- */}
            <div className="flex-shrink-0">
              <button
                onClick={toggleTheme}
                className="relative w-14 h-8 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-gray-600 dark:to-gray-700 rounded-full transition-all duration-300 hover:shadow-lg flex items-center overflow-hidden"
                aria-label="Toggle theme"
              >
                {/* Sliding background */}
                <div className={`absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-indigo-600 dark:to-purple-700 transition-all duration-300 ${
                  theme === 'dark' ? 'opacity-100' : 'opacity-0'
                }`} />
                
                {/* Toggle circle */}
                <div className={`relative w-6 h-6 bg-white dark:bg-gray-900 rounded-full shadow-md transform transition-all duration-300 flex items-center justify-center mx-1 ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                }`}>
                  {theme === 'light' ? (
                    <Sun className="w-3.5 h-3.5 text-yellow-500" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/dashboard" element={<Homepage />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/profile" element={<Profile onLogout={handleLogout} />} /> {/* My Profile */}
          <Route path="/profile/:userId" element={<Profile />} /> {/* Other User's Profile */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginWrapper />} />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

function LoginWrapper() {
  const navigate = useNavigate();
  return <Login onLogin={() => navigate('/dashboard')} />;
}