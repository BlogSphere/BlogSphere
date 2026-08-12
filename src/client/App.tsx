import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authSuccess, logoutUser } from './redux/authSlice';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import BlogDetail from './pages/BlogDetail';
import Editor from './pages/Editor';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import DailyBriefs from './pages/DailyBriefs';
import LeadershipBoard from './pages/LeadershipBoard';
import Profile from './pages/Profile';
import Communities from './pages/Communities';
import ConnectPeople from './pages/ConnectPeople';
import AdCenter from './pages/AdCenter';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import CollectionEditor from './pages/CollectionEditor';
import AddToCollectionModal from './components/collections/AddToCollectionModal.jsx';
import api from './utils/api';
import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion';
import { Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function AuthRedirectModal() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div
        className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-800 rounded-3xl shadow-2xl p-8 text-center backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-blue-500">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
          Sign In Required
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          You need to be logged in to view articles on BlogSphere. Join our smart community to co-write posts, interact with comments.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
          >
            Sign In to Read
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition-all duration-200 active:scale-[0.98]"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

function BlogProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  if (!isAuthenticated) {
    return <AuthRedirectModal />;
  }

  return <>{children}</>;
}

export default function App() {
  const dispatch = useDispatch();

  // Validate session on startup
  useEffect(() => {
    const hasLocalUser = localStorage.getItem('user');
    if (hasLocalUser) {
      api.get('/api/auth/me')
        .then((res) => {
          dispatch(authSuccess({ user: res.data.user }));
        })
        .catch((err) => {
          console.error('Session restore failed:', err);
          dispatch(logoutUser());
        });
    }
  }, [dispatch]);

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <Router>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
            {/* Navigation Bar */}
            <Navbar />
            <AddToCollectionModal />

            {/* Core Layout Routes */}
            <div className="flex-1 w-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/register" element={<Auth />} />
                <Route path="/blog/:slug" element={<BlogProtectedRoute><BlogDetail /></BlogProtectedRoute>} />
                <Route path="/blog" element={<Navigate to="/" replace />} />
                <Route path="/editor" element={<Editor />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/daily-briefs" element={<DailyBriefs />} />
                <Route path="/leaderboard" element={<LeadershipBoard />} />
                <Route path="/system-admin-sphere" element={<Admin />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/adcenter" element={<AdCenter />} />
                <Route path="/adsense" element={<AdCenter />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/connect" element={<ConnectPeople />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/collections/:slug" element={<CollectionDetail />} />
                <Route path="/collections/new" element={<CollectionEditor />} />
                <Route path="/collections/:id/edit" element={<CollectionEditor />} />
                {/* Fallback routes for unknown or removed paths */}
                <Route path="/galaxy" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>

            {/* Footer */}
            <footer className="py-8 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 text-center text-xs text-slate-400">
              <div className="max-w-7xl mx-auto px-4">
                <p>© {new Date().getFullYear()} BlogSphere — Smart Community Blog Platform. All rights reserved.</p>
              </div>
            </footer>
          </div>
        </Router>
      </MotionConfig>
    </LazyMotion>
  );
}
