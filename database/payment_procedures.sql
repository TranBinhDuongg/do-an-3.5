USE doan35;
GO

-- ============================================================
-- WALLET - Lấy số dư
-- ============================================================
CREATE OR ALTER PROCEDURE sp_LayViTien @ma_nd INT AS
BEGIN
    SET NOCOUNT ON;
    -- Tạo ví nếu chưa có
    IF NOT EXISTS (SELECT 1 FROM vi_tien WHERE ma_nd = @ma_nd)
        INSERT INTO vi_tien (ma_nd, so_du) VALUES (@ma_nd, 0);
    SELECT so_du FROM vi_tien WHERE ma_nd = @ma_nd;
END
GO

-- ============================================================
-- WALLET - Lịch sử giao dịch
-- ============================================================
CREATE OR ALTER PROCEDURE sp_LayLichSuGiaoDich
    @ma_nd   INT,
    @loai    NVARCHAR(20) = NULL,
    @gioi_han INT = 50,
    @bo_qua  INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ma_gd, loai, so_tien, mo_ta, trang_thai,
        phuong_thuc, ma_tham_chieu, ma_goi, ngay_tao
    FROM giao_dich
    WHERE ma_nd = @ma_nd
      AND (@loai IS NULL OR loai = @loai)
    ORDER BY ngay_tao DESC
    OFFSET @bo_qua ROWS FETCH NEXT @gioi_han ROWS ONLY;
END
GO

-- ============================================================
-- WALLET - Tạo yêu cầu nạp tiền (pending)
-- ============================================================
CREATE OR ALTER PROCEDURE sp_TaoYeuCauNapTien
    @ma_nd       INT,
    @so_tien     DECIMAL(15,0),
    @phuong_thuc NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF @so_tien < 10000
    BEGIN RAISERROR('MIN_AMOUNT', 16, 1); RETURN; END

    INSERT INTO giao_dich (ma_nd, loai, so_tien, mo_ta, trang_thai, phuong_thuc)
    OUTPUT INSERTED.ma_gd
    VALUES (
        @ma_nd, 'topup', @so_tien,
        N'Nạp tiền qua ' + @phuong_thuc,
        'pending', @phuong_thuc
    );
END
GO

-- ============================================================
-- WALLET - Admin duyệt nạp tiền
-- ============================================================
CREATE OR ALTER PROCEDURE sp_DuyetNapTien
    @ma_gd          INT,
    @ma_tham_chieu  NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ma_nd INT, @so_tien DECIMAL(15,0), @trang_thai NVARCHAR(20);

    SELECT @ma_nd = ma_nd, @so_tien = so_tien, @trang_thai = trang_thai
    FROM giao_dich WHERE ma_gd = @ma_gd AND loai = 'topup';

    IF @ma_nd IS NULL
    BEGIN RAISERROR('NOT_FOUND', 16, 1); RETURN; END

    IF @trang_thai != 'pending'
    BEGIN RAISERROR('ALREADY_PROCESSED', 16, 1); RETURN; END

    -- Cập nhật giao dịch
    UPDATE giao_dich
    SET trang_thai = 'success', ma_tham_chieu = @ma_tham_chieu, ngay_cap_nhat = GETDATE()
    WHERE ma_gd = @ma_gd;

    -- Cộng tiền vào ví
    IF NOT EXISTS (SELECT 1 FROM vi_tien WHERE ma_nd = @ma_nd)
        INSERT INTO vi_tien (ma_nd, so_du) VALUES (@ma_nd, 0);

    UPDATE vi_tien SET so_du = so_du + @so_tien, ngay_cap_nhat = GETDATE()
    WHERE ma_nd = @ma_nd;

    -- Gửi thông báo
    INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung)
    VALUES (@ma_nd, N'💰', N'Nạp tiền thành công ' + FORMAT(@so_tien, 'N0') + N'đ vào ví của bạn.');

    SELECT so_du FROM vi_tien WHERE ma_nd = @ma_nd;
END
GO

-- ============================================================
-- WALLET - Từ chối nạp tiền
-- ============================================================
CREATE OR ALTER PROCEDURE sp_TuChoiNapTien @ma_gd INT AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ma_nd INT, @trang_thai NVARCHAR(20);
    SELECT @ma_nd = ma_nd, @trang_thai = trang_thai FROM giao_dich WHERE ma_gd = @ma_gd AND loai = 'topup';

    IF @ma_nd IS NULL BEGIN RAISERROR('NOT_FOUND', 16, 1); RETURN; END
    IF @trang_thai != 'pending' BEGIN RAISERROR('ALREADY_PROCESSED', 16, 1); RETURN; END

    UPDATE giao_dich SET trang_thai = 'failed', ngay_cap_nhat = GETDATE() WHERE ma_gd = @ma_gd;

    INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung)
    VALUES (@ma_nd, N'❌', N'Yêu cầu nạp tiền của bạn đã bị từ chối. Vui lòng liên hệ hỗ trợ.');
END
GO

-- ============================================================
-- PAYMENT - Mua gói (trừ tiền từ ví)
-- ============================================================
CREATE OR ALTER PROCEDURE sp_MuaGoi
    @ma_nd  INT,
    @ma_goi INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    DECLARE @gia DECIMAL(15,0), @so_ngay INT, @ten_goi NVARCHAR(100), @gioi_han_tin INT, @noi_bat BIT;
    SELECT @gia = gia, @so_ngay = so_ngay, @ten_goi = ten_goi,
           @gioi_han_tin = gioi_han_tin, @noi_bat = noi_bat
    FROM goi_dang_tin WHERE ma_goi = @ma_goi;

    IF @gia IS NULL
    BEGIN ROLLBACK; RAISERROR('GOI_NOT_FOUND', 16, 1); RETURN; END

    -- Tạo ví nếu chưa có
    IF NOT EXISTS (SELECT 1 FROM vi_tien WHERE ma_nd = @ma_nd)
        INSERT INTO vi_tien (ma_nd, so_du) VALUES (@ma_nd, 0);

    DECLARE @so_du DECIMAL(15,0);
    SELECT @so_du = so_du FROM vi_tien WHERE ma_nd = @ma_nd;

    IF @so_du < @gia
    BEGIN ROLLBACK; RAISERROR('INSUFFICIENT_BALANCE', 16, 1); RETURN; END

    -- Trừ tiền
    UPDATE vi_tien SET so_du = so_du - @gia, ngay_cap_nhat = GETDATE() WHERE ma_nd = @ma_nd;

    -- Ghi giao dịch
    INSERT INTO giao_dich (ma_nd, loai, so_tien, mo_ta, trang_thai, phuong_thuc, ma_goi)
    VALUES (@ma_nd, 'payment', @gia, N'Mua gói ' + @ten_goi + N' (' + CAST(@so_ngay AS NVARCHAR) + N' ngày)', 'success', 'wallet', @ma_goi);

    -- Hủy gói cũ còn hiệu lực
    UPDATE nguoi_dung_goi SET con_hieu_luc = 0 WHERE ma_nd = @ma_nd AND con_hieu_luc = 1;

    -- Kích hoạt gói mới
    INSERT INTO nguoi_dung_goi (ma_nd, ma_goi, bat_dau, het_han, con_hieu_luc)
    VALUES (@ma_nd, @ma_goi, GETDATE(), DATEADD(DAY, @so_ngay, GETDATE()), 1);

    -- Thông báo
    INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung)
    VALUES (@ma_nd, N'🎉', N'Bạn đã mua thành công gói ' + @ten_goi + N'. Có hiệu lực trong ' + CAST(@so_ngay AS NVARCHAR) + N' ngày.');

    COMMIT;
    SELECT so_du AS so_du_moi FROM vi_tien WHERE ma_nd = @ma_nd;
END
GO

-- ============================================================
-- ADMIN - Danh sách yêu cầu nạp tiền
-- ============================================================
CREATE OR ALTER PROCEDURE sp_AdminLayYeuCauNapTien
    @trang_thai NVARCHAR(20) = NULL,
    @gioi_han   INT = 20,
    @bo_qua     INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        g.ma_gd, g.ma_nd, n.ho_ten, n.tai_khoan,
        g.so_tien, g.phuong_thuc, g.trang_thai,
        g.ma_tham_chieu, g.ngay_tao, g.ngay_cap_nhat,
        COUNT(*) OVER() AS tong_so
    FROM giao_dich g
    JOIN nguoi_dung n ON n.ma_nd = g.ma_nd
    WHERE g.loai = 'topup'
      AND (@trang_thai IS NULL OR g.trang_thai = @trang_thai)
    ORDER BY g.ngay_tao DESC
    OFFSET @bo_qua ROWS FETCH NEXT @gioi_han ROWS ONLY;
END
GO

-- ============================================================
-- ADMIN - Thống kê doanh thu
-- ============================================================
CREATE OR ALTER PROCEDURE sp_AdminThongKeDoanhThu AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ISNULL(SUM(CASE WHEN loai='topup'   AND trang_thai='success' THEN so_tien ELSE 0 END), 0) AS tong_nap,
        ISNULL(SUM(CASE WHEN loai='payment' AND trang_thai='success' THEN so_tien ELSE 0 END), 0) AS tong_chi,
        COUNT(CASE WHEN loai='topup' AND trang_thai='pending' THEN 1 END) AS cho_duyet_nap,
        COUNT(CASE WHEN loai='topup' AND trang_thai='success' THEN 1 END) AS gd_nap_thanh_cong,
        COUNT(CASE WHEN loai='payment' AND trang_thai='success' THEN 1 END) AS gd_mua_goi
    FROM giao_dich;
END
GO
