import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postRoomApi } from '../../api/employer';
import { getMyPackageApi } from '../../api/wallet';
import NotificationBell from '../../components/NotificationBell';
import EmployerNavbar from '../../components/EmployerNavbar';
import LocationPicker from '../../components/LocationPicker';
import './PostRoom.css';

const STEPS = ['Thông tin cơ bản', 'Tiện ích & Ảnh', 'Liên hệ & Xác nhận'];

const AMENITIES = [
  { key: 'wifi',     label: 'WiFi',        icon: '📶' },
  { key: 'ac',       label: 'Điều hòa',    icon: '❄️' },
  { key: 'wc',       label: 'WC riêng',    icon: '🚿' },
  { key: 'fridge',   label: 'Tủ lạnh',     icon: '🧊' },
  { key: 'washer',   label: 'Máy giặt',    icon: '🫧' },
  { key: 'kitchen',  label: 'Bếp nấu',     icon: '🍳' },
  { key: 'parking',  label: 'Chỗ để xe',   icon: '🅿️' },
  { key: 'security', label: 'Bảo vệ 24/7', icon: '🔒' },
  { key: 'elevator', label: 'Thang máy',   icon: '🛗' },
  { key: 'balcony',  label: 'Ban công',    icon: '🌿' },
  { key: 'bed',      label: 'Giường',      icon: '🛏️' },
  { key: 'wardrobe', label: 'Tủ quần áo',  icon: '🗄️' },
];

const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Bình Dương', 'Đồng Nai'];
const TYPES  = ['Phòng trọ', 'Chung cư mini', 'Nhà nguyên căn', 'Studio', 'Ký túc xá', 'Căn hộ dịch vụ'];

const initForm = {
  title: '', type: '', city: '', district: '', address: '',
  price: '', deposit: '', area: '', description: '',
  amenities: [], images: [], videoUrl: '',
  name: '', phone: '', email: '', showPhone: true,
  lat: null, lon: null,
};

export default function PostRoom({ user, onLogout }) {
  const navigate = useNavigate();
  const [step, setStep]           = useState(0);
  const [form, setForm]           = useState(() => ({ ...initForm, name: user?.name || '', phone: user?.phone || '', email: user?.username || '' }));
  const [errors, setErrors]       = useState({});
  const [success, setSuccess]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [previewImgs, setPreviewImgs] = useState([]);
  const [myPackage, setMyPackage]     = useState(null);

  useEffect(() => {
    getMyPackageApi().then(d => setMyPackage(d.package)).catch(console.error);
  }, []);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const fillFromAccount = () => setForm(p => ({ ...p, name: user?.name || p.name, phone: user?.phone || p.phone, email: user?.username || p.email }));

  const handleLocationSelect = (loc) => {
    const parts    = loc.display_name.split(', ');
    const address  = parts.slice(0, 3).join(', ');
    const district = parts.find(p => /quận|huyện|thị xã/i.test(p)) || '';
    const CITY_MAP = { 'Hà Nội': 'Hà Nội', 'Thành phố Hồ Chí Minh': 'TP. Hồ Chí Minh', 'Đà Nẵng': 'Đà Nẵng', 'Cần Thơ': 'Cần Thơ', 'Hải Phòng': 'Hải Phòng', 'Bình Dương': 'Bình Dương', 'Đồng Nai': 'Đồng Nai' };
    const cityRaw  = parts.find(p => CITY_MAP[p]) || '';
    const city     = CITY_MAP[cityRaw] || cityRaw;
    setForm(p => ({ ...p, address: address || p.address, district: district || p.district, city: city || p.city, lat: parseFloat(loc.lat), lon: parseFloat(loc.lon) }));
    setErrors(p => ({ ...p, address: '', city: '' }));
  };

  const toggleAmenity = (key) => set('amenities', form.amenities.includes(key) ? form.amenities.filter(a => a !== key) : [...form.amenities, key]);

  const handleImages = (e) => {
    const max = myPackage?.maxImages || 5;
    const combined = [...form.images, ...Array.from(e.target.files)].slice(0, max);
    if (combined.length < form.images.length + e.target.files.length) {
      alert(`Gói hiện tại chỉ cho phép đăng tối đa ${max} ảnh.`);
    }
    set('images', combined);
    setPreviewImgs(combined.map(f => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.title.trim())   e.title   = 'Vui lòng nhập tiêu đề';
      if (!form.type)           e.type    = 'Vui lòng chọn loại phòng';
      if (!form.city)           e.city    = 'Vui lòng chọn tỉnh/thành';
      if (!form.address.trim()) e.address = 'Vui lòng nhập địa chỉ';
      if (!form.price)          e.price   = 'Vui lòng nhập giá thuê';
      if (!form.area)           e.area    = 'Vui lòng nhập diện tích';
    }
    if (step === 2) {
      if (!form.name.trim())  e.name  = 'Vui lòng nhập họ tên';
      if (!form.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const prev = () => setStep(s => s - 1);

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = reject;
    img.src = url;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setSubmitting(true); setSubmitError('');
    try {
      const imageData = await Promise.all(form.images.map(f => toBase64(f)));
      await postRoomApi({
        title: form.title, type: form.type, city: form.city, district: form.district,
        address: form.address, price: form.price, deposit: form.deposit, area: form.area,
        description: form.description, contactName: form.name, contactPhone: form.phone,
        contactEmail: form.email, showPhone: form.showPhone,
        amenities: form.amenities, images: imageData, videoUrl: form.videoUrl,
        lat: form.lat, lon: form.lon,
      });
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message || 'Đăng tin thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return (
    <div className="pr-success-page">
      <div className="pr-success-box">
        <div className="pr-success-icon">🎉</div>
        <h2>Đăng tin thành công!</h2>
        <p>Tin đăng của bạn đang được xét duyệt.<br />Chúng tôi sẽ thông báo trong vòng 24 giờ.</p>
        <div className="pr-success-actions">
          <Link to="/employer" className="pr-success-btn-primary">Về trang chủ</Link>
          <button className="pr-success-btn-outline" onClick={() => { setForm(initForm); setPreviewImgs([]); setStep(0); setSuccess(false); }}>Đăng tin khác</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pr-page">
      <EmployerNavbar user={user} onLogout={onLogout} />

      <div className="pr-body">
        <div className="pr-page-title">
          <h1>📝 Đăng tin cho thuê phòng</h1>
          <p>Điền đầy đủ thông tin để tin đăng được duyệt nhanh hơn</p>
        </div>

        <div className="pr-stepper">
          {STEPS.map((s, i) => (
            <div key={s} className="pr-step-item">
              <div className={`pr-step-circle ${i < step ? 'done' : i === step ? 'active' : ''}`}>{i < step ? '✓' : i + 1}</div>
              <span className={`pr-step-label ${i === step ? 'active' : ''}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`pr-step-line ${i < step ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pr-form-layout">
            <div className="pr-form-main">

              {/* STEP 0 */}
              {step === 0 && (
                <div className="pr-card">
                  <h2 className="pr-card-title">Thông tin phòng trọ</h2>

                  <div className="pr-field">
                    <label>Tiêu đề tin đăng <span className="pr-req">*</span></label>
                    <input type="text" placeholder="VD: Phòng trọ cao cấp gần ĐH Bách Khoa, đầy đủ nội thất"
                      value={form.title} onChange={e => set('title', e.target.value)} className={errors.title ? 'error' : ''} />
                    {errors.title && <span className="pr-error">{errors.title}</span>}
                    <span className="pr-hint">{form.title.length}/100 ký tự</span>
                  </div>

                  <div className="pr-two-col">
                    <div className="pr-field">
                      <label>Loại phòng <span className="pr-req">*</span></label>
                      <select value={form.type} onChange={e => set('type', e.target.value)} className={errors.type ? 'error' : ''}>
                        <option value="">Chọn loại phòng</option>
                        {TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      {errors.type && <span className="pr-error">{errors.type}</span>}
                    </div>
                    <div className="pr-field">
                      <label>Tỉnh / Thành phố <span className="pr-req">*</span></label>
                      <select value={form.city} onChange={e => set('city', e.target.value)} className={errors.city ? 'error' : ''}>
                        <option value="">Chọn tỉnh/thành</option>
                        {CITIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                      {errors.city && <span className="pr-error">{errors.city}</span>}
                    </div>
                  </div>

                  <div className="pr-field">
                    <label>📍 Vị trí trên bản đồ</label>
                    <LocationPicker onSelect={handleLocationSelect} initialAddress={form.address} />
                    <span className="pr-hint">Tìm kiếm hoặc ghim vị trí để tự động điền địa chỉ bên dưới</span>
                  </div>

                  <div className="pr-two-col">
                    <div className="pr-field">
                      <label>Quận / Huyện</label>
                      <input type="text" placeholder="VD: Đống Đa, Cầu Giấy..."
                        value={form.district} onChange={e => set('district', e.target.value)} />
                    </div>
                    <div className="pr-field">
                      <label>Địa chỉ cụ thể <span className="pr-req">*</span></label>
                      <input type="text" placeholder="Số nhà, tên đường, phường/xã"
                        value={form.address} onChange={e => set('address', e.target.value)} className={errors.address ? 'error' : ''} />
                      {errors.address && <span className="pr-error">{errors.address}</span>}
                    </div>
                  </div>

                  <div className="pr-three-col">
                    <div className="pr-field">
                      <label>Giá thuê (đ/tháng) <span className="pr-req">*</span></label>
                      <div className="pr-input-addon">
                        <input type="number" placeholder="3500000"
                          value={form.price} onChange={e => set('price', e.target.value)} className={errors.price ? 'error' : ''} />
                        <span>đ</span>
                      </div>
                      {errors.price && <span className="pr-error">{errors.price}</span>}
                      {form.price && <span className="pr-hint">{parseInt(form.price).toLocaleString('vi-VN')}đ</span>}
                    </div>
                    <div className="pr-field">
                      <label>Tiền cọc (đ)</label>
                      <div className="pr-input-addon">
                        <input type="number" placeholder="7000000"
                          value={form.deposit} onChange={e => set('deposit', e.target.value)} />
                        <span>đ</span>
                      </div>
                    </div>
                    <div className="pr-field">
                      <label>Diện tích (m²) <span className="pr-req">*</span></label>
                      <div className="pr-input-addon">
                        <input type="number" placeholder="25"
                          value={form.area} onChange={e => set('area', e.target.value)} className={errors.area ? 'error' : ''} />
                        <span>m²</span>
                      </div>
                      {errors.area && <span className="pr-error">{errors.area}</span>}
                    </div>
                  </div>

                  <div className="pr-field">
                    <label>Mô tả chi tiết</label>
                    <textarea rows={6} placeholder="Mô tả về phòng trọ: vị trí, nội thất, tiện ích xung quanh, quy định nhà trọ..."
                      value={form.description} onChange={e => set('description', e.target.value)} />
                    <span className="pr-hint">{form.description.length} ký tự</span>
                  </div>
                </div>
              )}

              {/* STEP 1 */}
              {step === 1 && (
                <div className="pr-card">
                  <h2 className="pr-card-title">Tiện ích & Hình ảnh</h2>

                  <div className="pr-field">
                    <label>Tiện ích có sẵn</label>
                    <div className="pr-amenity-grid">
                      {AMENITIES.map(a => (
                        <button key={a.key} type="button"
                          className={`pr-amenity-btn ${form.amenities.includes(a.key) ? 'active' : ''}`}
                          onClick={() => toggleAmenity(a.key)}>
                          <span>{a.icon}</span>
                          <span>{a.label}</span>
                          {form.amenities.includes(a.key) && <span className="pr-amenity-check">✓</span>}
                        </button>
                      ))}
                    </div>
                    {form.amenities.length > 0 && <p className="pr-hint">Đã chọn {form.amenities.length} tiện ích</p>}
                  </div>

                  <div className="pr-field">
                    <label>Hình ảnh phòng</label>
                    <label className="pr-upload-area" htmlFor="img-upload">
                      <span className="pr-upload-icon">📷</span>
                      <p>Kéo thả hoặc <span>click để chọn ảnh</span></p>
                      <small>Tối đa {myPackage?.maxImages || 5} ảnh · JPG, PNG · Mỗi ảnh ≤ 5MB</small>
                      <input id="img-upload" type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImages} />
                    </label>
                    {previewImgs.length > 0 && (
                      <div className="pr-img-preview-grid">
                        {previewImgs.map((src, i) => (
                          <div key={i} className="pr-img-preview-item">
                            <img src={src} alt={`preview-${i}`} />
                            {i === 0 && <span className="pr-img-main-badge">Ảnh bìa</span>}
                            <button type="button" className="pr-img-remove"
                              onClick={() => { setPreviewImgs(p => p.filter((_, j) => j !== i)); set('images', form.images.filter((_, j) => j !== i)); }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {myPackage?.hasVideo && (
                    <div className="pr-field" style={{ marginTop: '20px' }}>
                      <label>Video giới thiệu (Tùy chọn)</label>
                      <input type="text" placeholder="Dán link YouTube (VD: https://www.youtube.com/watch?v=...)"
                        value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="pr-card">
                  <div className="pr-card-title-row">
                    <h2 className="pr-card-title">Thông tin liên hệ</h2>
                    <button type="button" className="pr-fill-account-btn" onClick={fillFromAccount}>👤 Lấy từ tài khoản</button>
                  </div>

                  <div className="pr-two-col">
                    <div className="pr-field">
                      <label>Họ và tên <span className="pr-req">*</span></label>
                      <input type="text" placeholder="Nguyễn Văn A"
                        value={form.name} onChange={e => set('name', e.target.value)} className={errors.name ? 'error' : ''} />
                      {errors.name && <span className="pr-error">{errors.name}</span>}
                    </div>
                    <div className="pr-field">
                      <label>Số điện thoại <span className="pr-req">*</span></label>
                      <input type="tel" placeholder="0912 345 678"
                        value={form.phone} onChange={e => set('phone', e.target.value)} className={errors.phone ? 'error' : ''} />
                      {errors.phone && <span className="pr-error">{errors.phone}</span>}
                    </div>
                  </div>

                  <div className="pr-field">
                    <label>Email</label>
                    <input type="email" placeholder="email@gmail.com"
                      value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>

                  <label className="pr-checkbox-label">
                    <input type="checkbox" checked={form.showPhone} onChange={e => set('showPhone', e.target.checked)} />
                    Hiển thị số điện thoại công khai trên tin đăng
                  </label>

                  <div className="pr-preview-box">
                    <h3>📋 Xem lại thông tin</h3>
                    <div className="pr-preview-grid">
                      <div className="pr-preview-item"><span>Tiêu đề</span><strong>{form.title || '—'}</strong></div>
                      <div className="pr-preview-item"><span>Loại phòng</span><strong>{form.type || '—'}</strong></div>
                      <div className="pr-preview-item"><span>Địa chỉ</span><strong>{form.city ? `${form.address}, ${form.city}` : '—'}</strong></div>
                      <div className="pr-preview-item"><span>Giá thuê</span><strong>{form.price ? `${parseInt(form.price).toLocaleString('vi-VN')}đ/tháng` : '—'}</strong></div>
                      <div className="pr-preview-item"><span>Diện tích</span><strong>{form.area ? `${form.area} m²` : '—'}</strong></div>
                      <div className="pr-preview-item"><span>Tiện ích</span><strong>{form.amenities.length} tiện ích đã chọn</strong></div>
                      <div className="pr-preview-item"><span>Hình ảnh</span><strong>{previewImgs.length} ảnh</strong></div>
                      <div className="pr-preview-item"><span>Tọa độ</span><strong>{form.lat ? `${form.lat.toFixed(4)}, ${form.lon.toFixed(4)}` : 'Chưa ghim'}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pr-nav-btns">
                {step > 0 && <button type="button" className="pr-btn-prev" onClick={prev}>← Quay lại</button>}
                <div style={{ flex: 1 }} />
                {step < STEPS.length - 1
                  ? <button type="button" className="pr-btn-next" onClick={next}>Tiếp theo →</button>
                  : <button type="submit" className="pr-btn-submit" disabled={submitting}>{submitting ? '⏳ Đang đăng...' : '🚀 Đăng tin ngay'}</button>
                }
              </div>
              {submitError && <p className="pr-submit-error">{submitError}</p>}
            </div>

            <aside className="pr-sidebar">
              <div className="pr-tip-card">
                <h3>💡 Mẹo đăng tin hiệu quả</h3>
                <ul>
                  <li><strong>Tiêu đề rõ ràng</strong> — nêu rõ loại phòng, vị trí, điểm nổi bật</li>
                  <li><strong>Ảnh chất lượng cao</strong> — tối thiểu 5 ảnh, chụp đủ các góc</li>
                  <li><strong>Giá cạnh tranh</strong> — tham khảo giá khu vực lân cận</li>
                  <li><strong>Mô tả chi tiết</strong> — tiện ích, quy định, giao thông</li>
                  <li><strong>Cập nhật thường xuyên</strong> — tin mới được ưu tiên hiển thị</li>
                </ul>
              </div>
              <div className="pr-tip-card pr-tip-policy">
                <h3>📋 Quy định đăng tin</h3>
                <ul>
                  <li>Thông tin phải chính xác, trung thực</li>
                  <li>Không đăng tin trùng lặp</li>
                  <li>Ảnh phải là ảnh thực tế của phòng</li>
                  <li>Tin được duyệt trong vòng 24 giờ</li>
                </ul>
              </div>
              <div className="pr-tip-card">
                <h3>📊 Tiến độ điền thông tin</h3>
                {[
                  { label: 'Thông tin cơ bản', done: !!(form.title && form.type && form.city && form.address && form.price && form.area) },
                  { label: 'Vị trí bản đồ',   done: !!(form.lat && form.lon) },
                  { label: 'Tiện ích',         done: form.amenities.length > 0 },
                  { label: 'Hình ảnh',         done: previewImgs.length > 0 },
                  { label: 'Liên hệ',          done: !!(form.name && form.phone) },
                ].map(p => (
                  <div key={p.label} className="pr-progress-item">
                    <span className={`pr-progress-dot ${p.done ? 'done' : ''}`}>{p.done ? '✓' : '○'}</span>
                    <span className={p.done ? 'pr-progress-done' : ''}>{p.label}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}
