import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Login from './pages/user/Login';
import Home from './pages/user/Home';
import Search from './pages/user/Search';
import EmployerHome from './pages/employer/Home';
import PostRoom from './pages/employer/PostRoom';
import Rooms from './pages/employer/Rooms';
import Pricing from './pages/employer/Pricing';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import Message from './pages/user/Message';
import ChatBubble from './components/ChatBubble';

const HIDE_CHAT_PATHS = ['/login', '/register', '/admin/login'];

function ChatBubbleWrapper() {
  const { pathname } = useLocation();
  if (HIDE_CHAT_PATHS.includes(pathname)) return null;
  return <ChatBubble />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<Home   user={user} onLogout={logout} />} />
        <Route path="/search"   element={<Search  user={user} onLogout={logout} />} />
        <Route path="/message"  element={<Message user={user} onLogout={logout} />} />
        <Route path="/login"       element={<Login      onLogin={setUser} />} />
        <Route path="/admin/login"     element={<AdminLogin onLogin={setUser} />} />
        <Route path="/admin/dashboard" element={<AdminDashboard user={user} onLogout={logout} />} />
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
