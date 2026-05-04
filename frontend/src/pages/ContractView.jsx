import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import UserNavbar from '../components/UserNavbar';
import EmployerNavbar from '../components/EmployerNavbar';
import { getContractByBookingApi, updateContractTermsApi, signContractApi } from '../api/bookings';
import './ContractView.css';

export default function ContractView({ user, onLogout }) {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editTerms, setEditTerms] = useState(false);
  const [terms, setTerms] = useState('');
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    load();
  }, [bookingId, user]);

  const load = () => {
    setLoading(true);
    getContractByBookingApi(bookingId)
      .then(d => { setContract(d.contract); setTerms(d.contract.dieu_khoan || ''); })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(''), 3000);
  };

  const handleSaveTerms = async () => {
    setSaving(true);
    try {
      await updateContractTermsApi(contract.ma_hd, terms);
      showToast('Đã cập nhật điều khoản');
      setEditTerms(false);
      load();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async () => {
    if (!window.confirm('Bạn xác nhận ký hợp đồng này?')) return;
    setSigning(true);
    try {
      const d = await signContractApi(contract.ma_hd);
      showToast(d.bothSigned ? '🎉 Hợp đồng đã được ký bởi cả hai bên!' : '✅ Đã ký thành công');
      load();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSigning(false);
    }
  };

  const canSign = contract && contract.trang_thai === 'draft' && (
    (user?.role === 'employer' && !contract.chu_tro_ky) ||
    (user?.role === 'user'     && !contract.nguoi_thue_ky)
  );

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
    draft:      { text: 'Chờ ký',       cls: 'draft'    },
    signed:     { text: 'Đã ký',        cls: 'signed'   },
    terminated: { text: 'Đã chấm dứt', cls: 'terminated'},
    expired:    { text: 'Đã hết hạn',   cls: 'expired'  },
  };
  const s = statusMap[contract.trang_thai] || statusMap.draft;

  return (
    <div className="cv-wrap">
      {Navbar}
      {toast && <div className={`cv-toast ${toast.isError ? 'error' : 'success'}`}>{toast.msg}</div>}

      <div className="cv-container">
        <div className="cv-back">
          <button onClick={() => navigate(-1)} className="cv-back-btn">← Quay lại</button>
        </div>

        <div className="cv-doc">
          {/* Header */}
          <div className="cv-doc-header">
            <h1>HỢP ĐỒNG THUÊ NHÀ</h1>
            <p className="cv-doc-sub">Số hợp đồng: HD-{String(contract.ma_hd).padStart(6, '0')}</p>
            <span className={`cv-status ${s.cls}`}>{s.text}</span>
          </div>

          {/* Thông tin phòng */}
          <section className="cv-section">
            <h2>I. THÔNG TIN PHÒNG THUÊ</h2>
            <div className="cv-grid">
              <div><label>Tên phòng</label><p>{contract.tieu_de}</p></div>
              <div><label>Loại phòng</label><p>{contract.loai_phong}</p></div>
              <div><label>Địa chỉ</label><p>{contract.dia_chi}, {contract.tinh_thanh}</p></div>
              <div><label>Giá thuê</label><p className="cv-price">{Number(contract.tien_thue).toLocaleString('vi-VN')}đ/tháng</p></div>
              <div><label>Tiền cọc</label><p>{Number(contract.tien_coc).toLocaleString('vi-VN')}đ</p></div>
              <div><label>Thời hạn</label><p>{new Date(contract.ngay_bat_dau).toLocaleDateString('vi-VN')} → {new Date(contract.ngay_ket_thuc).toLocaleDateString('vi-VN')}</p></div>
            </div>
          </section>

          {/* Bên cho thuê */}
          <section className="cv-section">
            <h2>II. BÊN CHO THUÊ (Bên A)</h2>
            <div className="cv-grid">
              <div><label>Họ tên</label><p>{contract.ten_chu_tro}</p></div>
              <div><label>Điện thoại</label><p>{contract.sdt_chu_tro}</p></div>
              <div><label>Email</label><p>{contract.email_chu_tro}</p></div>
            </div>
          </section>

          {/* Bên thuê */}
          <section className="cv-section">
            <h2>III. BÊN THUÊ (Bên B)</h2>
            <div className="cv-grid">
              <div><label>Họ tên</label><p>{contract.ten_nguoi_thue}</p></div>
              <div><label>Điện thoại</label><p>{contract.sdt_nguoi_thue}</p></div>
              <div><label>Email</label><p>{contract.email_nguoi_thue}</p></div>
            </div>
          </section>

          {/* Điều khoản */}
          <section className="cv-section">
            <div className="cv-terms-header">
              <h2>IV. ĐIỀU KHOẢN HỢP ĐỒNG</h2>
              {user?.role === 'employer' && contract.trang_thai === 'draft' && !editTerms && (
                <button className="cv-edit-btn" onClick={() => setEditTerms(true)}>✏️ Chỉnh sửa</button>
              )}
            </div>
            {editTerms ? (
              <div className="cv-terms-edit">
                <textarea
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  rows={12}
                  className="cv-terms-textarea"
                />
                <div className="cv-terms-btns">
                  <button className="cv-save-btn" onClick={handleSaveTerms} disabled={saving}>
                    {saving ? 'Đang lưu...' : '💾 Lưu điều khoản'}
                  </button>
                  <button className="cv-cancel-btn" onClick={() => { setEditTerms(false); setTerms(contract.dieu_khoan || ''); }}>
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="cv-terms-text">
                {(contract.dieu_khoan || '').split('\n').map((line, i) => (
                  <p key={i}>{line || <br />}</p>
                ))}
              </div>
            )}
          </section>

          {/* Chữ ký */}
          <section className="cv-section cv-sign-section">
            <h2>V. CHỮ KÝ</h2>
            <div className="cv-sign-grid">
              <div className="cv-sign-box">
                <p className="cv-sign-role">Bên A (Chủ trọ)</p>
                <p className="cv-sign-name">{contract.ten_chu_tro}</p>
                {contract.chu_tro_ky
                  ? <div className="cv-signed">✅ Đã ký</div>
                  : <div className="cv-unsigned">⏳ Chưa ký</div>}
              </div>
              <div className="cv-sign-box">
                <p className="cv-sign-role">Bên B (Người thuê)</p>
                <p className="cv-sign-name">{contract.ten_nguoi_thue}</p>
                {contract.nguoi_thue_ky
                  ? <div className="cv-signed">✅ Đã ký</div>
                  : <div className="cv-unsigned">⏳ Chưa ký</div>}
              </div>
            </div>
            {contract.ngay_ky && (
              <p className="cv-sign-date">Ngày ký: {new Date(contract.ngay_ky).toLocaleDateString('vi-VN')}</p>
            )}
          </section>

          {/* Actions */}
          {canSign && (
            <div className="cv-actions">
              <button className="cv-sign-btn" onClick={handleSign} disabled={signing}>
                {signing ? 'Đang ký...' : '✍️ Ký hợp đồng'}
              </button>
              <p className="cv-sign-note">Bằng cách ký, bạn đồng ý với tất cả điều khoản trên.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
