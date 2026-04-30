USE doan35;
GO

-- ------------------------------------------------------------
-- VI_TIEN (ví tiền của người dùng)
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'vi_tien')
CREATE TABLE vi_tien (
    ma_vi         INT IDENTITY(1,1) PRIMARY KEY,
    ma_nd         INT            NOT NULL UNIQUE,
    so_du         DECIMAL(15,0)  NOT NULL DEFAULT 0,
    ngay_cap_nhat DATETIME2      NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ma_nd) REFERENCES nguoi_dung(ma_nd)
);
GO

-- Tạo ví mặc định cho tất cả employer hiện có
INSERT INTO vi_tien (ma_nd, so_du)
SELECT ma_nd, 0 FROM nguoi_dung
WHERE vai_tro = 'employer'
  AND ma_nd NOT IN (SELECT ma_nd FROM vi_tien);
GO

-- ------------------------------------------------------------
-- GIAO_DICH (lịch sử giao dịch)
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'giao_dich')
CREATE TABLE giao_dich (
    ma_gd         INT IDENTITY(1,1) PRIMARY KEY,
    ma_nd         INT            NOT NULL,
    loai          NVARCHAR(20)   NOT NULL CHECK (loai IN ('topup','payment','refund')),
    so_tien       DECIMAL(15,0)  NOT NULL,  -- luôn dương
    mo_ta         NVARCHAR(300)  NOT NULL,
    trang_thai    NVARCHAR(20)   NOT NULL DEFAULT 'pending'
                                 CHECK (trang_thai IN ('pending','success','failed')),
    phuong_thuc   NVARCHAR(50),  -- 'bank','momo','zalo','card'
    ma_tham_chieu NVARCHAR(100), -- mã giao dịch ngân hàng / admin nhập
    ma_goi        INT            NULL,      -- nếu là payment mua gói
    ngay_tao      DATETIME2      NOT NULL DEFAULT GETDATE(),
    ngay_cap_nhat DATETIME2      NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ma_nd)  REFERENCES nguoi_dung(ma_nd),
    FOREIGN KEY (ma_goi) REFERENCES goi_dang_tin(ma_goi)
);
GO

-- Trigger tự tạo ví khi có employer mới đăng ký
IF NOT EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'trg_tao_vi_employer')
EXEC('
CREATE TRIGGER trg_tao_vi_employer
ON nguoi_dung AFTER INSERT AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO vi_tien (ma_nd, so_du)
    SELECT ma_nd, 0 FROM inserted
    WHERE vai_tro = ''employer''
      AND ma_nd NOT IN (SELECT ma_nd FROM vi_tien);
END
');
GO
