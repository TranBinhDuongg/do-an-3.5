-- ============================================================
-- PhòngTrọVN - Database Schema (SQL Server / T-SQL)
-- ============================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'doan35')
    CREATE DATABASE doan35;
GO

USE doan35;
GO

-- ------------------------------------------------------------
-- 1. NGUOI_DUNG (người dùng)
-- ------------------------------------------------------------
CREATE TABLE nguoi_dung (
    ma_nd          INT IDENTITY(1,1) PRIMARY KEY,
    ho_ten         NVARCHAR(100)  NOT NULL,
    tai_khoan      NVARCHAR(150)  NOT NULL UNIQUE,
    dien_thoai     NVARCHAR(20),
    mat_khau       NVARCHAR(255)  NOT NULL,
    vai_tro        NVARCHAR(10)   NOT NULL DEFAULT 'user'
                                  CHECK (vai_tro IN ('user','employer','admin')),
    anh_dai_dien   NVARCHAR(MAX),
    con_hoat_dong  BIT            NOT NULL DEFAULT 1,
    ngay_tao       DATETIME2      NOT NULL DEFAULT GETDATE(),
    ngay_cap_nhat  DATETIME2      NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- 2. GOI_DANG_TIN (gói đăng tin)
-- ------------------------------------------------------------
CREATE TABLE goi_dang_tin (
    ma_goi        INT IDENTITY(1,1) PRIMARY KEY,
    ten_goi       NVARCHAR(100)  NOT NULL,
    gia           DECIMAL(12,0)  NOT NULL,
    so_ngay       INT            NOT NULL,
    gioi_han_tin  INT            NOT NULL DEFAULT 1,
    noi_bat       BIT            NOT NULL DEFAULT 0,
    mo_ta         NVARCHAR(MAX),
    duyet_tu_dong BIT            NOT NULL DEFAULT 0,
    so_anh_toi_da INT            NOT NULL DEFAULT 5,
    luot_day_tin  INT            NOT NULL DEFAULT 0,
    huy_hieu      NVARCHAR(50)   NULL,
    muc_do_uu_tien INT           NOT NULL DEFAULT 3,
    ho_tro_video  BIT            NOT NULL DEFAULT 0,
    ngay_tao      DATETIME2      NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- 3. NGUOI_DUNG_GOI (người dùng - gói)
-- ------------------------------------------------------------
CREATE TABLE nguoi_dung_goi (
    ma            INT IDENTITY(1,1) PRIMARY KEY,
    ma_nd         INT       NOT NULL,
    ma_goi        INT       NOT NULL,
    bat_dau       DATETIME2 NOT NULL DEFAULT GETDATE(),
    het_han       DATETIME2 NOT NULL,
    con_hieu_luc  BIT       NOT NULL DEFAULT 1,
    tin_da_dang   INT       NOT NULL DEFAULT 0,
    day_tin_da_dung INT     NOT NULL DEFAULT 0,
    FOREIGN KEY (ma_nd)  REFERENCES nguoi_dung(ma_nd),
    FOREIGN KEY (ma_goi) REFERENCES goi_dang_tin(ma_goi)
);
GO

-- ------------------------------------------------------------
-- 4. PHONG_TRO (tin đăng phòng trọ)
-- ------------------------------------------------------------
CREATE TABLE phong_tro (
    ma_phong      INT IDENTITY(1,1) PRIMARY KEY,
    ma_chu_tro    INT            NOT NULL,
    tieu_de       NVARCHAR(200)  NOT NULL,
    loai_phong    NVARCHAR(50)   NOT NULL
                                 CHECK (loai_phong IN (N'Phòng trọ',N'Chung cư mini',N'Nhà nguyên căn',N'Studio',N'Ký túc xá',N'Căn hộ dịch vụ')),
    tinh_thanh    NVARCHAR(100)  NOT NULL,
    quan_huyen    NVARCHAR(100),
    dia_chi       NVARCHAR(300)  NOT NULL,
    gia_thue      DECIMAL(12,0)  NOT NULL,
    tien_coc      DECIMAL(12,0),
    dien_tich     DECIMAL(6,1)   NOT NULL,
    mo_ta         NVARCHAR(MAX),
    ten_lien_he   NVARCHAR(100)  NOT NULL,
    sdt_lien_he   NVARCHAR(20)   NOT NULL,
    email_lien_he NVARCHAR(150),
    hien_sdt      BIT            NOT NULL DEFAULT 1,
    trang_thai    NVARCHAR(20)   NOT NULL DEFAULT 'pending'
                                 CHECK (trang_thai IN ('pending','approved','rejected','paused')),
    con_phong     BIT            NOT NULL DEFAULT 1,
    noi_bat       BIT            NOT NULL DEFAULT 0,
    luot_xem      INT            NOT NULL DEFAULT 0,
    so_lien_he    INT            NOT NULL DEFAULT 0,
    ngay_up_top   DATETIME2      NOT NULL DEFAULT GETDATE(),
    video_url     NVARCHAR(255)  NULL,
    ngay_tao      DATETIME2      NOT NULL DEFAULT GETDATE(),
    ngay_cap_nhat DATETIME2      NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ma_chu_tro) REFERENCES nguoi_dung(ma_nd)
);
GO

-- Trigger tự cập nhật ngay_cap_nhat
CREATE TRIGGER trg_cap_nhat_phong
ON phong_tro AFTER UPDATE AS
    UPDATE phong_tro SET ngay_cap_nhat = GETDATE()
    WHERE ma_phong IN (SELECT ma_phong FROM inserted);
GO

-- ------------------------------------------------------------
-- 5. ANH_PHONG (ảnh phòng)
-- ------------------------------------------------------------
CREATE TABLE anh_phong (
    ma_anh    INT IDENTITY(1,1) PRIMARY KEY,
    ma_phong  INT           NOT NULL,
    duong_dan NVARCHAR(MAX) NOT NULL,
    la_anh_bia BIT          NOT NULL DEFAULT 0,
    thu_tu    INT           NOT NULL DEFAULT 0,
    FOREIGN KEY (ma_phong) REFERENCES phong_tro(ma_phong) ON DELETE CASCADE
);
GO

-- ------------------------------------------------------------
-- 6. TIEN_ICH (tiện ích)
-- ------------------------------------------------------------
CREATE TABLE tien_ich (
    ma_tien_ich   INT IDENTITY(1,1) PRIMARY KEY,
    ma_khoa       NVARCHAR(50)  NOT NULL UNIQUE,
    ten_hien_thi  NVARCHAR(100) NOT NULL,
    bieu_tuong    NVARCHAR(10)
);
GO

-- ------------------------------------------------------------
-- 7. TIEN_ICH_PHONG (tiện ích phòng)
-- ------------------------------------------------------------
CREATE TABLE tien_ich_phong (
    ma_phong    INT NOT NULL,
    ma_tien_ich INT NOT NULL,
    PRIMARY KEY (ma_phong, ma_tien_ich),
    FOREIGN KEY (ma_phong)    REFERENCES phong_tro(ma_phong) ON DELETE CASCADE,
    FOREIGN KEY (ma_tien_ich) REFERENCES tien_ich(ma_tien_ich)
);
GO

-- ------------------------------------------------------------
-- 8. YEU_THICH (yêu thích)
-- ------------------------------------------------------------
CREATE TABLE yeu_thich (
    ma_nd     INT       NOT NULL,
    ma_phong  INT       NOT NULL,
    ngay_tao  DATETIME2 NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (ma_nd, ma_phong),
    FOREIGN KEY (ma_nd)   REFERENCES nguoi_dung(ma_nd),
    FOREIGN KEY (ma_phong) REFERENCES phong_tro(ma_phong)
);
GO

-- ------------------------------------------------------------
-- 9. CUOC_TRO_CHUYEN & TIN_NHAN
-- ------------------------------------------------------------
CREATE TABLE cuoc_tro_chuyen (
    ma_ctc     INT IDENTITY(1,1) PRIMARY KEY,
    ma_nd      INT       NOT NULL,
    ma_chu_tro INT       NOT NULL,
    ma_phong   INT,
    ngay_tao   DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ma_nd)      REFERENCES nguoi_dung(ma_nd),
    FOREIGN KEY (ma_chu_tro) REFERENCES nguoi_dung(ma_nd),
    FOREIGN KEY (ma_phong)   REFERENCES phong_tro(ma_phong)
);
GO

CREATE TABLE tin_nhan (
    ma_tn         INT IDENTITY(1,1) PRIMARY KEY,
    ma_ctc        INT           NOT NULL,
    ma_nguoi_gui  INT           NOT NULL,
    noi_dung      NVARCHAR(MAX) NOT NULL,
    da_doc        BIT           NOT NULL DEFAULT 0,
    ngay_tao      DATETIME2     NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ma_ctc)       REFERENCES cuoc_tro_chuyen(ma_ctc) ON DELETE CASCADE,
    FOREIGN KEY (ma_nguoi_gui) REFERENCES nguoi_dung(ma_nd)
);
GO

-- ------------------------------------------------------------
-- 10. THONG_BAO (thông báo)
-- ------------------------------------------------------------
CREATE TABLE thong_bao (
    ma_tb      INT IDENTITY(1,1) PRIMARY KEY,
    ma_nd      INT           NOT NULL,
    bieu_tuong NVARCHAR(10),
    noi_dung   NVARCHAR(MAX) NOT NULL,
    da_doc     BIT           NOT NULL DEFAULT 0,
    ngay_tao   DATETIME2     NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ma_nd) REFERENCES nguoi_dung(ma_nd)
);
GO
