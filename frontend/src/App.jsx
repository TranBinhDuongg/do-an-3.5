import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/user/Login';
import Home from './pages/user/Home';
import Search from './pages/user/Search';
import EmployerHome from './pages/employer/Home';

export default function App() {
  const [user, setUser] = useState(null);
  const logout = () => setUser(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<Home   user={user} onLogout={logout} />} />
        <Route path="/search" element={<Search user={user} onLogout={logout} />} />
        <Route path="/login"    element={<Login  onLogin={setUser} />} />
        <Route path="/employer" element={<EmployerHome user={user} onLogout={logout} />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
