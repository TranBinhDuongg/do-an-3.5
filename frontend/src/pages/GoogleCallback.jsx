import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function GoogleCallback({ onLogin }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const userStr = params.get('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('token', token);
        onLogin(user);
        navigate(user.role === 'employer' ? '/employer' : '/');
      } catch {
        navigate('/login?error=google');
      }
    } else {
      navigate('/login?error=google');
    }
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Đang đăng nhập...</p>
    </div>
  );
}
