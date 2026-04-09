import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/user/Login';
import Home from './pages/user/Home';

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/" element={<Home user={user} onLogout={() => setUser(null)} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        {/* default: trang chủ */}
      </Routes>
    </BrowserRouter>
  );
}
