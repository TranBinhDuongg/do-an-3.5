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
