import { useState, useEffect } from 'react';
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
import EmployerRoomDetail from './pages/employer/RoomDetail';
import EditRoom from './pages/employer/EditRoom';
import Wallet from './pages/employer/Wallet';
import EmployerBookings from './pages/employer/Bookings';
import MaintenanceManage from './pages/employer/MaintenanceManage';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminRooms from './pages/admin/Rooms';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import AdminTopups from './pages/admin/Topups';
import Profile from './pages/Profile';
import Message from './pages/user/Message';
import Favorites from './pages/user/Favorites';
import Bookings from './pages/user/Bookings';
import Maintenance from './pages/user/Maintenance';
import ContractView from './pages/ContractView';
import ChatBubble from './components/ChatBubble';
import GoogleCallback from './pages/GoogleCallback';
import RoomDetail from './pages/user/RoomDetail';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
}

function ChatBubbleWrapper() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin') || ['/login', '/register', '/forgot-password', '/terms', '/privacy', '/message'].includes(pathname)) return null;
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
      <ScrollToTop />
      <Routes>
        <Route path="/"       element={<Home   user={user} onLogout={logout} />} />
        <Route path="/search"   element={<Search  user={user} onLogout={logout} />} />
        <Route path="/room/:id" element={<RoomDetail user={user} onLogout={logout} />} />
        <Route path="/message"  element={<Message user={user} onLogout={logout} />} />
        <Route path="/login"           element={<Login          onLogin={login} />} />
        <Route path="/register"        element={<Register       onLogin={login} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback onLogin={login} />} />
        <Route path="/terms"           element={<Terms />} />
        <Route path="/privacy"         element={<Privacy />} />
        <Route path="/admin/login"     element={<AdminLogin onLogin={login} />} />
        <Route path="/admin/dashboard" element={<AdminDashboard user={user} onLogout={logout} />} />
        <Route path="/admin/rooms"     element={<AdminRooms     user={user} onLogout={logout} />} />
        <Route path="/admin/users"     element={<AdminUsers     user={user} onLogout={logout} />} />
        <Route path="/admin/reports"   element={<AdminReports   user={user} onLogout={logout} />} />
        <Route path="/admin/topups"    element={<AdminTopups    user={user} onLogout={logout} />} />
        <Route path="/profile"    element={<Profile   user={user} onLogin={login} onLogout={logout} />} />
        <Route path="/favorites"  element={<Favorites user={user} onLogout={logout} />} />
        <Route path="/bookings"   element={<Bookings  user={user} onLogout={logout} />} />
        <Route path="/bookings/:bookingId/contract" element={<ContractView user={user} onLogout={logout} />} />
        <Route path="/maintenance" element={<Maintenance user={user} onLogout={logout} />} />
        <Route path="/employer"       element={<EmployerHome user={user} onLogout={logout} />} />
        <Route path="/employer/rooms"   element={<Rooms    user={user} onLogout={logout} />} />
        <Route path="/employer/post"    element={<PostRoom user={user} onLogout={logout} />} />
        <Route path="/employer/pricing" element={<Pricing  user={user} onLogout={logout} />} />
        <Route path="/employer/rooms/:id" element={<EmployerRoomDetail user={user} onLogout={logout} />} />
        <Route path="/employer/rooms/:id/edit" element={<EditRoom user={user} onLogout={logout} />} />
        <Route path="/employer/wallet"         element={<Wallet   user={user} onLogout={logout} />} />
        <Route path="/employer/bookings"       element={<EmployerBookings user={user} onLogout={logout} />} />
        <Route path="/employer/bookings/:bookingId/contract" element={<ContractView user={user} onLogout={logout} />} />
        <Route path="/employer/maintenance"    element={<MaintenanceManage user={user} onLogout={logout} />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
      <ChatBubbleWrapper />
    </BrowserRouter>
  );
}
