import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserNavbar from '../components/UserNavbar';
import EmployerNavbar from '../components/EmployerNavbar';
import { getContractByBookingApi, updateContractTermsApi } from '../api/bookings';
import { ContractTemplate } from './contractTemplates';
import './ContractView.css';

export default function ContractView({ user, onLogout }) {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState(false);
  const docRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    load();
  }, [bookingId, user]);

  const load = () => {
    setLoading(true);
    getContractByBookingApi(bookingId)
      .then(d => setContract(d.contract))
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(''), 3000);
  };

  // Bật chế độ chỉnh sửa
  const handleEdit = () => {
    setEditing(true);
    setTimeout(() => docRef.current?.focus(), 50);
  };

  // Lưu nội dung đã chỉnh sửa (lưu phần dieu_khoan nếu muốn, hoặc chỉ dùng local)
  const handleSave = async () => {
    setEditing(false);
    showToast('Đã lưu chỉnh sửa (chỉ áp dụng khi xuất file)');
  };

  // Xuất PDF qua print
  const handlePrint = () => {
    setEditing(false);
    setTimeout(() => window.print(), 100);
  };

  const Navbar = user?.role === 'employer'
    ? <EmployerNavbar user={user} onLogout={onLogout} />
    : <UserNavbar user={user} onLogout={onLogout} />;

  if (loading) return (
    <div className="cv-wrap">
      {Navbar}
      <div className="cv-loading"><div className="cv-spinner" /><p>Đang tải hợp đồng...</p></div>
    </div>
  );

  if (!contract) return null;

  const statusMap = {
    draft:      { text: 'Chờ ký',       cls: 'draft'     },
    signed:     { text: 'Đã ký',        cls: 'signed'    },
    terminated: { text: 'Đã chấm dứt', cls: 'terminated' },
    expired:    { text: 'Đã hết hạn',   cls: 'expired'   },
  };
  const s = statusMap[contract.trang_thai] || statusMap.draft;

  // Phần chữ ký cuối hợp đồng (plain text, không ô)
  const SignSection = () => (
    <div className="ct-sign">
      <div className="ct-sign-row">
        <div className="ct-sign-col">
          <p className="ct-sign-role">BÊN A (Chủ nhà)</p>
          <p className="ct-sign-name">{contract.ten_chu_tro}</p>
          <p className="ct-sign-status">
            {contract.chu_tro_ky ? '(Đã ký)' : '(Chưa ký)'}
          </p>
        </div>
        <div className="ct-sign-col">
          <p className="ct-sign-role">BÊN B (Người thuê)</p>
          <p className="ct-sign-name">{contract.ten_nguoi_thue}</p>
          <p className="ct-sign-status">
            {contract.nguoi_thue_ky ? '(Đã ký)' : '(Chưa ký)'}
          </p>
        </div>
      </div>
      {contract.ngay_ky && (
        <p className="ct-sign-date">Ngày ký: {new Date(contract.ngay_ky).toLocaleDateString('vi-VN')}</p>
      )}
    </div>
  );

  return (
    <div className="cv-wrap">
      {Navbar}
      {toast && <div className={`cv-toast ${toast.isError ? 'error' : 'success'}`}>{toast.msg}</div>}

      <div className="cv-container">
        {/* Toolbar — ẩn khi in */}
        <div className="cv-toolbar no-print">
          <button onClick={() => navigate(-1)} className="cv-back-btn">← Quay lại</button>
          <div className="cv-toolbar-right">
            <span className={`cv-status ${s.cls}`}>{s.text}</span>
            {!editing
              ? <button className="cv-btn-edit" onClick={handleEdit}>✏️ Chỉnh sửa</button>
              : <button className="cv-btn-save" onClick={handleSave}>✔ Xong</button>
            }
            <button className="cv-btn-print" onClick={handlePrint}>🖨️ Xuất PDF</button>
          </div>
        </div>

        {editing && (
          <p className="cv-edit-hint no-print">
            💡 Bạn đang chỉnh sửa trực tiếp — click vào bất kỳ chỗ nào để sửa văn bản.
          </p>
        )}

        {/* Tài liệu hợp đồng */}
        <div
          id="cv-printable"
          className={`cv-doc${editing ? ' cv-doc--editing' : ''}`}
          ref={docRef}
          contentEditable={editing}
          suppressContentEditableWarning
        >
          <ContractTemplate contract={contract} />

          {/* Thỏa thuận bổ sung */}
          {contract.dieu_khoan && (
            <div className="ct-dieu">
              <p className="ct-dieu-title">Điều bổ sung. Thỏa thuận thêm</p>
              {contract.dieu_khoan.split('\n').map((line, i) => (
                <p key={i}>{line || '\u00A0'}</p>
              ))}
            </div>
          )}

          <SignSection />
        </div>
      </div>
    </div>
  );
}
