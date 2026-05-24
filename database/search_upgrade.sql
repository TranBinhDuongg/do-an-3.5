USE doan35;
GO

-- ============================================================
-- FULL-TEXT SEARCH SETUP
-- Chạy phần này 1 lần để kích hoạt Full-Text Search
-- Nếu chưa cài FTS, hệ thống vẫn hoạt động bằng LIKE fallback
-- ============================================================

-- Bước 1: Tạo Full-Text Catalog
IF NOT EXISTS (SELECT 1 FROM sys.fulltext_catalogs WHERE name = 'ftCatalog_PhongTro')
    CREATE FULLTEXT CATALOG ftCatalog_PhongTro AS DEFAULT;
GO

-- Bước 2: Tạo Full-Text Index trên bảng phong_tro (tự động tìm PK)
DECLARE @pk_index NVARCHAR(200);
SELECT @pk_index = i.name 
FROM sys.indexes i 
WHERE i.object_id = OBJECT_ID('phong_tro') AND i.is_primary_key = 1;

IF @pk_index IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('phong_tro')
)
BEGIN
    DECLARE @sql NVARCHAR(MAX) = N'CREATE FULLTEXT INDEX ON phong_tro(tieu_de, dia_chi, mo_ta) KEY INDEX ' 
        + QUOTENAME(@pk_index) + N' ON ftCatalog_PhongTro WITH CHANGE_TRACKING AUTO';
    EXEC sp_executesql @sql;
    PRINT N'✅ Full-Text Index đã tạo thành công trên bảng phong_tro';
END
ELSE
    PRINT N'ℹ️ Full-Text Index đã tồn tại hoặc không tìm thấy Primary Key';
GO

-- ============================================================
-- sp_LayDanhSachPhong (nâng cấp: FTS + Relevance Scoring)
-- Tính điểm liên quan theo trọng số:
--   Tiêu đề: +100  |  Địa chỉ: +60  |  Quận/huyện: +40
--   Mô tả: +30     |  Loại phòng: +25  |  Tỉnh/thành: +20
--   Chủ nhà: +15   |  FTS rank: +0~1000
-- ============================================================
CREATE OR ALTER PROCEDURE sp_LayDanhSachPhong
    @tu_khoa NVARCHAR(200)=NULL, @tinh_thanh NVARCHAR(100)=NULL, @loai_phong NVARCHAR(50)=NULL,
    @gia_min DECIMAL(12,0)=NULL, @gia_max DECIMAL(12,0)=NULL, @dt_min DECIMAL(6,1)=NULL,
    @sap_xep NVARCHAR(20)='newest', @gioi_han INT=20, @bo_qua INT=0
AS
BEGIN
    SET NOCOUNT ON;

    -- Chuẩn bị keyword cho LIKE (nối từ bằng % để tìm linh hoạt)
    DECLARE @kw NVARCHAR(400) = NULL;
    IF @tu_khoa IS NOT NULL AND LEN(LTRIM(RTRIM(@tu_khoa))) > 0
        SET @kw = REPLACE(LTRIM(RTRIM(@tu_khoa)), ' ', '%');

    -- Full-Text Search ranking (graceful fallback nếu chưa cài FTS)
    CREATE TABLE #fts (ma_phong INT PRIMARY KEY, diem INT);
    IF @kw IS NOT NULL
    BEGIN
        BEGIN TRY
            INSERT INTO #fts
            SELECT [KEY], [RANK] FROM FREETEXTTABLE(phong_tro, (tieu_de, dia_chi, mo_ta), @tu_khoa);
        END TRY
        BEGIN CATCH END CATCH -- FTS chưa sẵn sàng → dùng LIKE
    END

    SELECT
        p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.quan_huyen, p.dia_chi,
        p.gia_thue, p.dien_tich, p.con_phong, p.noi_bat, p.luot_xem, p.ngay_tao, p.ngay_up_top,
        ISNULL(g.muc_do_uu_tien, 3) AS muc_do_uu_tien, g.huy_hieu,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong AND ap.la_anh_bia=1) AS anh_bia,
        (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong ORDER BY ap.thu_tu) AS anh_dau_tien,
        -- Điểm liên quan (Relevance Score)
        CASE WHEN @kw IS NOT NULL THEN
            ISNULL(ft.diem, 0)
            + CASE WHEN p.tieu_de LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI THEN 100 ELSE 0 END
            + CASE WHEN p.dia_chi LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI THEN 60 ELSE 0 END
            + CASE WHEN p.mo_ta LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI THEN 30 ELSE 0 END
            + CASE WHEN p.quan_huyen LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI THEN 40 ELSE 0 END
            + CASE WHEN p.tinh_thanh LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI THEN 20 ELSE 0 END
            + CASE WHEN p.loai_phong LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI THEN 25 ELSE 0 END
            + CASE WHEN n.ho_ten LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI THEN 15 ELSE 0 END
        ELSE 0 END AS diem_lien_quan
    FROM phong_tro p
    LEFT JOIN nguoi_dung_goi ndg ON ndg.ma_nd = p.ma_chu_tro AND ndg.con_hieu_luc = 1
    LEFT JOIN goi_dang_tin g ON g.ma_goi = ndg.ma_goi
    LEFT JOIN nguoi_dung n ON n.ma_nd = p.ma_chu_tro
    LEFT JOIN #fts ft ON ft.ma_phong = p.ma_phong
    WHERE p.trang_thai='approved'
      AND (@kw IS NULL
        OR ft.ma_phong IS NOT NULL
        OR p.tieu_de LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR p.dia_chi LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR p.mo_ta LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR p.quan_huyen LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR p.tinh_thanh LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR p.loai_phong LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR n.ho_ten LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR EXISTS (SELECT 1 FROM tien_ich_phong tip JOIN tien_ich ti ON ti.ma_tien_ich = tip.ma_tien_ich
                   WHERE tip.ma_phong = p.ma_phong AND ti.ten_hien_thi LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI)
      )
      AND (@tinh_thanh IS NULL OR p.tinh_thanh=@tinh_thanh)
      AND (@loai_phong IS NULL OR p.loai_phong=@loai_phong)
      AND (@gia_min    IS NULL OR p.gia_thue>=@gia_min)
      AND (@gia_max    IS NULL OR p.gia_thue<=@gia_max)
      AND (@dt_min     IS NULL OR p.dien_tich>=@dt_min)
    ORDER BY
        CASE WHEN @sap_xep='relevance'  THEN diem_lien_quan END DESC,
        CASE WHEN @sap_xep='relevance'  THEN p.ngay_tao END DESC,
        CASE WHEN @sap_xep='newest'     THEN ISNULL(g.muc_do_uu_tien, 3) END ASC,
        CASE WHEN @sap_xep='newest'     THEN p.ngay_up_top END DESC,
        CASE WHEN @sap_xep='price-asc'  THEN p.gia_thue  END ASC,
        CASE WHEN @sap_xep='price-desc' THEN p.gia_thue  END DESC,
        CASE WHEN @sap_xep='area-desc'  THEN p.dien_tich END DESC
    OFFSET @bo_qua ROWS FETCH NEXT @gioi_han ROWS ONLY;

    DROP TABLE #fts;
END
GO

-- ============================================================
-- sp_DemPhong (nâng cấp: FTS matching tương thích)
-- ============================================================
CREATE OR ALTER PROCEDURE sp_DemPhong
    @tu_khoa NVARCHAR(200)=NULL, @tinh_thanh NVARCHAR(100)=NULL, @loai_phong NVARCHAR(50)=NULL,
    @gia_min DECIMAL(12,0)=NULL, @gia_max DECIMAL(12,0)=NULL, @dt_min DECIMAL(6,1)=NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @kw NVARCHAR(400) = NULL;
    IF @tu_khoa IS NOT NULL AND LEN(LTRIM(RTRIM(@tu_khoa))) > 0
        SET @kw = REPLACE(LTRIM(RTRIM(@tu_khoa)), ' ', '%');

    CREATE TABLE #fts_c (ma_phong INT PRIMARY KEY);
    IF @kw IS NOT NULL
    BEGIN
        BEGIN TRY
            INSERT INTO #fts_c SELECT [KEY] FROM FREETEXTTABLE(phong_tro, (tieu_de, dia_chi, mo_ta), @tu_khoa);
        END TRY
        BEGIN CATCH END CATCH
    END

    SELECT COUNT(*) AS tong_so FROM phong_tro p
    LEFT JOIN nguoi_dung n ON n.ma_nd = p.ma_chu_tro
    LEFT JOIN #fts_c ft ON ft.ma_phong = p.ma_phong
    WHERE p.trang_thai='approved'
      AND (@kw IS NULL
        OR ft.ma_phong IS NOT NULL
        OR p.tieu_de LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR p.dia_chi LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR p.mo_ta LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR p.quan_huyen LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR p.tinh_thanh LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR p.loai_phong LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR n.ho_ten LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI
        OR EXISTS (SELECT 1 FROM tien_ich_phong tip JOIN tien_ich ti ON ti.ma_tien_ich = tip.ma_tien_ich
                   WHERE tip.ma_phong = p.ma_phong AND ti.ten_hien_thi LIKE '%'+@kw+'%' COLLATE Vietnamese_CI_AI)
      )
      AND (@tinh_thanh IS NULL OR p.tinh_thanh=@tinh_thanh)
      AND (@loai_phong IS NULL OR p.loai_phong=@loai_phong)
      AND (@gia_min    IS NULL OR p.gia_thue>=@gia_min)
      AND (@gia_max    IS NULL OR p.gia_thue<=@gia_max)
      AND (@dt_min     IS NULL OR p.dien_tich>=@dt_min);

    DROP TABLE #fts_c;
END
GO

-- ============================================================
-- sp_GoiYTimKiem (Autocomplete / Gợi ý tìm kiếm)
-- Trả về gợi ý theo 3 loại: phòng (room), khu vực (area), loại (type)
-- ============================================================
CREATE OR ALTER PROCEDURE sp_GoiYTimKiem
    @tu_khoa NVARCHAR(200), @gioi_han INT = 8
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @kw NVARCHAR(400) = REPLACE(LTRIM(RTRIM(@tu_khoa)), ' ', '%');

    SELECT TOP (@gioi_han) goi_y, loai FROM (
        -- Gợi ý theo tiêu đề phòng
        SELECT DISTINCT p.tieu_de AS goi_y, N'room' AS loai, 1 AS thu_tu
        FROM phong_tro p
        WHERE p.trang_thai = 'approved'
          AND p.tieu_de LIKE N'%'+@kw+N'%' COLLATE Vietnamese_CI_AI

        UNION

        -- Gợi ý theo khu vực (quận/huyện + tỉnh/thành)
        SELECT DISTINCT
            CASE WHEN p.quan_huyen IS NOT NULL
                THEN p.quan_huyen + N', ' + p.tinh_thanh
                ELSE p.tinh_thanh END,
            N'area', 2
        FROM phong_tro p
        WHERE p.trang_thai = 'approved'
          AND (p.quan_huyen LIKE N'%'+@kw+N'%' COLLATE Vietnamese_CI_AI
            OR p.tinh_thanh LIKE N'%'+@kw+N'%' COLLATE Vietnamese_CI_AI)

        UNION

        -- Gợi ý theo loại phòng
        SELECT DISTINCT p.loai_phong, N'type', 3
        FROM phong_tro p
        WHERE p.trang_thai = 'approved'
          AND p.loai_phong LIKE N'%'+@kw+N'%' COLLATE Vietnamese_CI_AI
    ) AS combined
    ORDER BY thu_tu, goi_y;
END
GO
