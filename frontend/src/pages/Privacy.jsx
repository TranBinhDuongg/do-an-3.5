import { Link } from 'react-router-dom';
import './Legal.css';

const sections = [
  {
    title: 'Giới thiệu',
    content: (
      <>
        <p>
          PhòngTrọVN cam kết bảo vệ quyền riêng tư của bạn. Chính sách này mô tả cách chúng tôi
          thu thập, sử dụng và bảo vệ thông tin cá nhân khi bạn sử dụng dịch vụ.
        </p>
        <div className="legal-highlight">
          Chúng tôi không bán thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào.
        </div>
      </>
    ),
  },
  {
    title: 'Thông tin chúng tôi thu thập',
    content: (
      <>
        <p>Chúng tôi thu thập các loại thông tin sau:</p>
        <ul>
          <li><strong style={{ color: '#d1d5db' }}>Thông tin tài khoản:</strong> Họ tên, tên đăng nhập, số điện thoại khi bạn đăng ký.</li>
          <li><strong style={{ color: '#d1d5db' }}>Thông tin sử dụng:</strong> Lịch sử tìm kiếm, phòng đã xem, tin đã lưu.</li>
          <li><strong style={{ color: '#d1d5db' }}>Thông tin thiết bị:</strong> Địa chỉ IP, loại trình duyệt, hệ điều hành.</li>
          <li><strong style={{ color: '#d1d5db' }}>Thông tin liên lạc:</strong> Nội dung tin nhắn giữa người dùng trên nền tảng.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Mục đích sử dụng thông tin',
    content: (
      <>
        <p>Thông tin thu thập được sử dụng để:</p>
        <ul>
          <li>Cung cấp và cải thiện dịch vụ tìm kiếm phòng trọ.</li>
          <li>Xác thực danh tính và bảo mật tài khoản.</li>
          <li>Gửi thông báo liên quan đến tài khoản và dịch vụ.</li>
          <li>Phân tích hành vi sử dụng để cải thiện trải nghiệm.</li>
          <li>Phát hiện và ngăn chặn gian lận, vi phạm điều khoản.</li>
          <li>Tuân thủ các yêu cầu pháp lý khi cần thiết.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Chia sẻ thông tin',
    content: (
      <>
        <p>Chúng tôi có thể chia sẻ thông tin của bạn trong các trường hợp sau:</p>
        <ul>
          <li><strong style={{ color: '#d1d5db' }}>Giữa người dùng:</strong> Thông tin liên lạc cơ bản (tên, SĐT) được chia sẻ khi bạn chủ động liên hệ chủ trọ.</li>
          <li><strong style={{ color: '#d1d5db' }}>Đối tác dịch vụ:</strong> Các nhà cung cấp dịch vụ kỹ thuật hỗ trợ vận hành nền tảng.</li>
          <li><strong style={{ color: '#d1d5db' }}>Yêu cầu pháp lý:</strong> Khi có yêu cầu từ cơ quan nhà nước có thẩm quyền.</li>
        </ul>
        <div className="legal-highlight">
          Chúng tôi không chia sẻ thông tin cá nhân cho mục đích quảng cáo của bên thứ ba.
        </div>
      </>
    ),
  },
  {
    title: 'Bảo mật thông tin',
    content: (
      <>
        <p>Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức để bảo vệ thông tin của bạn:</p>
        <ul>
          <li>Mã hóa dữ liệu truyền tải bằng giao thức HTTPS/TLS.</li>
          <li>Kiểm soát truy cập nghiêm ngặt vào cơ sở dữ liệu.</li>
          <li>Giám sát hệ thống 24/7 để phát hiện xâm nhập bất thường.</li>
          <li>Sao lưu dữ liệu định kỳ để đảm bảo tính toàn vẹn.</li>
        </ul>
        <p>
          Tuy nhiên, không có hệ thống nào an toàn tuyệt đối. Bạn cũng có trách nhiệm bảo mật
          thông tin đăng nhập của mình.
        </p>
      </>
    ),
  },
  {
    title: 'Cookie và công nghệ theo dõi',
    content: (
      <>
        <p>
          Chúng tôi sử dụng cookie và các công nghệ tương tự để cải thiện trải nghiệm người dùng:
        </p>
        <ul>
          <li><strong style={{ color: '#d1d5db' }}>Cookie thiết yếu:</strong> Cần thiết để duy trì phiên đăng nhập và bảo mật.</li>
          <li><strong style={{ color: '#d1d5db' }}>Cookie phân tích:</strong> Giúp chúng tôi hiểu cách người dùng tương tác với dịch vụ.</li>
          <li><strong style={{ color: '#d1d5db' }}>Cookie tùy chỉnh:</strong> Lưu trữ tùy chọn của bạn như ngôn ngữ, bộ lọc tìm kiếm.</li>
        </ul>
        <p>Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên một số tính năng có thể bị ảnh hưởng.</p>
      </>
    ),
  },
  {
    title: 'Quyền của bạn',
    content: (
      <>
        <p>Bạn có các quyền sau đối với dữ liệu cá nhân của mình:</p>
        <ul>
          <li><strong style={{ color: '#d1d5db' }}>Quyền truy cập:</strong> Yêu cầu xem thông tin cá nhân chúng tôi đang lưu trữ.</li>
          <li><strong style={{ color: '#d1d5db' }}>Quyền chỉnh sửa:</strong> Cập nhật thông tin không chính xác qua trang hồ sơ.</li>
          <li><strong style={{ color: '#d1d5db' }}>Quyền xóa:</strong> Yêu cầu xóa tài khoản và dữ liệu liên quan.</li>
          <li><strong style={{ color: '#d1d5db' }}>Quyền phản đối:</strong> Từ chối một số hình thức xử lý dữ liệu nhất định.</li>
          <li><strong style={{ color: '#d1d5db' }}>Quyền di chuyển:</strong> Nhận bản sao dữ liệu của bạn ở định dạng có thể đọc được.</li>
        </ul>
        <p>Để thực hiện các quyền này, vui lòng liên hệ với chúng tôi qua email bên dưới.</p>
      </>
    ),
  },
  {
    title: 'Thời gian lưu trữ dữ liệu',
    content: (
      <p>
        Chúng tôi lưu trữ thông tin cá nhân trong suốt thời gian tài khoản còn hoạt động.
        Sau khi tài khoản bị xóa, dữ liệu sẽ được xóa hoàn toàn trong vòng 30 ngày,
        trừ các dữ liệu cần giữ lại theo yêu cầu pháp lý (tối đa 5 năm).
      </p>
    ),
  },
  {
    title: 'Thay đổi chính sách',
    content: (
      <p>
        Chính sách bảo mật có thể được cập nhật định kỳ. Chúng tôi sẽ thông báo cho bạn
        về các thay đổi quan trọng qua email hoặc thông báo trên nền tảng ít nhất 15 ngày
        trước khi có hiệu lực.
      </p>
    ),
  },
  {
    title: 'Liên hệ',
    content: (
      <>
        <p>Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ:</p>
        <ul>
          <li>Email: privacy@phongtrovn.vn</li>
          <li>Hotline: 1800 xxxx (miễn phí, 8:00 - 22:00)</li>
          <li>Địa chỉ: Hà Nội, Việt Nam</li>
        </ul>
      </>
    ),
  },
];

export default function Privacy() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-header-inner">
          <Link to="/" className="legal-logo">
            <span className="legal-logo-icon">🏠</span>
            PhòngTrọVN
          </Link>
          <Link to="/register" className="legal-back-btn">← Quay lại đăng ký</Link>
        </div>
      </header>

      <main className="legal-content">
        <div className="legal-badge">🔒 Bảo mật</div>
        <h1 className="legal-title">Chính sách bảo mật</h1>
        <p className="legal-meta">Cập nhật lần cuối: 22/04/2026 · Có hiệu lực từ: 01/01/2025</p>

        <div className="legal-toc">
          <div className="legal-toc-title">Mục lục</div>
          <ol>
            {sections.map((s, i) => (
              <li key={i}><a href={`#section-${i}`}>{s.title}</a></li>
            ))}
          </ol>
        </div>

        {sections.map((s, i) => (
          <section key={i} id={`section-${i}`} className="legal-section">
            <h2 className="legal-section-title">
              <span className="legal-section-num">{i + 1}</span>
              {s.title}
            </h2>
            {s.content}
          </section>
        ))}
      </main>

      <footer className="legal-footer">
        © 2025 PhòngTrọVN · <Link to="/privacy">Chính sách bảo mật</Link> · <Link to="/terms">Điều khoản sử dụng</Link>
      </footer>
    </div>
  );
}
