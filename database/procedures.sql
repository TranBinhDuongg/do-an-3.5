USE doan35;
GO

-- ============================================================
-- AUTH
-- ============================================================

CREATE OR ALTER PROCEDURE sp_LayNguoiDungTheoTaiKhoan @tai_khoan NVARCHAR(150) AS
BEGIN
    SET NOCOUNT ON;
    SELECT ma_nd, ho_ten, tai_khoan, dien_thoai, mat_khau, vai_tro, anh_dai_dien, con_hoat_dong
    FROM nguoi_dung WHERE tai_khoan = @tai_khoan AND con_hoat_dong = 1;
END
GO

CREATE OR ALTER PROCEDURE sp_DangKyNguoiDung
    @ho_ten NVARCHAR(100), @tai_khoan NVARCHAR(150), @dien_thoai NVARCHAR(20),
    @mat_khau NVARCHAR(255), @vai_tro NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM nguoi_dung WHERE tai_khoan = @tai_khoan)
    BEGIN RAISERROR('USERNAME_EXISTS',16,1); RETURN; END
    INSERT INTO nguoi_dung (ho_ten, tai_khoan, dien_thoai, mat_khau, vai_tro)
    OUTPUT INSERTED.ma_nd, INSERTED.ho_ten, INSERTED.tai_khoan, INSERTED.vai_tro
    VALUES (@ho_ten, @tai_khoan, @dien_thoai, @mat_khau, @vai_tro);
END
GO

-- ============================================================
-- PROFILE
-- ============================================================

CREATE OR ALTER PROCEDURE sp_LayHoSo @ma_nd INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT ma_nd, ho_ten, tai_khoan, dien_thoai, vai_tro, anh_dai_dien, ngay_tao
    FROM nguoi_dung WHERE ma_nd = @ma_nd;
END
GO

CREATE OR ALTER PROCEDURE sp_CapNhatHoSo @ma_nd INT, @ho_ten NVARCHAR(100), @dien_thoai NVARCHAR(20) AS
BEGIN
    SET NOCOUNT ON;
    UPDATE nguoi_dung SET ho_ten=@ho_ten, dien_thoai=@dien_thoai, ngay_cap_nhat=GETDATE() WHERE ma_nd=@ma_nd;
    SELECT ma_nd, ho_ten, tai_khoan, dien_thoai, vai_tro FROM nguoi_dung WHERE ma_nd=@ma_nd;
END
GO

CREATE OR ALTER PROCEDURE sp_DoiMatKhau @ma_nd INT, @mat_khau_moi NVARCHAR(255) AS
BEGIN
    SET NOCOUNT ON;
    UPDATE nguoi_dung SET mat_khau=@mat_khau_moi, ngay_cap_nhat=GETDATE() WHERE ma_nd=@ma_nd;
END
GO

CREATE OR ALTER PROCEDURE sp_LayMatKhauTheoId @ma_nd INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT mat_khau FROM nguoi_dung WHERE ma_nd=@ma_nd;
END
GO

CREATE OR ALTER PROCEDURE sp_CapNhatAnhDaiDien @ma_nd INT, @anh_dai_dien NVARCHAR(MAX) AS
BEGIN
    SET NOCOUNT ON;
    UPDATE nguoi_dung SET anh_dai_dien=@anh_dai_dien, ngay_cap_nhat=GETDATE() WHERE ma_nd=@ma_nd;
    SELECT ma_nd, ho_ten, tai_khoan, dien_thoai, vai_tro, anh_dai_dien FROM nguoi_dung WHERE ma_nd=@ma_nd;
END
GO

-- ============================================================
-- ROOMS (người thuê)
-- ============================================================

CREATE OR ALTER PROCEDURE sp_LayDanhSachPhong
    @tu_khoa NVARCHAR(200)=NULL, @tinh_thanh NVARCHAR(100)=NULL, @loai_phong NVARCHAR(50)=NULL,
    @gia_min DECIMAL(12,0)=NULL, @gia_max DECIMAL(12,0)=NULL, @dt_min DECIMAL(6,1)=NULL,
    @sap_xep NVARCHAR(20)='newest', @gioi_han INT=20, @bo_qua INT=0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.quan_huyen, p.dia_chi,
        p.gia_thue, p.dien_tich, p.con_phong, p.noi_bat, p.luot_xem, p.ngay_tao, p.ngay_up_top,
        ISNULL(g.muc_do_uu_tien, 3) AS muc_do_uu_tien, g.huy_hieu,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong AND ap.la_anh_bia=1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong ORDER BY ap.thu_tu) AS anh_dau_tien
    FROM phong_tro p
    LEFT JOIN nguoi_dung_goi ndg ON ndg.ma_nd = p.ma_chu_tro AND ndg.con_hieu_luc = 1
    LEFT JOIN goi_dang_tin g ON g.ma_goi = ndg.ma_goi
    WHERE p.trang_thai='approved'
      AND (@tu_khoa    IS NULL OR p.tieu_de LIKE '%'+@tu_khoa+'%' OR p.dia_chi LIKE '%'+@tu_khoa+'%')
      AND (@tinh_thanh IS NULL OR p.tinh_thanh=@tinh_thanh)
      AND (@loai_phong IS NULL OR p.loai_phong=@loai_phong)
      AND (@gia_min    IS NULL OR p.gia_thue>=@gia_min)
      AND (@gia_max    IS NULL OR p.gia_thue<=@gia_max)
      AND (@dt_min     IS NULL OR p.dien_tich>=@dt_min)
    ORDER BY
        CASE WHEN @sap_xep='newest'     THEN ISNULL(g.muc_do_uu_tien, 3) END ASC,
        CASE WHEN @sap_xep='newest'     THEN p.ngay_up_top END DESC,
        CASE WHEN @sap_xep='price-asc'  THEN p.gia_thue  END ASC,
        CASE WHEN @sap_xep='price-desc' THEN p.gia_thue  END DESC,
        CASE WHEN @sap_xep='area-desc'  THEN p.dien_tich END DESC
    OFFSET @bo_qua ROWS FETCH NEXT @gioi_han ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_DemPhong
    @tu_khoa NVARCHAR(200)=NULL, @tinh_thanh NVARCHAR(100)=NULL, @loai_phong NVARCHAR(50)=NULL,
    @gia_min DECIMAL(12,0)=NULL, @gia_max DECIMAL(12,0)=NULL, @dt_min DECIMAL(6,1)=NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS tong_so FROM phong_tro
    WHERE trang_thai='approved'
      AND (@tu_khoa    IS NULL OR tieu_de LIKE '%'+@tu_khoa+'%' OR dia_chi LIKE '%'+@tu_khoa+'%')
      AND (@tinh_thanh IS NULL OR tinh_thanh=@tinh_thanh)
      AND (@loai_phong IS NULL OR loai_phong=@loai_phong)
      AND (@gia_min    IS NULL OR gia_thue>=@gia_min)
      AND (@gia_max    IS NULL OR gia_thue<=@gia_max)
      AND (@dt_min     IS NULL OR dien_tich>=@dt_min);
END
GO

CREATE OR ALTER PROCEDURE sp_LayPhongMoi @gioi_han INT=6 AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@gioi_han)
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.dia_chi,
        p.gia_thue, p.dien_tich, p.con_phong, p.ngay_tao,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong AND ap.la_anh_bia=1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong ORDER BY ap.thu_tu) AS anh_dau_tien
    FROM phong_tro p WHERE p.trang_thai='approved' ORDER BY p.ngay_tao DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_LayPhongNoiBat @gioi_han INT=6 AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@gioi_han)
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.dia_chi,
        p.gia_thue, p.dien_tich, p.con_phong, p.noi_bat, p.ngay_tao, p.ngay_up_top,
        ISNULL(g.muc_do_uu_tien, 3) AS muc_do_uu_tien,
        g.huy_hieu,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong AND ap.la_anh_bia=1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong ORDER BY ap.thu_tu) AS anh_dau_tien
    FROM phong_tro p
    LEFT JOIN nguoi_dung_goi ndg ON ndg.ma_nd = p.ma_chu_tro AND ndg.con_hieu_luc = 1
    LEFT JOIN goi_dang_tin g ON g.ma_goi = ndg.ma_goi
    WHERE p.trang_thai='approved'
    ORDER BY ISNULL(g.muc_do_uu_tien,3) ASC, p.noi_bat DESC, p.ngay_up_top DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_LayPhongVIP @gioi_han INT=8 AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@gioi_han)
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.dia_chi,
        p.gia_thue, p.dien_tich, p.con_phong, p.noi_bat, p.ngay_tao, p.ngay_up_top,
        ISNULL(g.muc_do_uu_tien, 3) AS muc_do_uu_tien,
        g.huy_hieu,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong AND ap.la_anh_bia=1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong ORDER BY ap.thu_tu) AS anh_dau_tien
    FROM phong_tro p
    INNER JOIN nguoi_dung_goi ndg ON ndg.ma_nd = p.ma_chu_tro AND ndg.con_hieu_luc = 1
    INNER JOIN goi_dang_tin g ON g.ma_goi = ndg.ma_goi
    WHERE p.trang_thai='approved'
    ORDER BY g.muc_do_uu_tien ASC, p.ngay_up_top DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_LayThongKe AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM phong_tro  WHERE trang_thai='approved') AS tong_phong,
        (SELECT COUNT(*) FROM nguoi_dung WHERE vai_tro='employer')    AS tong_chu_tro,
        (SELECT COUNT(*) FROM nguoi_dung WHERE vai_tro='user')        AS tong_nguoi_thue;
END
GO

-- ============================================================
-- EMPLOYER
-- ============================================================

CREATE OR ALTER PROCEDURE sp_ThongKeChuTro @ma_nd INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        COUNT(*) AS tong_tin,
        SUM(CASE WHEN trang_thai='approved' AND con_phong=1 THEN 1 ELSE 0 END) AS tin_dang,
        SUM(CASE WHEN trang_thai='pending'  THEN 1 ELSE 0 END) AS cho_duyet,
        SUM(CASE WHEN trang_thai='rejected' THEN 1 ELSE 0 END) AS bi_tu_choi,
        SUM(CASE WHEN trang_thai='paused'   THEN 1 ELSE 0 END) AS tam_dung,
        ISNULL(SUM(luot_xem),0)   AS tong_luot_xem,
        ISNULL(SUM(so_lien_he),0) AS tong_lien_he,
        ISNULL((SELECT COUNT(*) FROM yeu_thich yt JOIN phong_tro pt ON yt.ma_phong=pt.ma_phong WHERE pt.ma_chu_tro=@ma_nd),0) AS tong_luu_tin
    FROM phong_tro WHERE ma_chu_tro=@ma_nd;
END
GO

CREATE OR ALTER PROCEDURE sp_LayPhongChuTro @ma_nd INT, @gioi_han INT=5, @bo_qua INT=0 AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.dia_chi,
        p.gia_thue, p.dien_tich, p.con_phong, p.noi_bat, p.trang_thai,
        p.luot_xem, p.so_lien_he, p.ngay_tao,
        (SELECT COUNT(*) FROM yeu_thich yt WHERE yt.ma_phong=p.ma_phong) AS luot_luu,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong AND ap.la_anh_bia=1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong ORDER BY ap.thu_tu) AS anh_dau_tien
    FROM phong_tro p WHERE p.ma_chu_tro=@ma_nd
    ORDER BY p.ngay_tao DESC OFFSET @bo_qua ROWS FETCH NEXT @gioi_han ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_LayPhongChuTroFilter @ma_nd INT, @trang_thai NVARCHAR(20)=NULL AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.dia_chi,
        p.gia_thue, p.dien_tich, p.con_phong, p.noi_bat, p.trang_thai,
        p.luot_xem, p.so_lien_he, p.ngay_tao,
        (SELECT COUNT(*) FROM yeu_thich yt WHERE yt.ma_phong=p.ma_phong) AS luot_luu,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong AND ap.la_anh_bia=1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong ORDER BY ap.thu_tu) AS anh_dau_tien
    FROM phong_tro p WHERE p.ma_chu_tro=@ma_nd AND (@trang_thai IS NULL OR p.trang_thai=@trang_thai)
    ORDER BY p.ngay_tao DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_CapNhatTrangThaiPhong @ma_phong INT, @ma_chu_tro INT, @trang_thai NVARCHAR(20) AS
BEGIN
    SET NOCOUNT ON;
    UPDATE phong_tro SET trang_thai=@trang_thai WHERE ma_phong=@ma_phong AND ma_chu_tro=@ma_chu_tro;
    SELECT @@ROWCOUNT AS affected;
END
GO

CREATE OR ALTER PROCEDURE sp_XoaPhong @ma_phong INT, @ma_chu_tro INT AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM phong_tro WHERE ma_phong=@ma_phong AND ma_chu_tro=@ma_chu_tro;
    SELECT @@ROWCOUNT AS affected;
END
GO

CREATE OR ALTER PROCEDURE sp_SuaPhong
    @ma_phong INT, @ma_chu_tro INT,
    @tieu_de NVARCHAR(200), @loai_phong NVARCHAR(50),
    @tinh_thanh NVARCHAR(100), @quan_huyen NVARCHAR(100)=NULL, @dia_chi NVARCHAR(300),
    @gia_thue DECIMAL(12,0), @tien_coc DECIMAL(12,0)=NULL, @dien_tich DECIMAL(6,1),
    @mo_ta NVARCHAR(MAX)=NULL, @ten_lien_he NVARCHAR(100), @sdt_lien_he NVARCHAR(20),
    @email_lien_he NVARCHAR(150)=NULL, @hien_sdt BIT=1, @video_url NVARCHAR(255)=NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @duyet_tu_dong BIT = 0;
    SELECT TOP 1 @duyet_tu_dong = g.duyet_tu_dong
    FROM nguoi_dung_goi ndg JOIN goi_dang_tin g ON ndg.ma_goi = g.ma_goi
    WHERE ndg.ma_nd = @ma_chu_tro AND ndg.con_hieu_luc = 1 ORDER BY ndg.het_han DESC;

    DECLARE @trang_thai NVARCHAR(20) = 'pending';
    IF @duyet_tu_dong = 1 SET @trang_thai = 'approved';

    UPDATE phong_tro SET
        tieu_de=@tieu_de, loai_phong=@loai_phong,
        tinh_thanh=@tinh_thanh, quan_huyen=@quan_huyen, dia_chi=@dia_chi,
        gia_thue=@gia_thue, tien_coc=@tien_coc, dien_tich=@dien_tich,
        mo_ta=@mo_ta, ten_lien_he=@ten_lien_he, sdt_lien_he=@sdt_lien_he,
        email_lien_he=@email_lien_he, hien_sdt=@hien_sdt, video_url=@video_url,
        trang_thai=@trang_thai, ngay_cap_nhat=GETDATE()
    WHERE ma_phong=@ma_phong AND ma_chu_tro=@ma_chu_tro;
    SELECT @@ROWCOUNT AS affected;
END
GO

CREATE OR ALTER PROCEDURE sp_DangTinPhong
    @ma_chu_tro INT, @tieu_de NVARCHAR(200), @loai_phong NVARCHAR(50),
    @tinh_thanh NVARCHAR(100), @quan_huyen NVARCHAR(100)=NULL, @dia_chi NVARCHAR(300),
    @gia_thue DECIMAL(12,0), @tien_coc DECIMAL(12,0)=NULL, @dien_tich DECIMAL(6,1),
    @mo_ta NVARCHAR(MAX)=NULL, @ten_lien_he NVARCHAR(100), @sdt_lien_he NVARCHAR(20),
    @email_lien_he NVARCHAR(150)=NULL, @hien_sdt BIT=1, @video_url NVARCHAR(255)=NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ma_goi_nd INT, @gioi_han_tin INT, @tin_da_dang INT, @duyet_tu_dong BIT;
    
    SELECT TOP 1 @ma_goi_nd = ndg.ma, @gioi_han_tin = g.gioi_han_tin, @tin_da_dang = ndg.tin_da_dang, @duyet_tu_dong = g.duyet_tu_dong
    FROM nguoi_dung_goi ndg
    JOIN goi_dang_tin g ON ndg.ma_goi = g.ma_goi
    WHERE ndg.ma_nd = @ma_chu_tro AND ndg.con_hieu_luc = 1
    ORDER BY ndg.het_han DESC;
    
    IF @ma_goi_nd IS NULL BEGIN RAISERROR('NO_ACTIVE_PACKAGE', 16, 1); RETURN; END
    IF @tin_da_dang >= @gioi_han_tin BEGIN RAISERROR('PACKAGE_LIMIT_REACHED', 16, 1); RETURN; END

    DECLARE @trang_thai NVARCHAR(20) = 'pending';
    IF @duyet_tu_dong = 1 SET @trang_thai = 'approved';

    INSERT INTO phong_tro (ma_chu_tro,tieu_de,loai_phong,tinh_thanh,quan_huyen,dia_chi,gia_thue,tien_coc,dien_tich,mo_ta,ten_lien_he,sdt_lien_he,email_lien_he,hien_sdt,trang_thai, video_url, ngay_up_top)
    OUTPUT INSERTED.ma_phong
    VALUES (@ma_chu_tro,@tieu_de,@loai_phong,@tinh_thanh,@quan_huyen,@dia_chi,@gia_thue,@tien_coc,@dien_tich,@mo_ta,@ten_lien_he,@sdt_lien_he,@email_lien_he,@hien_sdt,@trang_thai, @video_url, GETDATE());

    UPDATE nguoi_dung_goi SET tin_da_dang = tin_da_dang + 1 WHERE ma = @ma_goi_nd;
END
GO

CREATE OR ALTER PROCEDURE sp_DayTinPhong @ma_phong INT, @ma_chu_tro INT AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ma_goi_nd INT, @day_tin_da_dung INT, @luot_day_tin INT;
    
    SELECT TOP 1 @ma_goi_nd = ndg.ma, @day_tin_da_dung = ndg.day_tin_da_dung, @luot_day_tin = g.luot_day_tin
    FROM nguoi_dung_goi ndg JOIN goi_dang_tin g ON ndg.ma_goi = g.ma_goi
    WHERE ndg.ma_nd = @ma_chu_tro AND ndg.con_hieu_luc = 1 ORDER BY ndg.het_han DESC;
    
    IF @ma_goi_nd IS NULL BEGIN RAISERROR('NO_ACTIVE_PACKAGE', 16, 1); RETURN; END
    IF @day_tin_da_dung >= @luot_day_tin BEGIN RAISERROR('PUSH_LIMIT_REACHED', 16, 1); RETURN; END
    IF NOT EXISTS (SELECT 1 FROM phong_tro WHERE ma_phong = @ma_phong AND ma_chu_tro = @ma_chu_tro)
    BEGIN RAISERROR('NOT_FOUND', 16, 1); RETURN; END

    UPDATE phong_tro SET ngay_up_top = GETDATE() WHERE ma_phong = @ma_phong;
    UPDATE nguoi_dung_goi SET day_tin_da_dung = day_tin_da_dung + 1 WHERE ma = @ma_goi_nd;
END
GO

CREATE OR ALTER PROCEDURE sp_ThemAnhPhong @ma_phong INT, @duong_dan NVARCHAR(MAX), @la_anh_bia BIT=0, @thu_tu INT=0 AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO anh_phong (ma_phong,duong_dan,la_anh_bia,thu_tu) VALUES (@ma_phong,@duong_dan,@la_anh_bia,@thu_tu);
END
GO

CREATE OR ALTER PROCEDURE sp_ThemTienIchPhong @ma_phong INT, @ma_khoa NVARCHAR(50) AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ma_tien_ich INT;
    SELECT @ma_tien_ich=ma_tien_ich FROM tien_ich WHERE ma_khoa=@ma_khoa;
    IF @ma_tien_ich IS NOT NULL
        INSERT INTO tien_ich_phong (ma_phong,ma_tien_ich) VALUES (@ma_phong,@ma_tien_ich);
END
GO

CREATE OR ALTER PROCEDURE sp_LayThongBao @ma_nd INT, @gioi_han INT=10 AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@gioi_han) ma_tb, bieu_tuong, noi_dung, da_doc, ngay_tao
    FROM thong_bao WHERE ma_nd=@ma_nd ORDER BY ngay_tao DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_DocTatCaThongBao @ma_nd INT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE thong_bao SET da_doc=1 WHERE ma_nd=@ma_nd AND da_doc=0;
END
GO

CREATE OR ALTER PROCEDURE sp_LayGoiHienTai @ma_nd INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1
        ndg.ma, g.ten_goi, g.gia, g.so_ngay, g.gioi_han_tin,
        g.duyet_tu_dong, g.so_anh_toi_da, g.luot_day_tin, g.huy_hieu, g.ho_tro_video,
        ndg.tin_da_dang, ndg.day_tin_da_dung,
        ndg.bat_dau, ndg.het_han, ndg.con_hieu_luc,
        DATEDIFF(DAY,GETDATE(),ndg.het_han) AS ngay_con_lai
    FROM nguoi_dung_goi ndg JOIN goi_dang_tin g ON ndg.ma_goi=g.ma_goi
    WHERE ndg.ma_nd=@ma_nd AND ndg.con_hieu_luc=1 ORDER BY ndg.het_han DESC;
END
GO

-- ============================================================
-- ADMIN - Tin đăng
-- ============================================================

CREATE OR ALTER PROCEDURE sp_AdminLayDanhSachPhong
    @trang_thai NVARCHAR(20)=NULL, @tu_khoa NVARCHAR(200)=NULL,
    @tinh_thanh NVARCHAR(100)=NULL, @loai_phong NVARCHAR(50)=NULL,
    @gioi_han INT=10, @bo_qua INT=0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.quan_huyen,
        p.dia_chi, p.gia_thue, p.tien_coc, p.dien_tich, p.trang_thai,
        p.con_phong, p.noi_bat, p.luot_xem, p.so_lien_he, p.ngay_tao, p.ngay_cap_nhat,
        n.ho_ten, p.ma_chu_tro,
        (SELECT TOP 1 duong_dan FROM anh_phong WHERE ma_phong=p.ma_phong AND la_anh_bia=1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong WHERE ma_phong=p.ma_phong ORDER BY thu_tu)  AS anh_dau_tien,
        COUNT(*) OVER() AS tong_so
    FROM phong_tro p JOIN nguoi_dung n ON n.ma_nd=p.ma_chu_tro
    WHERE (@trang_thai IS NULL OR p.trang_thai=@trang_thai)
      AND (@tinh_thanh IS NULL OR p.tinh_thanh=@tinh_thanh)
      AND (@loai_phong IS NULL OR p.loai_phong=@loai_phong)
      AND (@tu_khoa IS NULL OR p.tieu_de LIKE N'%'+@tu_khoa+N'%' OR n.ho_ten LIKE N'%'+@tu_khoa+N'%')
    ORDER BY p.ngay_tao DESC OFFSET @bo_qua ROWS FETCH NEXT @gioi_han ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_AdminThongKeTinDang AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS tong_so,
        SUM(CASE WHEN trang_thai='pending'  THEN 1 ELSE 0 END) AS cho_duyet,
        SUM(CASE WHEN trang_thai='approved' THEN 1 ELSE 0 END) AS da_duyet,
        SUM(CASE WHEN trang_thai='rejected' THEN 1 ELSE 0 END) AS tu_choi,
        SUM(CASE WHEN trang_thai='paused'   THEN 1 ELSE 0 END) AS tam_dung
    FROM phong_tro;
END
GO

CREATE OR ALTER PROCEDURE sp_AdminChiTietPhong @ma_phong INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.*, n.ho_ten,
        (SELECT TOP 1 duong_dan FROM anh_phong WHERE ma_phong=p.ma_phong AND la_anh_bia=1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong WHERE ma_phong=p.ma_phong ORDER BY thu_tu)  AS anh_dau_tien
    FROM phong_tro p JOIN nguoi_dung n ON n.ma_nd=p.ma_chu_tro WHERE p.ma_phong=@ma_phong;
END
GO

CREATE OR ALTER PROCEDURE sp_AdminCapNhatTrangThaiPhong @ma_phong INT, @trang_thai NVARCHAR(20), @ma_admin INT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE phong_tro SET trang_thai=@trang_thai, ngay_cap_nhat=GETDATE() WHERE ma_phong=@ma_phong;
    DECLARE @ma_chu_tro INT, @tieu_de NVARCHAR(200), @noi_dung NVARCHAR(MAX);
    SELECT @ma_chu_tro=ma_chu_tro, @tieu_de=tieu_de FROM phong_tro WHERE ma_phong=@ma_phong;
    IF @trang_thai='approved' SET @noi_dung=N'✅ Tin đăng "'+@tieu_de+N'" đã được duyệt.';
    ELSE IF @trang_thai='rejected' SET @noi_dung=N'❌ Tin đăng "'+@tieu_de+N'" đã bị từ chối.';
    ELSE IF @trang_thai='paused'   SET @noi_dung=N'⏸ Tin đăng "'+@tieu_de+N'" đã bị tạm dừng bởi quản trị viên.';
    IF @noi_dung IS NOT NULL INSERT INTO thong_bao (ma_nd,bieu_tuong,noi_dung) VALUES (@ma_chu_tro,NULL,@noi_dung);
END
GO

CREATE OR ALTER PROCEDURE sp_AdminXoaPhong @ma_phong INT AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM phong_tro WHERE ma_phong=@ma_phong;
END
GO

-- ============================================================
-- ADMIN - Người dùng
-- ============================================================

CREATE OR ALTER PROCEDURE sp_AdminLayDanhSachNguoiDung
    @vai_tro NVARCHAR(10)=NULL, @tu_khoa NVARCHAR(200)=NULL, @gioi_han INT=10, @bo_qua INT=0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT n.ma_nd, n.ho_ten, n.tai_khoan, n.dien_thoai, n.vai_tro,
        n.con_hoat_dong, n.anh_dai_dien, n.ngay_tao,
        (SELECT COUNT(*) FROM phong_tro p WHERE p.ma_chu_tro=n.ma_nd) AS so_tin,
        g.ten_goi AS ten_goi_hien_tai,
        ndg.het_han AS het_han_goi,
        DATEDIFF(DAY, GETDATE(), ndg.het_han) AS ngay_con_lai_goi,
        COUNT(*) OVER() AS tong_so
    FROM nguoi_dung n
    LEFT JOIN nguoi_dung_goi ndg ON ndg.ma_nd = n.ma_nd AND ndg.con_hieu_luc = 1
    LEFT JOIN goi_dang_tin g ON g.ma_goi = ndg.ma_goi
    WHERE (@vai_tro IS NULL OR n.vai_tro=@vai_tro)
      AND (@tu_khoa IS NULL OR n.ho_ten LIKE N'%'+@tu_khoa+N'%'
           OR n.tai_khoan LIKE N'%'+@tu_khoa+N'%' OR n.dien_thoai LIKE N'%'+@tu_khoa+N'%')
    ORDER BY n.ngay_tao DESC OFFSET @bo_qua ROWS FETCH NEXT @gioi_han ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_AdminThongKeNguoiDung AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS tong_so,
        SUM(CASE WHEN vai_tro='user'     THEN 1 ELSE 0 END) AS nguoi_thue,
        SUM(CASE WHEN vai_tro='employer' THEN 1 ELSE 0 END) AS chu_tro,
        SUM(CASE WHEN vai_tro='admin'    THEN 1 ELSE 0 END) AS quan_tri,
        SUM(CASE WHEN con_hoat_dong=1    THEN 1 ELSE 0 END) AS hoat_dong,
        SUM(CASE WHEN con_hoat_dong=0    THEN 1 ELSE 0 END) AS bi_khoa
    FROM nguoi_dung;
END
GO

CREATE OR ALTER PROCEDURE sp_AdminChiTietNguoiDung @ma_nd INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT n.*, (SELECT COUNT(*) FROM phong_tro p WHERE p.ma_chu_tro=n.ma_nd) AS so_tin
    FROM nguoi_dung n WHERE n.ma_nd=@ma_nd;
END
GO

CREATE OR ALTER PROCEDURE sp_AdminCapNhatTrangThaiNguoiDung @ma_nd INT, @con_hoat_dong BIT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE nguoi_dung SET con_hoat_dong=@con_hoat_dong, ngay_cap_nhat=GETDATE() WHERE ma_nd=@ma_nd;
END
GO

-- ============================================================
-- ADMIN - Báo cáo & Dashboard
-- ============================================================

CREATE OR ALTER PROCEDURE sp_AdminBaoCaoTongQuan AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @thang_dau DATETIME2 = DATEADD(DAY, 1-DAY(GETDATE()), CAST(GETDATE() AS DATE));
    SELECT
        (SELECT COUNT(*) FROM phong_tro)                                       AS tong_tin,
        (SELECT COUNT(*) FROM nguoi_dung)                                      AS tong_nguoi_dung,
        (SELECT ISNULL(SUM(luot_xem),0) FROM phong_tro)                        AS tong_luot_xem,
        (SELECT ISNULL(SUM(so_lien_he),0) FROM phong_tro)                      AS tong_lien_he,
        (SELECT COUNT(*) FROM phong_tro  WHERE ngay_tao>=@thang_dau)           AS tin_moi_thang,
        (SELECT COUNT(*) FROM nguoi_dung WHERE ngay_tao>=@thang_dau)           AS user_moi_thang;
END
GO

CREATE OR ALTER PROCEDURE sp_AdminThongKeTinDangTheoThang @tu_ngay DATE, @den_ngay DATE AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        FORMAT(DATEFROMPARTS(YEAR(ngay_tao),MONTH(ngay_tao),1),'T M/yy') AS thang_label,
        CAST(DATEFROMPARTS(YEAR(ngay_tao),MONTH(ngay_tao),1) AS VARCHAR(10)) AS thang_date,
        COUNT(*) AS tong_dang,
        SUM(CASE WHEN trang_thai='approved' THEN 1 ELSE 0 END) AS duoc_duyet,
        SUM(CASE WHEN trang_thai='rejected' THEN 1 ELSE 0 END) AS tu_choi
    FROM phong_tro WHERE CAST(ngay_tao AS DATE) BETWEEN @tu_ngay AND @den_ngay
    GROUP BY YEAR(ngay_tao),MONTH(ngay_tao) ORDER BY YEAR(ngay_tao),MONTH(ngay_tao);
END
GO

CREATE OR ALTER PROCEDURE sp_AdminThongKeNguoiDungTheoThang @tu_ngay DATE, @den_ngay DATE AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        FORMAT(DATEFROMPARTS(YEAR(ngay_tao),MONTH(ngay_tao),1),'T M/yy') AS thang_label,
        CAST(DATEFROMPARTS(YEAR(ngay_tao),MONTH(ngay_tao),1) AS VARCHAR(10)) AS thang_date,
        SUM(CASE WHEN vai_tro='user'     THEN 1 ELSE 0 END) AS nguoi_thue,
        SUM(CASE WHEN vai_tro='employer' THEN 1 ELSE 0 END) AS chu_tro
    FROM nguoi_dung WHERE CAST(ngay_tao AS DATE) BETWEEN @tu_ngay AND @den_ngay
    GROUP BY YEAR(ngay_tao),MONTH(ngay_tao) ORDER BY YEAR(ngay_tao),MONTH(ngay_tao);
END
GO

CREATE OR ALTER PROCEDURE sp_AdminThongKeLoaiPhong AS
BEGIN
    SET NOCOUNT ON;
    SELECT loai_phong, COUNT(*) AS so_luong FROM phong_tro GROUP BY loai_phong ORDER BY so_luong DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_AdminTopThanhPho @gioi_han INT=6 AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@gioi_han) tinh_thanh, COUNT(*) AS so_luong
    FROM phong_tro GROUP BY tinh_thanh ORDER BY so_luong DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_AdminTopChuTro @gioi_han INT=5 AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@gioi_han) n.ho_ten,
        COUNT(p.ma_phong) AS so_tin,
        ISNULL(SUM(p.luot_xem),0) AS tong_luot_xem,
        ISNULL(SUM(p.so_lien_he),0) AS tong_lien_he
    FROM nguoi_dung n JOIN phong_tro p ON p.ma_chu_tro=n.ma_nd
    WHERE n.vai_tro='employer'
    GROUP BY n.ma_nd, n.ho_ten ORDER BY tong_luot_xem DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_AdminTongQuan AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM nguoi_dung WHERE vai_tro!='admin') AS tong_nguoi_dung,
        (SELECT COUNT(*) FROM nguoi_dung WHERE vai_tro!='admin' AND CAST(ngay_tao AS DATE)=CAST(GETDATE() AS DATE)) AS nguoi_dung_hom_nay,
        (SELECT COUNT(*) FROM phong_tro) AS tong_tin_dang,
        (SELECT COUNT(*) FROM phong_tro WHERE CAST(ngay_tao AS DATE)=CAST(GETDATE() AS DATE)) AS tin_dang_hom_nay,
        (SELECT COUNT(*) FROM phong_tro WHERE trang_thai='pending') AS cho_duyet,
        (SELECT COUNT(*) FROM phong_tro WHERE trang_thai='rejected' AND ngay_cap_nhat>=DATEADD(DAY,-7,GETDATE())) AS tu_choi_7_ngay;

    SELECT TOP 5 p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.gia_thue, p.ngay_tao, n.ho_ten AS ten_chu_tro
    FROM phong_tro p JOIN nguoi_dung n ON n.ma_nd=p.ma_chu_tro
    WHERE p.trang_thai='pending' ORDER BY p.ngay_tao ASC;

    SELECT TOP 5 ma_nd, ho_ten, tai_khoan, vai_tro, ngay_tao
    FROM nguoi_dung WHERE vai_tro!='admin' ORDER BY ngay_tao DESC;
END
GO

-- ============================================================
-- FORGOT PASSWORD
-- ============================================================

-- Bước 1: Xác minh tài khoản + SĐT
CREATE OR ALTER PROCEDURE sp_XacMinhQuenMatKhau
    @tai_khoan NVARCHAR(150), @dien_thoai NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ma_nd, ho_ten, tai_khoan
    FROM nguoi_dung
    WHERE tai_khoan = @tai_khoan
      AND dien_thoai = @dien_thoai
      AND con_hoat_dong = 1;
END
GO

-- Bước 2: Đặt mật khẩu mới theo ma_nd
CREATE OR ALTER PROCEDURE sp_DatLaiMatKhau
    @ma_nd INT, @mat_khau_moi NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE nguoi_dung
    SET mat_khau = @mat_khau_moi, ngay_cap_nhat = GETDATE()
    WHERE ma_nd = @ma_nd;
END
GO

-- ============================================================
-- GOOGLE OAUTH
-- ============================================================

-- Thêm cột google_id nếu chưa có
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('nguoi_dung') AND name = 'google_id')
    ALTER TABLE nguoi_dung ADD google_id NVARCHAR(100) NULL;
GO

CREATE OR ALTER PROCEDURE sp_DangNhapGoogle
    @google_id    NVARCHAR(100),
    @ho_ten       NVARCHAR(100),
    @email        NVARCHAR(100),
    @anh_dai_dien NVARCHAR(500) = NULL,
    @vai_tro      NVARCHAR(20)  = 'user'
AS
BEGIN
    SET NOCOUNT ON;

    -- Tìm theo google_id + role (2 record riêng biệt cho cùng 1 gmail)
    IF EXISTS (SELECT 1 FROM nguoi_dung WHERE google_id = @google_id AND vai_tro = @vai_tro)
    BEGIN
        UPDATE nguoi_dung SET ho_ten = @ho_ten, anh_dai_dien = @anh_dai_dien
        WHERE google_id = @google_id AND vai_tro = @vai_tro;
        SELECT * FROM nguoi_dung WHERE google_id = @google_id AND vai_tro = @vai_tro;
        RETURN;
    END

    -- tai_khoan = email + '_' + role để tránh trùng unique constraint
    DECLARE @tai_khoan NVARCHAR(120) = @email + '_' + @vai_tro;

    IF EXISTS (SELECT 1 FROM nguoi_dung WHERE tai_khoan = @tai_khoan)
    BEGIN
        UPDATE nguoi_dung SET google_id = @google_id, anh_dai_dien = @anh_dai_dien
        WHERE tai_khoan = @tai_khoan;
        SELECT * FROM nguoi_dung WHERE tai_khoan = @tai_khoan;
        RETURN;
    END

    -- Tạo record mới với role tương ứng
    INSERT INTO nguoi_dung (ho_ten, tai_khoan, mat_khau, vai_tro, google_id, anh_dai_dien)
    VALUES (@ho_ten, @tai_khoan, '', @vai_tro, @google_id, @anh_dai_dien);

    SELECT * FROM nguoi_dung WHERE ma_nd = SCOPE_IDENTITY();
END
GO
