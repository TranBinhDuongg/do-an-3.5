USE doan35;
GO

-- ============================================================
-- AUTH PROCEDURES
-- ============================================================

-- Lấy người dùng theo tài khoản để đăng nhập
CREATE OR ALTER PROCEDURE sp_LayNguoiDungTheoTaiKhoan
    @tai_khoan NVARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ma_nd, ho_ten, tai_khoan, dien_thoai, mat_khau, vai_tro, anh_dai_dien, con_hoat_dong
    FROM nguoi_dung
    WHERE tai_khoan = @tai_khoan AND con_hoat_dong = 1;
END
GO

-- Đăng ký người dùng mới
CREATE OR ALTER PROCEDURE sp_DangKyNguoiDung
    @ho_ten     NVARCHAR(100),
    @tai_khoan  NVARCHAR(150),
    @dien_thoai NVARCHAR(20),
    @mat_khau   NVARCHAR(255),
    @vai_tro    NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM nguoi_dung WHERE tai_khoan = @tai_khoan)
    BEGIN
        RAISERROR('USERNAME_EXISTS', 16, 1);
        RETURN;
    END

    INSERT INTO nguoi_dung (ho_ten, tai_khoan, dien_thoai, mat_khau, vai_tro)
    OUTPUT INSERTED.ma_nd, INSERTED.ho_ten, INSERTED.tai_khoan, INSERTED.vai_tro
    VALUES (@ho_ten, @tai_khoan, @dien_thoai, @mat_khau, @vai_tro);
END
GO

-- ============================================================
-- PROFILE PROCEDURES
-- ============================================================

-- Lấy hồ sơ theo mã người dùng
CREATE OR ALTER PROCEDURE sp_LayHoSo
    @ma_nd INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ma_nd, ho_ten, tai_khoan, dien_thoai, vai_tro, anh_dai_dien, ngay_tao
    FROM nguoi_dung
    WHERE ma_nd = @ma_nd;
END
GO

-- Cập nhật thông tin cá nhân
CREATE OR ALTER PROCEDURE sp_CapNhatHoSo
    @ma_nd      INT,
    @ho_ten     NVARCHAR(100),
    @dien_thoai NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE nguoi_dung
    SET ho_ten = @ho_ten, dien_thoai = @dien_thoai, ngay_cap_nhat = GETDATE()
    WHERE ma_nd = @ma_nd;

    SELECT ma_nd, ho_ten, tai_khoan, dien_thoai, vai_tro
    FROM nguoi_dung WHERE ma_nd = @ma_nd;
END
GO

-- Đổi mật khẩu
CREATE OR ALTER PROCEDURE sp_DoiMatKhau
    @ma_nd      INT,
    @mat_khau_moi NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE nguoi_dung
    SET mat_khau = @mat_khau_moi, ngay_cap_nhat = GETDATE()
    WHERE ma_nd = @ma_nd;
END
GO

-- Lấy mật khẩu hiện tại để xác minh
CREATE OR ALTER PROCEDURE sp_LayMatKhauTheoId
    @ma_nd INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT mat_khau FROM nguoi_dung WHERE ma_nd = @ma_nd;
END
GO

-- Cập nhật ảnh đại diện
CREATE OR ALTER PROCEDURE sp_CapNhatAnhDaiDien
    @ma_nd       INT,
    @anh_dai_dien NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE nguoi_dung
    SET anh_dai_dien = @anh_dai_dien, ngay_cap_nhat = GETDATE()
    WHERE ma_nd = @ma_nd;

    SELECT ma_nd, ho_ten, tai_khoan, dien_thoai, vai_tro, anh_dai_dien
    FROM nguoi_dung WHERE ma_nd = @ma_nd;
END
GO

-- ============================================================
-- ROOMS PROCEDURES (người thuê)
-- ============================================================

-- Lấy danh sách phòng đã duyệt (có filter)
CREATE OR ALTER PROCEDURE sp_LayDanhSachPhong
    @tu_khoa   NVARCHAR(200) = NULL,
    @tinh_thanh NVARCHAR(100) = NULL,
    @loai_phong NVARCHAR(50)  = NULL,
    @gia_min   DECIMAL(12,0) = NULL,
    @gia_max   DECIMAL(12,0) = NULL,
    @dt_min    DECIMAL(6,1)  = NULL,
    @sap_xep   NVARCHAR(20)  = 'newest',
    @gioi_han  INT           = 20,
    @bo_qua    INT           = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.quan_huyen, p.dia_chi,
        p.gia_thue, p.dien_tich, p.con_phong, p.noi_bat,
        p.luot_xem, p.ngay_tao,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong = p.ma_phong AND ap.la_anh_bia = 1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong = p.ma_phong ORDER BY ap.thu_tu) AS anh_dau_tien
    FROM phong_tro p
    WHERE p.trang_thai = 'approved'
      AND (@tu_khoa    IS NULL OR p.tieu_de LIKE '%' + @tu_khoa + '%' OR p.dia_chi LIKE '%' + @tu_khoa + '%')
      AND (@tinh_thanh IS NULL OR p.tinh_thanh = @tinh_thanh)
      AND (@loai_phong IS NULL OR p.loai_phong = @loai_phong)
      AND (@gia_min    IS NULL OR p.gia_thue >= @gia_min)
      AND (@gia_max    IS NULL OR p.gia_thue <= @gia_max)
      AND (@dt_min     IS NULL OR p.dien_tich >= @dt_min)
    ORDER BY
        CASE WHEN @sap_xep = 'newest'     THEN p.ngay_tao  END DESC,
        CASE WHEN @sap_xep = 'price-asc'  THEN p.gia_thue  END ASC,
        CASE WHEN @sap_xep = 'price-desc' THEN p.gia_thue  END DESC,
        CASE WHEN @sap_xep = 'area-desc'  THEN p.dien_tich END DESC
    OFFSET @bo_qua ROWS FETCH NEXT @gioi_han ROWS ONLY;
END
GO

-- Đếm tổng số phòng (để phân trang)
CREATE OR ALTER PROCEDURE sp_DemPhong
    @tu_khoa    NVARCHAR(200) = NULL,
    @tinh_thanh NVARCHAR(100) = NULL,
    @loai_phong NVARCHAR(50)  = NULL,
    @gia_min    DECIMAL(12,0) = NULL,
    @gia_max    DECIMAL(12,0) = NULL,
    @dt_min     DECIMAL(6,1)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS tong_so
    FROM phong_tro
    WHERE trang_thai = 'approved'
      AND (@tu_khoa    IS NULL OR tieu_de LIKE '%' + @tu_khoa + '%' OR dia_chi LIKE '%' + @tu_khoa + '%')
      AND (@tinh_thanh IS NULL OR tinh_thanh = @tinh_thanh)
      AND (@loai_phong IS NULL OR loai_phong = @loai_phong)
      AND (@gia_min    IS NULL OR gia_thue >= @gia_min)
      AND (@gia_max    IS NULL OR gia_thue <= @gia_max)
      AND (@dt_min     IS NULL OR dien_tich >= @dt_min);
END
GO

-- Lấy phòng mới nhất (trang chủ)
CREATE OR ALTER PROCEDURE sp_LayPhongMoi
    @gioi_han INT = 6
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@gioi_han)
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.dia_chi,
        p.gia_thue, p.dien_tich, p.con_phong, p.ngay_tao,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong = p.ma_phong AND ap.la_anh_bia = 1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong = p.ma_phong ORDER BY ap.thu_tu) AS anh_dau_tien
    FROM phong_tro p
    WHERE p.trang_thai = 'approved'
    ORDER BY p.ngay_tao DESC;
END
GO

-- Lấy phòng nổi bật (trang chủ)
CREATE OR ALTER PROCEDURE sp_LayPhongNoiBat
    @gioi_han INT = 6
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@gioi_han)
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.dia_chi,
        p.gia_thue, p.dien_tich, p.con_phong, p.noi_bat, p.ngay_tao,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong = p.ma_phong AND ap.la_anh_bia = 1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong = p.ma_phong ORDER BY ap.thu_tu) AS anh_dau_tien
    FROM phong_tro p
    WHERE p.trang_thai = 'approved'
    ORDER BY p.noi_bat DESC, p.luot_xem DESC, p.ngay_tao DESC;
END
GO

-- Thống kê trang chủ
CREATE OR ALTER PROCEDURE sp_LayThongKe
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM phong_tro  WHERE trang_thai = 'approved') AS tong_phong,
        (SELECT COUNT(*) FROM nguoi_dung WHERE vai_tro = 'employer')    AS tong_chu_tro,
        (SELECT COUNT(*) FROM nguoi_dung WHERE vai_tro = 'user')        AS tong_nguoi_thue;
END
GO

-- ============================================================
-- EMPLOYER DASHBOARD PROCEDURES
-- ============================================================

-- Thống kê tổng quan cho chủ trọ
CREATE OR ALTER PROCEDURE sp_ThongKeChuTro
    @ma_nd INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        COUNT(*) AS tong_tin,
        SUM(CASE WHEN trang_thai = 'approved' AND con_phong = 1 THEN 1 ELSE 0 END) AS tin_dang,
        SUM(CASE WHEN trang_thai = 'pending'  THEN 1 ELSE 0 END) AS cho_duyet,
        SUM(CASE WHEN trang_thai = 'rejected' THEN 1 ELSE 0 END) AS bi_tu_choi,
        SUM(CASE WHEN trang_thai = 'paused'   THEN 1 ELSE 0 END) AS tam_dung,
        ISNULL(SUM(luot_xem), 0)   AS tong_luot_xem,
        ISNULL(SUM(so_lien_he), 0) AS tong_lien_he,
        ISNULL((SELECT COUNT(*) FROM yeu_thich yt
                JOIN phong_tro pt ON yt.ma_phong = pt.ma_phong
                WHERE pt.ma_chu_tro = @ma_nd), 0) AS tong_luu_tin
    FROM phong_tro
    WHERE ma_chu_tro = @ma_nd;
END
GO

-- Lấy danh sách phòng của chủ trọ (dashboard)
CREATE OR ALTER PROCEDURE sp_LayPhongChuTro
    @ma_nd    INT,
    @gioi_han INT = 5,
    @bo_qua   INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.dia_chi,
        p.gia_thue, p.dien_tich, p.con_phong, p.noi_bat,
        p.trang_thai, p.luot_xem, p.so_lien_he, p.ngay_tao,
        (SELECT COUNT(*) FROM yeu_thich yt WHERE yt.ma_phong = p.ma_phong) AS luot_luu,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong = p.ma_phong AND ap.la_anh_bia = 1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong = p.ma_phong ORDER BY ap.thu_tu) AS anh_dau_tien
    FROM phong_tro p
    WHERE p.ma_chu_tro = @ma_nd
    ORDER BY p.ngay_tao DESC
    OFFSET @bo_qua ROWS FETCH NEXT @gioi_han ROWS ONLY;
END
GO

-- Lấy thông báo của người dùng
CREATE OR ALTER PROCEDURE sp_LayThongBao
    @ma_nd    INT,
    @gioi_han INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@gioi_han)
        ma_tb, bieu_tuong, noi_dung, da_doc, ngay_tao
    FROM thong_bao
    WHERE ma_nd = @ma_nd
    ORDER BY ngay_tao DESC;
END
GO

-- Đánh dấu tất cả thông báo đã đọc
CREATE OR ALTER PROCEDURE sp_DocTatCaThongBao
    @ma_nd INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE thong_bao SET da_doc = 1 WHERE ma_nd = @ma_nd AND da_doc = 0;
END
GO

-- Lấy gói đăng tin hiện tại của chủ trọ
CREATE OR ALTER PROCEDURE sp_LayGoiHienTai
    @ma_nd INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1
        ndg.ma, g.ten_goi, g.gia, g.so_ngay, g.gioi_han_tin,
        ndg.bat_dau, ndg.het_han, ndg.con_hieu_luc,
        DATEDIFF(DAY, GETDATE(), ndg.het_han) AS ngay_con_lai
    FROM nguoi_dung_goi ndg
    JOIN goi_dang_tin g ON ndg.ma_goi = g.ma_goi
    WHERE ndg.ma_nd = @ma_nd AND ndg.con_hieu_luc = 1
    ORDER BY ndg.het_han DESC;
END
GO

-- ============================================================
-- POST ROOM PROCEDURES
-- ============================================================

-- Đăng tin phòng trọ mới
CREATE OR ALTER PROCEDURE sp_DangTinPhong
    @ma_chu_tro    INT,
    @tieu_de       NVARCHAR(200),
    @loai_phong    NVARCHAR(50),
    @tinh_thanh    NVARCHAR(100),
    @quan_huyen    NVARCHAR(100) = NULL,
    @dia_chi       NVARCHAR(300),
    @gia_thue      DECIMAL(12,0),
    @tien_coc      DECIMAL(12,0) = NULL,
    @dien_tich     DECIMAL(6,1),
    @mo_ta         NVARCHAR(MAX) = NULL,
    @ten_lien_he   NVARCHAR(100),
    @sdt_lien_he   NVARCHAR(20),
    @email_lien_he NVARCHAR(150) = NULL,
    @hien_sdt      BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO phong_tro (
        ma_chu_tro, tieu_de, loai_phong, tinh_thanh, quan_huyen, dia_chi,
        gia_thue, tien_coc, dien_tich, mo_ta,
        ten_lien_he, sdt_lien_he, email_lien_he, hien_sdt,
        trang_thai
    )
    OUTPUT INSERTED.ma_phong
    VALUES (
        @ma_chu_tro, @tieu_de, @loai_phong, @tinh_thanh, @quan_huyen, @dia_chi,
        @gia_thue, @tien_coc, @dien_tich, @mo_ta,
        @ten_lien_he, @sdt_lien_he, @email_lien_he, @hien_sdt,
        'pending'
    );
END
GO

-- Thêm ảnh cho phòng
CREATE OR ALTER PROCEDURE sp_ThemAnhPhong
    @ma_phong  INT,
    @duong_dan NVARCHAR(500),
    @la_anh_bia BIT = 0,
    @thu_tu    INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO anh_phong (ma_phong, duong_dan, la_anh_bia, thu_tu)
    VALUES (@ma_phong, @duong_dan, @la_anh_bia, @thu_tu);
END
GO

-- Thêm tiện ích cho phòng theo ma_khoa
CREATE OR ALTER PROCEDURE sp_ThemTienIchPhong
    @ma_phong  INT,
    @ma_khoa   NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ma_tien_ich INT;
    SELECT @ma_tien_ich = ma_tien_ich FROM tien_ich WHERE ma_khoa = @ma_khoa;
    IF @ma_tien_ich IS NOT NULL
        INSERT INTO tien_ich_phong (ma_phong, ma_tien_ich) VALUES (@ma_phong, @ma_tien_ich);
END
GO

-- ============================================================
-- EMPLOYER ROOMS MANAGEMENT PROCEDURES
-- ============================================================

-- Lấy tất cả phòng của chủ trọ (có filter trạng thái)
CREATE OR ALTER PROCEDURE sp_LayPhongChuTroFilter
    @ma_nd      INT,
    @trang_thai NVARCHAR(20) = NULL  -- NULL = tất cả
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.dia_chi,
        p.gia_thue, p.dien_tich, p.con_phong, p.noi_bat,
        p.trang_thai, p.luot_xem, p.so_lien_he, p.ngay_tao,
        (SELECT COUNT(*) FROM yeu_thich yt WHERE yt.ma_phong = p.ma_phong) AS luot_luu,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong = p.ma_phong AND ap.la_anh_bia = 1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong = p.ma_phong ORDER BY ap.thu_tu) AS anh_dau_tien
    FROM phong_tro p
    WHERE p.ma_chu_tro = @ma_nd
      AND (@trang_thai IS NULL OR p.trang_thai = @trang_thai)
    ORDER BY p.ngay_tao DESC;
END
GO

-- Cập nhật trạng thái phòng (pause/activate)
CREATE OR ALTER PROCEDURE sp_CapNhatTrangThaiPhong
    @ma_phong   INT,
    @ma_chu_tro INT,
    @trang_thai NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE phong_tro
    SET trang_thai = @trang_thai
    WHERE ma_phong = @ma_phong AND ma_chu_tro = @ma_chu_tro;
    SELECT @@ROWCOUNT AS affected;
END
GO

-- Xóa tin đăng (chỉ chủ sở hữu)
CREATE OR ALTER PROCEDURE sp_XoaPhong
    @ma_phong   INT,
    @ma_chu_tro INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM phong_tro
    WHERE ma_phong = @ma_phong AND ma_chu_tro = @ma_chu_tro;
    SELECT @@ROWCOUNT AS affected;
END
GO
