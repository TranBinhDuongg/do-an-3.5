import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Login from './pages/user/Login';
import Register from './pages/user/Register';
import ForgotPassword from './pages/user/ForgotPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Home from './pages/user/Home';
import Search from './pages/user/Search';
import EmployerHome from './pages/employer/Home';
import PostRoom from './pages/employer/PostRoom';
import Rooms from './pages/employer/Rooms';
import Pricing from './pages/employer/Pricing';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminRooms from './pages/admin/Rooms';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import Profile from './pages/Profile';
import Message from './pages/user/Message';
import Favorites from './pages/user/Favorites';
import ChatBubble from './components/ChatBubble';

function ChatBubbleWrapper() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin') || ['/login', '/register', '/forgot-password', '/terms', '/privacy'].includes(pathname)) return null;
  return <ChatBubble />;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
  });

  const login = (u) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<Home   user={user} onLogout={logout} />} />
        <Route path="/search"   element={<Search  user={user} onLogout={logout} />} />
        <Route path="/message"  element={<Message user={user} onLogout={logout} />} />
        <Route path="/login"           element={<Login          onLogin={login} />} />
        <Route path="/register"        element={<Register       onLogin={login} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms"           element={<Terms />} />
        <Route path="/privacy"         element={<Privacy />} />
        <Route path="/admin/login"     element={<AdminLogin onLogin={login} />} />
        <Route path="/admin/dashboard" element={<AdminDashboard user={user} onLogout={logout} />} />
        <Route path="/admin/rooms"     element={<AdminRooms     user={user} onLogout={logout} />} />
        <Route path="/admin/users"     element={<AdminUsers     user={user} onLogout={logout} />} />
        <Route path="/admin/reports"   element={<AdminReports   user={user} onLogout={logout} />} />
        <Route path="/profile"    element={<Profile   user={user} onLogin={login} onLogout={logout} />} />
        <Route path="/favorites"  element={<Favorites user={user} onLogout={logout} />} />
        <Route path="/employer"       element={<EmployerHome user={user} onLogout={logout} />} />
        <Route path="/employer/rooms"   element={<Rooms    user={user} onLogout={logout} />} />
        <Route path="/employer/post"    element={<PostRoom user={user} onLogout={logout} />} />
        <Route path="/employer/pricing" element={<Pricing  user={user} onLogout={logout} />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
      <ChatBubbleWrapper />
    </BrowserRouter>
  );
}
