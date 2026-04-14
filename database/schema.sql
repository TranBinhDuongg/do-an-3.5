-- ============================================================
-- PhòngTrọVN - Database Schema (SQL Server / T-SQL)
-- ============================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'doan35')
    CREATE DATABASE doan35;
GO

USE doan35;
GO

-- ------------------------------------------------------------
-- 1. USERS
-- ------------------------------------------------------------
CREATE TABLE users (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    name       NVARCHAR(100)  NOT NULL,
    username   NVARCHAR(150)  NOT NULL UNIQUE,
    phone      NVARCHAR(20),
    password   NVARCHAR(255)  NOT NULL,
    role       NVARCHAR(10)   NOT NULL DEFAULT 'user'
                              CHECK (role IN ('user','employer','admin')),
    avatar_url NVARCHAR(500),
    is_active  BIT            NOT NULL DEFAULT 1,
    created_at DATETIME2      NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2      NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- 2. PACKAGES (gói đăng tin)
-- ------------------------------------------------------------
CREATE TABLE packages (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    name          NVARCHAR(100)  NOT NULL,
    price         DECIMAL(12,0)  NOT NULL,
    duration_days INT            NOT NULL,
    post_limit    INT            NOT NULL DEFAULT 1,
    is_featured   BIT            NOT NULL DEFAULT 0,
    description   NVARCHAR(MAX),
    created_at    DATETIME2      NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- 3. USER PACKAGES
-- ------------------------------------------------------------
CREATE TABLE user_packages (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    user_id    INT       NOT NULL,
    package_id INT       NOT NULL,
    started_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    expires_at DATETIME2 NOT NULL,
    is_active  BIT       NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id)    REFERENCES users(id),
    FOREIGN KEY (package_id) REFERENCES packages(id)
);
GO

-- ------------------------------------------------------------
-- 4. ROOMS (tin đăng phòng trọ)
-- ------------------------------------------------------------
CREATE TABLE rooms (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    employer_id    INT            NOT NULL,
    title          NVARCHAR(200)  NOT NULL,
    type           NVARCHAR(50)   NOT NULL
                                  CHECK (type IN (N'Phòng trọ',N'Chung cư mini',N'Nhà nguyên căn',N'Studio',N'Ký túc xá',N'Căn hộ dịch vụ')),
    city           NVARCHAR(100)  NOT NULL,
    district       NVARCHAR(100),
    address        NVARCHAR(300)  NOT NULL,
    price          DECIMAL(12,0)  NOT NULL,
    deposit        DECIMAL(12,0),
    area           DECIMAL(6,1)   NOT NULL,
    description    NVARCHAR(MAX),
    contact_name   NVARCHAR(100)  NOT NULL,
    contact_phone  NVARCHAR(20)   NOT NULL,
    contact_email  NVARCHAR(150),
    show_phone     BIT            NOT NULL DEFAULT 1,
    status         NVARCHAR(20)   NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','approved','rejected','paused')),
    is_available   BIT            NOT NULL DEFAULT 1,
    is_featured    BIT            NOT NULL DEFAULT 0,
    views          INT            NOT NULL DEFAULT 0,
    contacts_count INT            NOT NULL DEFAULT 0,
    created_at     DATETIME2      NOT NULL DEFAULT GETDATE(),
    updated_at     DATETIME2      NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (employer_id) REFERENCES users(id)
);
GO

-- Trigger tự cập nhật updated_at
CREATE TRIGGER trg_rooms_updated
ON rooms AFTER UPDATE AS
    UPDATE rooms SET updated_at = GETDATE()
    WHERE id IN (SELECT id FROM inserted);
GO

-- ------------------------------------------------------------
-- 5. ROOM IMAGES
-- ------------------------------------------------------------
CREATE TABLE room_images (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    room_id    INT           NOT NULL,
    url        NVARCHAR(500) NOT NULL,
    is_cover   BIT           NOT NULL DEFAULT 0,
    sort_order INT           NOT NULL DEFAULT 0,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
GO

-- ------------------------------------------------------------
-- 6. AMENITIES
-- ------------------------------------------------------------
CREATE TABLE amenities (
    id       INT IDENTITY(1,1) PRIMARY KEY,
    key_name NVARCHAR(50)  NOT NULL UNIQUE,
    label    NVARCHAR(100) NOT NULL,
    icon     NVARCHAR(10)
);
GO

-- ------------------------------------------------------------
-- 7. ROOM AMENITIES
-- ------------------------------------------------------------
CREATE TABLE room_amenities (
    room_id    INT NOT NULL,
    amenity_id INT NOT NULL,
    PRIMARY KEY (room_id, amenity_id),
    FOREIGN KEY (room_id)    REFERENCES rooms(id)     ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(id)
);
GO

-- ------------------------------------------------------------
-- 8. FAVORITES
-- ------------------------------------------------------------
CREATE TABLE favorites (
    user_id    INT       NOT NULL,
    room_id    INT       NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (user_id, room_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);
GO

-- ------------------------------------------------------------
-- 9. CONVERSATIONS & MESSAGES
-- ------------------------------------------------------------
CREATE TABLE conversations (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT       NOT NULL,
    employer_id INT       NOT NULL,
    room_id     INT,
    created_at  DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id)     REFERENCES users(id),
    FOREIGN KEY (employer_id) REFERENCES users(id),
    FOREIGN KEY (room_id)     REFERENCES rooms(id)
);
GO

CREATE TABLE messages (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    conversation_id INT           NOT NULL,
    sender_id       INT           NOT NULL,
    content         NVARCHAR(MAX) NOT NULL,
    is_read         BIT           NOT NULL DEFAULT 0,
    created_at      DATETIME2     NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id)       REFERENCES users(id)
);
GO

-- ------------------------------------------------------------
-- 10. NOTIFICATIONS
-- ------------------------------------------------------------
CREATE TABLE notifications (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    user_id    INT           NOT NULL,
    icon       NVARCHAR(10),
    content    NVARCHAR(MAX) NOT NULL,
    is_read    BIT           NOT NULL DEFAULT 0,
    created_at DATETIME2     NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
GO
