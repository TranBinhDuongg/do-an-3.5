-- ============================================================
-- Bảng đánh giá phòng trọ
-- ============================================================
USE doan35;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'danh_gia')
BEGIN
  CREATE TABLE danh_gia (
    ma_dg         INT IDENTITY(1,1) PRIMARY KEY,
    ma_phong      INT           NOT NULL,
    ma_nd         INT           NOT NULL,
    so_sao        TINYINT       NOT NULL CHECK (so_sao BETWEEN 1 AND 5),
    noi_dung      NVARCHAR(MAX),
    ngay_tao      DATETIME2     NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ma_phong) REFERENCES phong_tro(ma_phong) ON DELETE CASCADE,
    FOREIGN KEY (ma_nd)    REFERENCES nguoi_dung(ma_nd),
    UNIQUE (ma_phong, ma_nd)   -- mỗi user chỉ đánh giá 1 lần
  );
END
GO
