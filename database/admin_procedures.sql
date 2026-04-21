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
