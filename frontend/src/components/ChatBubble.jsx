import { useNavigate } from 'react-router-dom';
import './ChatBubble.css';

export default function ChatBubble() {
  const navigate = useNavigate();

  return (
    <div className="cb-wrap">
      <button className="cb-btn" onClick={() => navigate('/message')} title="Tin nhắn">
        💬
      </button>
    </div>
  );
}
