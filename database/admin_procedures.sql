USE doan35;
GO

-- ============================================================
-- Stored Procedures cho Admin quản lý tin đăng
-- ============================================================

-- ── 1. Danh sách tin đăng (có filter + phân trang) ──────────
CREATE OR ALTER PROCEDURE sp_AdminLayDanhSachPhong
    @trang_thai NVARCHAR(20)  = NULL,
    @tu_khoa    NVARCHAR(200) = NULL,
    @tinh_thanh NVARCHAR(100) = NULL,
    @loai_phong NVARCHAR(50)  = NULL,
    @gioi_han   INT           = 10,
    @bo_qua     INT           = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.quan_huyen,
        p.dia_chi, p.gia_thue, p.tien_coc, p.dien_tich, p.trang_thai,
        p.con_phong, p.noi_bat, p.luot_xem, p.so_lien_he,
        p.ngay_tao, p.ngay_cap_nhat,
        n.ho_ten, p.ma_chu_tro,
        (SELECT TOP 1 duong_dan FROM anh_phong WHERE ma_phong = p.ma_phong AND la_anh_bia = 1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong WHERE ma_phong = p.ma_phong ORDER BY thu_tu) AS anh_dau_tien,
        COUNT(*) OVER() AS tong_so
    FROM phong_tro p
    JOIN nguoi_dung n ON n.ma_nd = p.ma_chu_tro
    WHERE
        (@trang_thai IS NULL OR p.trang_thai = @trang_thai)
        AND (@tinh_thanh IS NULL OR p.tinh_thanh = @tinh_thanh)
        AND (@loai_phong IS NULL OR p.loai_phong = @loai_phong)
        AND (@tu_khoa IS NULL OR p.tieu_de LIKE N'%' + @tu_khoa + N'%' OR n.ho_ten LIKE N'%' + @tu_khoa + N'%')
    ORDER BY p.ngay_tao DESC
    OFFSET @bo_qua ROWS FETCH NEXT @gioi_han ROWS ONLY;
END
GO

-- ── 2. Thống kê số lượng theo trạng thái ───────────────────
CREATE OR ALTER PROCEDURE sp_AdminThongKeTinDang
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        COUNT(*)                                          AS tong_so,
        SUM(CASE WHEN trang_thai = 'pending'  THEN 1 ELSE 0 END) AS cho_duyet,
        SUM(CASE WHEN trang_thai = 'approved' THEN 1 ELSE 0 END) AS da_duyet,
        SUM(CASE WHEN trang_thai = 'rejected' THEN 1 ELSE 0 END) AS tu_choi,
        SUM(CASE WHEN trang_thai = 'paused'   THEN 1 ELSE 0 END) AS tam_dung
    FROM phong_tro;
END
GO

-- ── 3. Chi tiết một tin đăng ────────────────────────────────
CREATE OR ALTER PROCEDURE sp_AdminChiTietPhong
    @ma_phong INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.*,
        n.ho_ten,
        (SELECT TOP 1 duong_dan FROM anh_phong WHERE ma_phong = p.ma_phong AND la_anh_bia = 1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong WHERE ma_phong = p.ma_phong ORDER BY thu_tu)    AS anh_dau_tien
    FROM phong_tro p
    JOIN nguoi_dung n ON n.ma_nd = p.ma_chu_tro
    WHERE p.ma_phong = @ma_phong;
END
GO

-- ── 4. Cập nhật trạng thái tin đăng (admin) ────────────────
CREATE OR ALTER PROCEDURE sp_AdminCapNhatTrangThaiPhong
    @ma_phong   INT,
    @trang_thai NVARCHAR(20),
    @ma_admin   INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE phong_tro
    SET trang_thai    = @trang_thai,
        ngay_cap_nhat = GETDATE()
    WHERE ma_phong = @ma_phong;

    -- Gửi thông báo cho chủ trọ
    DECLARE @ma_chu_tro INT, @tieu_de NVARCHAR(200);
    SELECT @ma_chu_tro = ma_chu_tro, @tieu_de = tieu_de FROM phong_tro WHERE ma_phong = @ma_phong;

    DECLARE @noi_dung NVARCHAR(MAX);
    IF @trang_thai = 'approved'
        SET @noi_dung = N'✅ Tin đăng "' + @tieu_de + N'" đã được duyệt.';
    ELSE IF @trang_thai = 'rejected'
        SET @noi_dung = N'❌ Tin đăng "' + @tieu_de + N'" đã bị từ chối.';
    ELSE IF @trang_thai = 'paused'
        SET @noi_dung = N'⏸ Tin đăng "' + @tieu_de + N'" đã bị tạm dừng bởi quản trị viên.';

    IF @noi_dung IS NOT NULL
        INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung)
        VALUES (@ma_chu_tro, NULL, @noi_dung);
END
GO

-- ── 5. Xóa tin đăng (admin) ────────────────────────────────
CREATE OR ALTER PROCEDURE sp_AdminXoaPhong
    @ma_phong INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Cascade delete đã được định nghĩa trong schema (anh_phong, tien_ich_phong, yeu_thich)
    DELETE FROM phong_tro WHERE ma_phong = @ma_phong;
END
GO

-- ============================================================
-- Stored Procedures cho Admin quản lý người dùng
-- ============================================================

-- ── 6. Danh sách người dùng (filter + phân trang) ──────────
CREATE OR ALTER PROCEDURE sp_AdminLayDanhSachNguoiDung
    @vai_tro  NVARCHAR(10)  = NULL,
    @tu_khoa  NVARCHAR(200) = NULL,
    @gioi_han INT           = 10,
    @bo_qua   INT           = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        n.ma_nd, n.ho_ten, n.tai_khoan, n.dien_thoai,
        n.vai_tro, n.con_hoat_dong, n.anh_dai_dien, n.ngay_tao,
        (SELECT COUNT(*) FROM phong_tro p WHERE p.ma_chu_tro = n.ma_nd) AS so_tin,
        COUNT(*) OVER() AS tong_so
    FROM nguoi_dung n
    WHERE
        (@vai_tro IS NULL OR n.vai_tro = @vai_tro)
        AND (@tu_khoa IS NULL
             OR n.ho_ten    LIKE N'%' + @tu_khoa + N'%'
             OR n.tai_khoan LIKE N'%' + @tu_khoa + N'%'
             OR n.dien_thoai LIKE N'%' + @tu_khoa + N'%')
    ORDER BY n.ngay_tao DESC
    OFFSET @bo_qua ROWS FETCH NEXT @gioi_han ROWS ONLY;
END
GO

-- ── 7. Thống kê người dùng ──────────────────────────────────
CREATE OR ALTER PROCEDURE sp_AdminThongKeNguoiDung
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        COUNT(*)                                              AS tong_so,
        SUM(CASE WHEN vai_tro = 'user'     THEN 1 ELSE 0 END) AS nguoi_thue,
        SUM(CASE WHEN vai_tro = 'employer' THEN 1 ELSE 0 END) AS chu_tro,
        SUM(CASE WHEN vai_tro = 'admin'    THEN 1 ELSE 0 END) AS quan_tri,
        SUM(CASE WHEN con_hoat_dong = 1    THEN 1 ELSE 0 END) AS hoat_dong,
        SUM(CASE WHEN con_hoat_dong = 0    THEN 1 ELSE 0 END) AS bi_khoa
    FROM nguoi_dung;
END
GO

-- ── 8. Chi tiết người dùng ──────────────────────────────────
CREATE OR ALTER PROCEDURE sp_AdminChiTietNguoiDung
    @ma_nd INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        n.*,
        (SELECT COUNT(*) FROM phong_tro p WHERE p.ma_chu_tro = n.ma_nd) AS so_tin
    FROM nguoi_dung n
    WHERE n.ma_nd = @ma_nd;
END
GO

-- ── 9. Khóa / mở khóa tài khoản ────────────────────────────
CREATE OR ALTER PROCEDURE sp_AdminCapNhatTrangThaiNguoiDung
    @ma_nd         INT,
    @con_hoat_dong BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE nguoi_dung
    SET con_hoat_dong = @con_hoat_dong,
        ngay_cap_nhat = GETDATE()
    WHERE ma_nd = @ma_nd;
END
GO

-- ============================================================
-- Stored Procedures cho Admin báo cáo
-- ============================================================

-- ── 10. Tổng quan báo cáo ───────────────────────────────────
CREATE OR ALTER PROCEDURE sp_AdminBaoCaoTongQuan
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @thang_dau DATETIME2 = DATEADD(DAY, 1 - DAY(GETDATE()), CAST(GETDATE() AS DATE));
    SELECT
        (SELECT COUNT(*) FROM phong_tro)                                          AS tong_tin,
        (SELECT COUNT(*) FROM nguoi_dung)                                         AS tong_nguoi_dung,
        (SELECT ISNULL(SUM(luot_xem), 0) FROM phong_tro)                          AS tong_luot_xem,
        (SELECT ISNULL(SUM(so_lien_he), 0) FROM phong_tro)                        AS tong_lien_he,
        (SELECT COUNT(*) FROM phong_tro WHERE ngay_tao >= @thang_dau)             AS tin_moi_thang,
        (SELECT COUNT(*) FROM nguoi_dung WHERE ngay_tao >= @thang_dau)            AS user_moi_thang;
END
GO

-- ── 11. Tin đăng theo tháng ─────────────────────────────────
CREATE OR ALTER PROCEDURE sp_AdminThongKeTinDangTheoThang
    @tu_ngay  DATE,
    @den_ngay DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        FORMAT(DATEFROMPARTS(YEAR(ngay_tao), MONTH(ngay_tao), 1), 'T M/yy') AS thang_label,
        CAST(DATEFROMPARTS(YEAR(ngay_tao), MONTH(ngay_tao), 1) AS VARCHAR(10)) AS thang_date,
        COUNT(*)                                                               AS tong_dang,
        SUM(CASE WHEN trang_thai = 'approved' THEN 1 ELSE 0 END)              AS duoc_duyet,
        SUM(CASE WHEN trang_thai = 'rejected' THEN 1 ELSE 0 END)              AS tu_choi
    FROM phong_tro
    WHERE CAST(ngay_tao AS DATE) BETWEEN @tu_ngay AND @den_ngay
    GROUP BY YEAR(ngay_tao), MONTH(ngay_tao)
    ORDER BY YEAR(ngay_tao), MONTH(ngay_tao);
END
GO

-- ── 12. Người dùng mới theo tháng ──────────────────────────
CREATE OR ALTER PROCEDURE sp_AdminThongKeNguoiDungTheoThang
    @tu_ngay  DATE,
    @den_ngay DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        FORMAT(DATEFROMPARTS(YEAR(ngay_tao), MONTH(ngay_tao), 1), 'T M/yy') AS thang_label,
        CAST(DATEFROMPARTS(YEAR(ngay_tao), MONTH(ngay_tao), 1) AS VARCHAR(10)) AS thang_date,
        SUM(CASE WHEN vai_tro = 'user'     THEN 1 ELSE 0 END) AS nguoi_thue,
        SUM(CASE WHEN vai_tro = 'employer' THEN 1 ELSE 0 END) AS chu_tro
    FROM nguoi_dung
    WHERE CAST(ngay_tao AS DATE) BETWEEN @tu_ngay AND @den_ngay
    GROUP BY YEAR(ngay_tao), MONTH(ngay_tao)
    ORDER BY YEAR(ngay_tao), MONTH(ngay_tao);
END
GO

-- ── 13. Phân bổ loại phòng ──────────────────────────────────
CREATE OR ALTER PROCEDURE sp_AdminThongKeLoaiPhong
AS
BEGIN
    SET NOCOUNT ON;
    SELECT loai_phong, COUNT(*) AS so_luong
    FROM phong_tro
    GROUP BY loai_phong
    ORDER BY so_luong DESC;
END
GO

-- ── 14. Top thành phố ───────────────────────────────────────
CREATE OR ALTER PROCEDURE sp_AdminTopThanhPho
    @gioi_han INT = 6
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@gioi_han) tinh_thanh, COUNT(*) AS so_luong
    FROM phong_tro
    GROUP BY tinh_thanh
    ORDER BY so_luong DESC;
END
GO

-- ── 15. Top chủ trọ ─────────────────────────────────────────
CREATE OR ALTER PROCEDURE sp_AdminTopChuTro
    @gioi_han INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@gioi_han)
        n.ho_ten,
        COUNT(p.ma_phong)          AS so_tin,
        ISNULL(SUM(p.luot_xem), 0) AS tong_luot_xem,
        ISNULL(SUM(p.so_lien_he), 0) AS tong_lien_he
    FROM nguoi_dung n
    JOIN phong_tro p ON p.ma_chu_tro = n.ma_nd
    WHERE n.vai_tro = 'employer'
    GROUP BY n.ma_nd, n.ho_ten
    ORDER BY tong_luot_xem DESC;
END
GO
