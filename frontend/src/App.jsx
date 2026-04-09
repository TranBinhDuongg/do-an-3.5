import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Login from './pages/user/Login';
import RegisterPage from './pages/user/Register';
import UserRoutes from './routes/UserRoutes';

import AdminLogin from './pages/admin/Login';
import AdminRoutes from './routes/AdminRoutes';

import EmployerHome from './pages/employer/Home';
import Dashboard from './pages/employer/Dashboard';
import PostJob from './pages/employer/PostJob';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => setUser(null);

  return (
    <BrowserRouter>
      <div className="app-root">
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />
          <Route path="/admin/*" element={<AdminRoutes />} />

          {/* Employer (chủ trọ) */}
          <Route path="/employer/*" element={
            <>
              <Navbar user={user} onLogout={handleLogout} />
              <main style={{ flex: 1 }}>
                <Routes>
                  <Route path="/" element={<EmployerHome />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/post-room" element={<PostJob />} />
                </Routes>
              </main>
              <Footer />
            </>
          } />

          {/* User (người thuê) */}
          <Route path="/*" element={
            <UserRoutes user={user} onLogout={handleLogout} />
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
