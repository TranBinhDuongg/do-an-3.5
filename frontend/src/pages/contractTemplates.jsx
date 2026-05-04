// Mẫu hợp đồng theo từng loại nhà — plain text, không ô/border
// Nguồn tham khảo: luatvietnam.vn/bieu-mau/mau-hop-dong-thue-nha

const fmt  = (n) => Number(n).toLocaleString('vi-VN');
const fmtD = (d) => new Date(d).toLocaleDateString('vi-VN');
const calcMonths = (s, e) => Math.round((new Date(e) - new Date(s)) / (1000*60*60*24*30));

// ─── Phần đầu chung ───────────────────────────────────────────────────────────
function Header({ title, soHD }) {
  return (
    <div className="ct-header">
      <p className="ct-quoc-hieu">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      <p className="ct-doc-lap">Độc lập - Tự do - Hạnh phúc</p>
      <p className="ct-gach">───────────────────────────</p>
      <p className="ct-title">{title}</p>
      <p className="ct-so">Số: {soHD}</p>
    </div>
  );
}

// ─── Căn cứ ──────────────────────────────────────────────────────────────────
function CanCu({ extra }) {
  return (
    <div className="ct-can-cu">
      <p>- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;</p>
      <p>- Căn cứ Luật Nhà ở số 65/2014/QH13 ngày 25/11/2014;</p>
      {extra && <p>{extra}</p>}
      <p>- Căn cứ vào nhu cầu và sự thỏa thuận của các bên tham gia Hợp đồng;</p>
    </div>
  );
}

// ─── Các bên ─────────────────────────────────────────────────────────────────
function Parties({ c }) {
  return (
    <div className="ct-parties">
      <p>Hôm nay, ngày {fmtD(c.ngay_bat_dau)}, tại địa chỉ {c.dia_chi}, {c.tinh_thanh}, các Bên gồm:</p>

      <p className="ct-party-title">BÊN CHO THUÊ (Bên A):</p>
      <p>Ông/Bà: {c.ten_chu_tro}</p>
      <p>Điện thoại: {c.sdt_chu_tro} &nbsp;&nbsp; Email: {c.email_chu_tro}</p>

      <p className="ct-party-title">BÊN THUÊ (Bên B):</p>
      <p>Ông/Bà: {c.ten_nguoi_thue}</p>
      <p>Điện thoại: {c.sdt_nguoi_thue} &nbsp;&nbsp; Email: {c.email_nguoi_thue}</p>

      <p className="ct-agree">Sau khi thảo luận, Hai Bên thống nhất ký kết Hợp đồng với các điều khoản và điều kiện dưới đây:</p>
    </div>
  );
}

// ─── Điều khoản chung (dùng cho tất cả loại) ─────────────────────────────────
function CommonClauses({ c, startNum }) {
  const n = startNum; // số thứ tự điều bắt đầu
  const months = calcMonths(c.ngay_bat_dau, c.ngay_ket_thuc);
  return (
    <>
      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều {n}. Thời hạn thuê</p>
        <p>{n}.1. Thời hạn thuê là <strong>{months} tháng</strong>, kể từ ngày <strong>{fmtD(c.ngay_bat_dau)}</strong> đến ngày <strong>{fmtD(c.ngay_ket_thuc)}</strong>.</p>
        <p>{n}.2. Hết thời hạn thuê, nếu Bên B có nhu cầu tiếp tục sử dụng thì Bên A phải ưu tiên cho Bên B tiếp tục thuê.</p>
      </div>

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều {n+1}. Đặt cọc</p>
        <p>{n+1}.1. Bên B giao cho Bên A khoản tiền đặt cọc là <strong>{fmt(c.tien_coc)} VNĐ</strong> ngay sau khi ký hợp đồng để đảm bảo thực hiện Hợp đồng.</p>
        <p>{n+1}.2. Nếu Bên B đơn phương chấm dứt hợp đồng mà không báo trước, Bên A không hoàn trả tiền đặt cọc. Nếu Bên A đơn phương chấm dứt mà không báo trước, Bên A phải hoàn trả tiền đặt cọc và bồi thường thêm một khoản bằng tiền đặt cọc.</p>
        <p>{n+1}.3. Tiền đặt cọc không được dùng để thanh toán tiền thuê. Khi kết thúc hợp đồng, Bên A hoàn lại tiền đặt cọc sau khi khấu trừ chi phí thiệt hại (nếu có).</p>
      </div>

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều {n+2}. Tiền thuê và phương thức thanh toán</p>
        <p>{n+2}.1. Tiền thuê: <strong>{fmt(c.tien_thue)} VNĐ/tháng</strong>.</p>
        <p>{n+2}.2. Tiền thuê không bao gồm chi phí điện, nước, vệ sinh và các dịch vụ khác. Các khoản này do Bên B thanh toán theo thực tế sử dụng hàng tháng theo đơn giá nhà nước.</p>
        <p>{n+2}.3. Tiền thuê được thanh toán vào ngày 05 hàng tháng bằng tiền mặt hoặc chuyển khoản.</p>
      </div>

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều {n+3}. Quyền và nghĩa vụ của Bên A (Bên cho thuê)</p>
        <p>{n+3}.1. Quyền lợi:</p>
        <p className="ct-indent">- Yêu cầu Bên B thanh toán tiền thuê và các chi phí khác đầy đủ, đúng hạn.</p>
        <p className="ct-indent">- Yêu cầu Bên B sửa chữa phần hư hỏng do lỗi của Bên B gây ra.</p>
        <p className="ct-indent">- Đơn phương chấm dứt hợp đồng và yêu cầu bồi thường nếu Bên B vi phạm nghiêm trọng.</p>
        <p>{n+3}.2. Nghĩa vụ:</p>
        <p className="ct-indent">- Bàn giao tài sản thuê cho Bên B đúng thời gian quy định trong Hợp đồng.</p>
        <p className="ct-indent">- Đảm bảo cho Bên B sử dụng tài sản thuê ổn định, độc lập và liên tục trong suốt thời hạn thuê.</p>
        <p className="ct-indent">- Bảo dưỡng, sửa chữa những hư hỏng không do lỗi của Bên B; nếu không thực hiện mà gây thiệt hại thì phải bồi thường.</p>
        <p className="ct-indent">- Không xâm phạm trái phép tài sản của Bên B trong phần diện tích thuê.</p>
      </div>

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều {n+4}. Quyền và nghĩa vụ của Bên B (Bên thuê)</p>
        <p>{n+4}.1. Quyền lợi:</p>
        <p className="ct-indent">- Nhận bàn giao tài sản thuê theo đúng thỏa thuận.</p>
        <p className="ct-indent">- Được sử dụng tài sản thuê đúng mục đích đã thỏa thuận.</p>
        <p className="ct-indent">- Yêu cầu Bên A sửa chữa kịp thời những hư hỏng không phải do lỗi của Bên B.</p>
        <p className="ct-indent">- Được ưu tiên ký hợp đồng thuê tiếp khi hết hạn nếu Bên A tiếp tục cho thuê.</p>
        <p>{n+4}.2. Nghĩa vụ:</p>
        <p className="ct-indent">- Sử dụng tài sản thuê đúng mục đích, giữ gìn và sửa chữa hư hỏng do mình gây ra.</p>
        <p className="ct-indent">- Thanh toán tiền đặt cọc, tiền thuê đầy đủ, đúng thời hạn.</p>
        <p className="ct-indent">- Trả lại tài sản thuê cho Bên A khi hết thời hạn hoặc chấm dứt Hợp đồng.</p>
        <p className="ct-indent">- Mọi việc sửa chữa, cải tạo ảnh hưởng đến kết cấu phải có văn bản đồng ý của Bên A.</p>
        <p className="ct-indent">- Không chuyển nhượng hợp đồng hoặc cho thuê lại khi chưa có sự đồng ý bằng văn bản của Bên A.</p>
        <p className="ct-indent">- Chấp hành các quy định về vệ sinh môi trường và an ninh trật tự.</p>
      </div>

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều {n+5}. Đơn phương chấm dứt hợp đồng</p>
        <p>Trường hợp một trong hai bên muốn đơn phương chấm dứt Hợp đồng trước hạn phải thông báo bằng văn bản cho bên kia trước <strong>30 (ba mươi) ngày</strong>. Nếu không thực hiện nghĩa vụ thông báo thì phải bồi thường một khoản tiền thuê tương đương thời gian không thông báo và các thiệt hại khác phát sinh.</p>
      </div>

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều {n+6}. Giải quyết tranh chấp</p>
        <p>Trong quá trình thực hiện hợp đồng nếu phát sinh tranh chấp, các bên cùng thương lượng giải quyết. Trường hợp không tự giải quyết được thì đưa ra Tòa án có thẩm quyền theo quy định của pháp luật.</p>
      </div>

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều {n+7}. Điều khoản thi hành</p>
        <p>- Hợp đồng có hiệu lực kể từ ngày hai bên cùng ký kết.</p>
        <p>- Mọi sửa đổi, bổ sung phải được lập thành văn bản và có đầy đủ chữ ký của mỗi bên.</p>
        <p>- Hợp đồng được lập thành 02 (hai) bản có giá trị như nhau, mỗi bên giữ 01 (một) bản để thực hiện.</p>
      </div>
    </>
  );
}

// ─── MẪU 1: Nhà cho thuê / Ký túc xá ───────────────────────────────────────────
function TroTemplate({ c }) {
  const soHD = `HD-${String(c.ma_hd).padStart(6,'0')}`;
  return (
    <>
      <Header title="HỢP ĐỒNG THUÊ NHÀ TRỌ" soHD={soHD} />
      <CanCu />
      <Parties c={c} />

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều 1. Đối tượng của hợp đồng</p>
        <p>1.1. Bên A đồng ý cho Bên B thuê nhà cho thuê tại địa chỉ: <strong>{c.dia_chi}, {c.tinh_thanh}</strong> thuộc sở hữu hợp pháp của Bên A.</p>
        <p>1.2. Chi tiết nhà: Loại nhà <strong>{c.loai_phong}</strong> — <strong>{c.tieu_de}</strong>. Bao gồm hệ thống điện nước sẵn sàng sử dụng.</p>
        <p>1.3. Bên A cam kết tài sản cho thuê là tài sản sở hữu hợp pháp. Mọi tranh chấp phát sinh từ tài sản cho thuê, Bên A hoàn toàn chịu trách nhiệm trước pháp luật.</p>
      </div>

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều 2. Bàn giao và sử dụng</p>
        <p>2.1. Thời điểm Bên A bàn giao nhà cho thuê cho Bên B: ngày <strong>{fmtD(c.ngay_bat_dau)}</strong>.</p>
        <p>2.2. Bên B được toàn quyền sử dụng nhà cho thuê kể từ thời điểm được Bên A bàn giao.</p>
        <p>2.3. Bên A có trách nhiệm hướng dẫn Bên B thực hiện đúng các quy định về đăng ký tạm trú.</p>
      </div>

      <CommonClauses c={c} startNum={3} />
    </>
  );
}

// ─── MẪU 2: Chung cư mini / Căn hộ dịch vụ / Studio ─────────────────────────
function ChungCuTemplate({ c }) {
  const soHD = `HD-${String(c.ma_hd).padStart(6,'0')}`;
  return (
    <>
      <Header title="HỢP ĐỒNG THUÊ CĂN HỘ" soHD={soHD} />
      <CanCu />
      <Parties c={c} />

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều 1. Căn hộ cho thuê</p>
        <p>1.1. Bên A đồng ý cho Bên B thuê căn hộ thuộc quyền sở hữu hợp pháp của Bên A tại địa chỉ: <strong>{c.dia_chi}, {c.tinh_thanh}</strong>.</p>
        <p>1.2. Loại căn hộ: <strong>{c.loai_phong}</strong> — <strong>{c.tieu_de}</strong>.</p>
        <p>1.3. Bên A cam kết căn hộ không có tranh chấp, không bị kê biên để bảo đảm thi hành án tại thời điểm giao kết hợp đồng.</p>
      </div>

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều 2. Mục đích thuê và bàn giao</p>
        <p>2.1. Mục đích thuê: sử dụng làm nơi ở.</p>
        <p>2.2. Thời điểm giao nhận căn hộ: ngày <strong>{fmtD(c.ngay_bat_dau)}</strong>.</p>
        <p>2.3. Bên A bàn giao căn hộ kèm trang thiết bị (nếu có) theo biên bản bàn giao đính kèm.</p>
        <p>2.4. Bên A không được tăng giá thuê trong suốt thời gian hợp đồng còn hiệu lực.</p>
      </div>

      <CommonClauses c={c} startNum={3} />

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều 11. Cam kết của các bên</p>
        <p>Bên A và Bên B chịu trách nhiệm trước pháp luật về những lời cam kết sau:</p>
        <p>1. Đã khai đúng sự thật và tự chịu trách nhiệm về tính chính xác của thông tin đã ghi trong hợp đồng.</p>
        <p>2. Thực hiện đúng và đầy đủ tất cả thỏa thuận đã ghi trong hợp đồng; nếu bên nào vi phạm gây thiệt hại thì phải bồi thường.</p>
        <p>3. Hợp đồng này có giá trị kể từ ngày hai bên ký kết.</p>
      </div>
    </>
  );
}

// ─── MẪU 3: Nhà nguyên căn ───────────────────────────────────────────────────
function NhaTemplate({ c }) {
  const soHD = `HD-${String(c.ma_hd).padStart(6,'0')}`;
  return (
    <>
      <Header title="HỢP ĐỒNG THUÊ NHÀ Ở" soHD={soHD} />
      <CanCu />
      <Parties c={c} />

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều 1. Nhà ở và tài sản cho thuê</p>
        <p>1.1. Bên A đồng ý cho Bên B thuê và Bên B đồng ý thuê nhà ở tại địa chỉ: <strong>{c.dia_chi}, {c.tinh_thanh}</strong> để sử dụng làm nơi ở.</p>
        <p>1.2. Tên tài sản: <strong>{c.tieu_de}</strong> — Loại: <strong>{c.loai_phong}</strong>.</p>
        <p>1.3. Bên A cam kết quyền sử dụng đất và nhà ở gắn liền trên đất là tài sản sở hữu hợp pháp của Bên A. Mọi tranh chấp phát sinh từ tài sản cho thuê, Bên A hoàn toàn chịu trách nhiệm trước pháp luật.</p>
      </div>

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều 2. Bàn giao và sử dụng diện tích thuê</p>
        <p>2.1. Thời điểm Bên A bàn giao tài sản thuê: ngày <strong>{fmtD(c.ngay_bat_dau)}</strong>.</p>
        <p>2.2. Bên B được toàn quyền sử dụng tài sản thuê kể từ thời điểm được Bên A bàn giao.</p>
      </div>

      <CommonClauses c={c} startNum={3} />

      <div className="ct-dieu">
        <p className="ct-dieu-title">Điều 11. Quyền tiếp tục thuê nhà ở</p>
        <p>11.1. Trường hợp chủ sở hữu nhà ở chuyển quyền sở hữu cho người khác mà thời hạn thuê vẫn còn, Bên B được tiếp tục thuê đến hết hạn hợp đồng; chủ sở hữu mới có trách nhiệm tiếp tục thực hiện hợp đồng đã ký.</p>
        <p>11.2. Hợp đồng này có giá trị kể từ ngày hai bên ký kết.</p>
      </div>
    </>
  );
}

// ─── Router: chọn mẫu theo loại nhà ────────────────────────────────────────
export function ContractTemplate({ contract }) {
  const type = contract.loai_phong || '';
  if (type === 'Nhà nguyên căn') return <NhaTemplate c={contract} />;
  if (['Chung cư mini', 'Căn hộ dịch vụ', 'Studio'].includes(type)) return <ChungCuTemplate c={contract} />;
  return <TroTemplate c={contract} />;
}
