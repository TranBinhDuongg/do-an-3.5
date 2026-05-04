-- ============================================================
-- Booking, Contract, Deposit, Maintenance Schema
-- ============================================================
USE doan35;
GO

-- ------------------------------------------------------------
-- DAT_PHONG (yêu cầu đặt phòng / booking)
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'dat_phong')
CREATE TABLE dat_phong (
    ma_dp         INT IDENTITY(1,1) PRIMARY KEY,
    ma_phong      INT            NOT NULL,
    ma_nguoi_thue INT            NOT NULL,
    ma_chu_tro    INT            NOT NULL,
    ngay_bat_dau  DATE           NOT NULL,
    ngay_ket_thuc DATE           NOT NULL,
    tien_thue     DECIMAL(12,0)  NOT NULL,
    tien_coc      DECIMAL(12,0)  NOT NULL DEFAULT 0,
    trang_thai    NVARCHAR(20)   NOT NULL DEFAULT 'pending'
                                 CHECK (trang_thai IN ('pending','confirmed','rejected','active','ended','cancelled')),
    ghi_chu       NVARCHAR(500),
    ngay_tao      DATETIME2      NOT NULL DEFAULT GETDATE(),
    ngay_cap_nhat DATETIME2      NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ma_phong)      REFERENCES phong_tro(ma_phong),
    FOREIGN KEY (ma_nguoi_thue) REFERENCES nguoi_dung(ma_nd),
    FOREIGN KEY (ma_chu_tro)    REFERENCES nguoi_dung(ma_nd)
);
GO

-- ------------------------------------------------------------
-- HOP_DONG (hợp đồng thuê)
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'hop_dong')
CREATE TABLE hop_dong (
    ma_hd         INT IDENTITY(1,1) PRIMARY KEY,
    ma_dp         INT            NOT NULL UNIQUE,
    ma_phong      INT            NOT NULL,
    ma_nguoi_thue INT            NOT NULL,
    ma_chu_tro    INT            NOT NULL,
    ngay_bat_dau  DATE           NOT NULL,
    ngay_ket_thuc DATE           NOT NULL,
    tien_thue     DECIMAL(12,0)  NOT NULL,
    tien_coc      DECIMAL(12,0)  NOT NULL DEFAULT 0,
    dieu_khoan    NVARCHAR(MAX),
    trang_thai    NVARCHAR(20)   NOT NULL DEFAULT 'draft'
                                 CHECK (trang_thai IN ('draft','signed','terminated','expired')),
    chu_tro_ky    BIT            NOT NULL DEFAULT 0,
    nguoi_thue_ky BIT            NOT NULL DEFAULT 0,
    ngay_ky       DATETIME2,
    ngay_tao      DATETIME2      NOT NULL DEFAULT GETDATE(),
    ngay_cap_nhat DATETIME2      NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ma_dp)         REFERENCES dat_phong(ma_dp),
    FOREIGN KEY (ma_phong)      REFERENCES phong_tro(ma_phong),
    FOREIGN KEY (ma_nguoi_thue) REFERENCES nguoi_dung(ma_nd),
    FOREIGN KEY (ma_chu_tro)    REFERENCES nguoi_dung(ma_nd)
);
GO

-- ------------------------------------------------------------
-- BAO_CAO_SU_CO (báo cáo sự cố / bảo trì)
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'bao_cao_su_co')
CREATE TABLE bao_cao_su_co (
    ma_bc         INT IDENTITY(1,1) PRIMARY KEY,
    ma_hd         INT            NOT NULL,
    ma_phong      INT            NOT NULL,
    ma_nguoi_bao  INT            NOT NULL,
    tieu_de       NVARCHAR(200)  NOT NULL,
    mo_ta         NVARCHAR(MAX)  NOT NULL,
    muc_do        NVARCHAR(20)   NOT NULL DEFAULT 'medium'
                                 CHECK (muc_do IN ('low','medium','high','urgent')),
    trang_thai    NVARCHAR(20)   NOT NULL DEFAULT 'open'
                                 CHECK (trang_thai IN ('open','in_progress','resolved','closed')),
    phan_hoi      NVARCHAR(MAX),
    ngay_tao      DATETIME2      NOT NULL DEFAULT GETDATE(),
    ngay_cap_nhat DATETIME2      NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ma_hd)         REFERENCES hop_dong(ma_hd),
    FOREIGN KEY (ma_phong)      REFERENCES phong_tro(ma_phong),
    FOREIGN KEY (ma_nguoi_bao)  REFERENCES nguoi_dung(ma_nd)
);
GO

-- Trigger cập nhật ngay_cap_nhat cho dat_phong
IF NOT EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'trg_cap_nhat_dat_phong')
EXEC('
CREATE TRIGGER trg_cap_nhat_dat_phong
ON dat_phong AFTER UPDATE AS
    UPDATE dat_phong SET ngay_cap_nhat = GETDATE()
    WHERE ma_dp IN (SELECT ma_dp FROM inserted)
');
GO

-- Trigger cập nhật ngay_cap_nhat cho hop_dong
IF NOT EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'trg_cap_nhat_hop_dong')
EXEC('
CREATE TRIGGER trg_cap_nhat_hop_dong
ON hop_dong AFTER UPDATE AS
    UPDATE hop_dong SET ngay_cap_nhat = GETDATE()
    WHERE ma_hd IN (SELECT ma_hd FROM inserted)
');
GO
