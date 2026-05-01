import { Link } from 'react-router-dom';
import './Legal.css';

const sections = [
  {
    title: 'Giới thiệu',
    content: (
      <>
        <p>
          Chào mừng bạn đến với ThueNhaVN. Bằng việc truy cập hoặc sử dụng dịch vụ của chúng tôi,
          bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu trong tài liệu này.
        </p>
        <p>
          Vui lòng đọc kỹ trước khi sử dụng. Nếu bạn không đồng ý với bất kỳ điều khoản nào,
          hãy ngừng sử dụng dịch vụ ngay lập tức.
        </p>
      </>
    ),
  },
  {
    title: 'Định nghĩa',
    content: (
      <ul>
        <li>"Dịch vụ" là nền tảng ThueNhaVN bao gồm website và ứng dụng di động.</li>
        <li>"Người dùng" là bất kỳ cá nhân nào truy cập hoặc sử dụng dịch vụ.</li>
        <li>"Chủ trọ" là người dùng đăng tin cho thuê phòng trọ trên nền tảng.</li>
        <li>"Người thuê" là người dùng tìm kiếm và liên hệ thuê phòng trọ.</li>
        <li>"Nội dung" bao gồm văn bản, hình ảnh, thông tin phòng trọ do người dùng đăng tải.</li>
      </ul>
    ),
  },
  {
    title: 'Điều kiện sử dụng tài khoản',
    content: (
      <>
        <p>Để sử dụng đầy đủ tính năng, bạn cần tạo tài khoản với thông tin chính xác và trung thực.</p>
        <ul>
          <li>Bạn phải từ 18 tuổi trở lên để đăng ký tài khoản.</li>
          <li>Mỗi cá nhân chỉ được sở hữu một tài khoản duy nhất.</li>
          <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.</li>
          <li>Không được chia sẻ tài khoản cho người khác sử dụng.</li>
          <li>Thông báo ngay cho chúng tôi nếu phát hiện tài khoản bị xâm phạm.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Quy tắc đăng tin',
    content: (
      <>
        <p>Chủ trọ khi đăng tin phải đảm bảo:</p>
        <ul>
          <li>Thông tin phòng trọ phải chính xác, trung thực và đầy đủ.</li>
          <li>Hình ảnh phải là ảnh thực tế của phòng trọ, không chỉnh sửa gây hiểu nhầm.</li>
          <li>Giá thuê phải rõ ràng, bao gồm các khoản phí phát sinh nếu có.</li>
          <li>Không đăng tin trùng lặp hoặc spam.</li>
          <li>Không đăng nội dung vi phạm pháp luật, thuần phong mỹ tục.</li>
        </ul>
        <div className="legal-highlight">
          ThueNhaVN có quyền xóa bất kỳ tin đăng nào vi phạm quy tắc mà không cần thông báo trước.
        </div>
      </>
    ),
  },
  {
    title: 'Trách nhiệm của người dùng',
    content: (
      <>
        <p>Người dùng đồng ý không thực hiện các hành vi sau:</p>
        <ul>
          <li>Đăng tải nội dung sai sự thật, gây hiểu nhầm hoặc lừa đảo.</li>
          <li>Quấy rối, đe dọa hoặc xúc phạm người dùng khác.</li>
          <li>Sử dụng dịch vụ cho mục đích thương mại trái phép.</li>
          <li>Cố gắng truy cập trái phép vào hệ thống hoặc dữ liệu của chúng tôi.</li>
          <li>Phát tán virus, mã độc hoặc bất kỳ phần mềm gây hại nào.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Phí dịch vụ',
    content: (
      <>
        <p>
          Việc tìm kiếm và xem tin đăng trên ThueNhaVN hoàn toàn miễn phí đối với người thuê.
        </p>
        <p>
          Đối với chủ trọ, một số tính năng nâng cao có thể yêu cầu thanh toán theo gói dịch vụ.
          Chi tiết về các gói dịch vụ được công bố tại trang Bảng giá.
        </p>
        <ul>
          <li>Phí dịch vụ có thể thay đổi và sẽ được thông báo trước 30 ngày.</li>
          <li>Không hoàn tiền cho các gói dịch vụ đã kích hoạt trừ trường hợp lỗi từ phía chúng tôi.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Giới hạn trách nhiệm',
    content: (
      <>
        <p>
          ThueNhaVN là nền tảng kết nối, không phải bên trung gian trong giao dịch thuê phòng.
          Chúng tôi không chịu trách nhiệm về:
        </p>
        <ul>
          <li>Tính chính xác của thông tin do chủ trọ cung cấp.</li>
          <li>Tranh chấp phát sinh giữa chủ trọ và người thuê.</li>
          <li>Thiệt hại trực tiếp hoặc gián tiếp từ việc sử dụng dịch vụ.</li>
          <li>Gián đoạn dịch vụ do sự cố kỹ thuật ngoài tầm kiểm soát.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Chấm dứt tài khoản',
    content: (
      <>
        <p>
          Chúng tôi có quyền tạm khóa hoặc xóa tài khoản của bạn nếu phát hiện vi phạm điều khoản
          sử dụng, không cần thông báo trước trong trường hợp vi phạm nghiêm trọng.
        </p>
        <p>
          Bạn có thể yêu cầu xóa tài khoản bất kỳ lúc nào bằng cách liên hệ với chúng tôi.
          Dữ liệu sẽ được xóa trong vòng 30 ngày kể từ ngày yêu cầu.
        </p>
      </>
    ),
  },
  {
    title: 'Thay đổi điều khoản',
    content: (
      <p>
        Chúng tôi có thể cập nhật điều khoản này theo thời gian. Khi có thay đổi quan trọng,
        chúng tôi sẽ thông báo qua email hoặc thông báo trên nền tảng. Việc tiếp tục sử dụng
        dịch vụ sau khi thay đổi có hiệu lực đồng nghĩa với việc bạn chấp nhận điều khoản mới.
      </p>
    ),
  },
  {
    title: 'Liên hệ',
    content: (
      <>
        <p>Nếu có thắc mắc về điều khoản sử dụng, vui lòng liên hệ:</p>
        <ul>
          <li>Email: support@phongtrovn.vn</li>
          <li>Hotline: 1800 xxxx (miễn phí, 8:00 - 22:00)</li>
          <li>Địa chỉ: Hà Nội, Việt Nam</li>
        </ul>
      </>
    ),
  },
];

export default function Terms() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-header-inner">
          <Link to="/" className="legal-logo">
            <span className="legal-logo-icon">🏠</span>
            ThueNhaVN
          </Link>
          <Link to="/register" className="legal-back-btn">← Quay lại đăng ký</Link>
        </div>
      </header>

      <main className="legal-content">
        <div className="legal-badge">📋 Pháp lý</div>
        <h1 className="legal-title">Điều khoản sử dụng</h1>
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
        © 2025 ThueNhaVN · <Link to="/privacy">Chính sách bảo mật</Link> · <Link to="/terms">Điều khoản sử dụng</Link>
      </footer>
    </div>
  );
}
