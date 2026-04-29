import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getRoomDetailEmployerApi, updateRoomApi } from '../../api/employer';
import NotificationBell from '../../components/NotificationBell';
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

export default function EditRoom({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep]           = useState(0);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(null);
  const [errors, setErrors]       = useState({});
  const [success, setSuccess]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [menuOpen, setMenuOpen]   = useState(false);
  const [keepImages, setKeepImages] = useState([]);
  const [newImages, setNewImages]   = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  useEffect(() => {
    getRoomDetailEmployerApi(id)
      .then(d => {
        const r = d.room;
        setForm({
          title:       r.title       || '',
          type:        r.type        || '',
          city:        r.city        || '',
          district:    r.district    || '',
          address:     r.address     || '',
          price:       r.price       || '',
          deposit:     r.deposit     || '',
          area:        r.area        || '',
          description: r.description || '',
          amenities:   r.amenities?.map(a => a.key) || [],
          name:        r.contactName  || '',
          phone:       r.contactPhone || '',
          email:       r.contactEmail || '',
          showPhone:   r.showPhone ?? true,
          lat:         r.lat  || null,
          lon:         r.lon  || null,
        });
        setKeepImages(r.images || []);
      })
      .catch(() => navigate('/employer/rooms'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const handleLocationSelect = (loc) => {
    const parts    = loc.display_name.split(', ');
    const address  = parts.slice(0, 3).join(', ');
    const district = parts.find(p => /quận|huyện|thị xã/i.test(p)) || '';
    const CITY_MAP = { 'Hà Nội': 'Hà Nội', 'Thành phố Hồ Chí Minh': 'TP. Hồ Chí Minh', 'Đà Nẵng': 'Đà Nẵng', 'Cần Thơ': 'Cần Thơ', 'Hải Phòng': 'Hải Phòng', 'Bình Dương': 'Bình Dương', 'Đồng Nai': 'Đồng Nai' };
    const cityRaw  = parts.find(p => CITY_MAP[p]) || '';
    const city     = CITY_MAP[cityRaw] || cityRaw;
    setForm(p => ({
      ...p,
      address:  address  || p.address,
      district: district || p.district,
      city:     city     || p.city,
      lat: parseFloat(loc.lat),
      lon: parseFloat(loc.lon),
    }));
    setErrors(p => ({ ...p, address: '', city: '' }));
  };

  const toggleAmenity = (key) => set('amenities',
    form.amenities.includes(key) ? form.amenities.filter(a => a !== key) : [...form.amenities, key]
  );

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    const combined = [...newImages, ...files].slice(0, Math.max(0, 10 - keepImages.length));
    setNewImages(combined);
    setNewPreviews(combined.map(f => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const removeKeepImage = (i) => setKeepImages(p => p.filter((_, j) => j !== i));
  const removeNewImage  = (i) => { setNewImages(p => p.filter((_, j) => j !== i)); setNewPreviews(p => p.filter((_, j) => j !== i)); };

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
      const imageData = await Promise.all(newImages.map(f => toBase64(f)));
      await updateRoomApi(id, {
        title: form.title, type: form.type, city: form.city, district: form.district,
        address: form.address, price: form.price, deposit: form.deposit, area: form.area,
        description: form.description, contactName: form.name, contactPhone: form.phone,
        contactEmail: form.email, showPhone: form.showPhone,
        amenities: form.amenities, keepImages, images: imageData,
        lat: form.lat, lon: form.lon,
      });
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message || 'Cập nhật thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="pr-success-page">
      <div className="pr-success-box"><div className="pr-success-icon">⏳</div><p>Đang tải...</p></div>
    </div>
  );

  if (success) return (
    <div className="pr-success-page">
      <div className="pr-success-box">
        <div className="pr-success-icon">✅</div>
        <h2>Cập nhật thành công!</h2>
        <p>Tin đăng đã được gửi lại để xét duyệt.<br />Chúng tôi sẽ thông báo trong vòng 24 giờ.</p>
        <div className="pr-success-actions">
          <button className="pr-success-btn-primary" onClick={() => navigate(`/employer/rooms/${id}`)}>Xem chi tiết</button>
          <Link to="/employer/rooms" className="pr-success-btn-outline">Về danh sách</Link>
        </div>
      </div>
    </div>
  );

  const totalImgCount = keepImages.length + newPreviews.length;

  return (
    <div className="pr-page">
      <nav className="pr-nav">
        <div className="pr-nav-inner">
          <Link to="/employer" className="pr-nav-logo">🏠 PhòngTrọ<span>VN</span></Link>
          <div className="pr-nav-links">
            <Link to="/employer"         className="pr-nav-link">Tổng quan</Link>
            <Link to="/employer/rooms"   className="pr-nav-link active">Tin đăng</Link>
            <Link to="/employer/wallet"  className="pr-nav-link">Ví của tôi</Link>
            <Link to="/employer/pricing" className="pr-nav-link pr-nav-link-gold">Dịch vụ</Link>
          </div>
          <div className="pr-nav-right">
            <NotificationBell user={user} />
            <div className="pr-user-wrap">
              <button className="pr-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
                <div className="pr-avatar">
                  {user?.avatar_url ? <img src={user.avatar_url} alt="avatar" /> : user?.name?.charAt(0) || 'C'}
                </div>
                <div className="pr-user-info">
                  <span className="pr-user-name">{user?.name || 'Chủ trọ'}</span>
                  <span className="pr-user-role">Chủ trọ</span>
                </div>
                <span>▾</span>
              </button>
              {menuOpen && (
                <div className="pr-dropdown">
                  <Link to="/profile" className="pr-drop-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                  <hr className="pr-drop-hr" />
                  <button className="pr-drop-logout" onClick={() => { onLogout?.(); navigate('/login'); }}>🚪 Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="pr-body">
        <div className="pr-page-title">
          <h1>✏️ Sửa tin đăng</h1>
          <p>Cập nhật thông tin phòng trọ — tin sẽ được gửi duyệt lại sau khi lưu</p>
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
                    <input type="text" value={form.title} onChange={e => set('title', e.target.value)} className={errors.title ? 'error' : ''} />
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
                    <LocationPicker
                      onSelect={handleLocationSelect}
                      initialAddress={form.address}
                      key={form.address}
                    />
                    <span className="pr-hint">
                      {form.lat ? `✅ Đã ghim: ${form.lat.toFixed(4)}, ${form.lon.toFixed(4)}` : 'Tìm kiếm hoặc ghim lại vị trí để cập nhật tọa độ'}
                    </span>
                  </div>

                  <div className="pr-two-col">
                    <div className="pr-field">
                      <label>Quận / Huyện</label>
                      <input type="text" value={form.district} onChange={e => set('district', e.target.value)} />
                    </div>
                    <div className="pr-field">
                      <label>Địa chỉ cụ thể <span className="pr-req">*</span></label>
                      <input type="text" value={form.address} onChange={e => set('address', e.target.value)} className={errors.address ? 'error' : ''} />
                      {errors.address && <span className="pr-error">{errors.address}</span>}
                    </div>
                  </div>

                  <div className="pr-three-col">
                    <div className="pr-field">
                      <label>Giá thuê (đ/tháng) <span className="pr-req">*</span></label>
                      <div className="pr-input-addon">
                        <input type="number" value={form.price} onChange={e => set('price', e.target.value)} className={errors.price ? 'error' : ''} />
                        <span>đ</span>
                      </div>
                      {errors.price && <span className="pr-error">{errors.price}</span>}
                      {form.price && <span className="pr-hint">{parseInt(form.price).toLocaleString('vi-VN')}đ</span>}
                    </div>
                    <div className="pr-field">
                      <label>Tiền cọc (đ)</label>
                      <div className="pr-input-addon">
                        <input type="number" value={form.deposit} onChange={e => set('deposit', e.target.value)} />
                        <span>đ</span>
                      </div>
                    </div>
                    <div className="pr-field">
                      <label>Diện tích (m²) <span className="pr-req">*</span></label>
                      <div className="pr-input-addon">
                        <input type="number" value={form.area} onChange={e => set('area', e.target.value)} className={errors.area ? 'error' : ''} />
                        <span>m²</span>
                      </div>
                      {errors.area && <span className="pr-error">{errors.area}</span>}
                    </div>
                  </div>

                  <div className="pr-field">
                    <label>Mô tả chi tiết</label>
                    <textarea rows={6} value={form.description} onChange={e => set('description', e.target.value)} />
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
                          <span>{a.icon}</span><span>{a.label}</span>
                          {form.amenities.includes(a.key) && <span className="pr-amenity-check">✓</span>}
                        </button>
                      ))}
                    </div>
                    {form.amenities.length > 0 && <p className="pr-hint">Đã chọn {form.amenities.length} tiện ích</p>}
                  </div>

                  <div className="pr-field">
                    <label>Hình ảnh phòng ({totalImgCount}/10)</label>
                    {keepImages.length > 0 && (
                      <div className="pr-img-preview-grid" style={{ marginBottom: 12 }}>
                        {keepImages.map((src, i) => (
                          <div key={i} className="pr-img-preview-item">
                            <img src={src} alt={`old-${i}`} />
                            {i === 0 && newPreviews.length === 0 && <span className="pr-img-main-badge">Ảnh bìa</span>}
                            <button type="button" className="pr-img-remove" onClick={() => removeKeepImage(i)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {newPreviews.length > 0 && (
                      <div className="pr-img-preview-grid" style={{ marginBottom: 12 }}>
                        {newPreviews.map((src, i) => (
                          <div key={i} className="pr-img-preview-item">
                            <img src={src} alt={`new-${i}`} />
                            <span className="pr-img-main-badge" style={{ background: '#2563eb' }}>Mới</span>
                            <button type="button" className="pr-img-remove" onClick={() => removeNewImage(i)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {totalImgCount < 10 && (
                      <label className="pr-upload-area" htmlFor="img-upload-edit">
                        <span className="pr-upload-icon">📷</span>
                        <p>Kéo thả hoặc <span>click để thêm ảnh mới</span></p>
                        <small>Tối đa {10 - totalImgCount} ảnh nữa · JPG, PNG</small>
                        <input id="img-upload-edit" type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleNewImages} />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="pr-card">
                  <h2 className="pr-card-title">Thông tin liên hệ</h2>
                  <div className="pr-two-col">
                    <div className="pr-field">
                      <label>Họ và tên <span className="pr-req">*</span></label>
                      <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={errors.name ? 'error' : ''} />
                      {errors.name && <span className="pr-error">{errors.name}</span>}
                    </div>
                    <div className="pr-field">
                      <label>Số điện thoại <span className="pr-req">*</span></label>
                      <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={errors.phone ? 'error' : ''} />
                      {errors.phone && <span className="pr-error">{errors.phone}</span>}
                    </div>
                  </div>
                  <div className="pr-field">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
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
                      <div className="pr-preview-item"><span>Tiện ích</span><strong>{form.amenities.length} tiện ích</strong></div>
                      <div className="pr-preview-item"><span>Hình ảnh</span><strong>{totalImgCount} ảnh</strong></div>
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
                  : <button type="submit" className="pr-btn-submit" disabled={submitting}>{submitting ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}</button>
                }
              </div>
              {submitError && <p className="pr-submit-error">{submitError}</p>}
            </div>

            <aside className="pr-sidebar">
              <div className="pr-tip-card">
                <h3>ℹ️ Lưu ý khi sửa tin</h3>
                <ul>
                  <li>Tin sẽ chuyển về trạng thái <strong>chờ duyệt</strong> sau khi lưu</li>
                  <li>Admin sẽ xét duyệt lại trong vòng 24 giờ</li>
                  <li>Ảnh cũ có thể giữ lại hoặc xóa bỏ</li>
                  <li>Thêm ảnh mới bằng cách click vào vùng upload</li>
                </ul>
              </div>
              <div className="pr-tip-card">
                <h3>📊 Tiến độ điền thông tin</h3>
                {[
                  { label: 'Thông tin cơ bản', done: !!(form.title && form.type && form.city && form.address && form.price && form.area) },
                  { label: 'Vị trí bản đồ',   done: !!(form.lat && form.lon) },
                  { label: 'Tiện ích',         done: form.amenities.length > 0 },
                  { label: 'Hình ảnh',         done: totalImgCount > 0 },
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
