USE doan35;
GO

-- ============================================================
-- AUTH PROCEDURES
-- ============================================================

-- Lấy user theo username để đăng nhập
CREATE OR ALTER PROCEDURE sp_GetUserByUsername
    @username NVARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, name, username, phone, password, role, avatar_url, is_active
    FROM users
    WHERE username = @username AND is_active = 1;
END
GO

-- Đăng ký user mới
CREATE OR ALTER PROCEDURE sp_RegisterUser
    @name     NVARCHAR(100),
    @username NVARCHAR(150),
    @phone    NVARCHAR(20),
    @password NVARCHAR(255),
    @role     NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra username đã tồn tại chưa
    IF EXISTS (SELECT 1 FROM users WHERE username = @username)
    BEGIN
        RAISERROR('USERNAME_EXISTS', 16, 1);
        RETURN;
    END

    INSERT INTO users (name, username, phone, password, role)
    OUTPUT INSERTED.id, INSERTED.name, INSERTED.username, INSERTED.role
    VALUES (@name, @username, @phone, @password, @role);
END
GO

-- ============================================================
-- PROFILE PROCEDURES
-- ============================================================

-- Lấy thông tin profile theo id
CREATE OR ALTER PROCEDURE sp_GetProfile
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, name, username, phone, role, avatar_url, created_at
    FROM users
    WHERE id = @id;
END
GO

-- Cập nhật thông tin cá nhân
CREATE OR ALTER PROCEDURE sp_UpdateProfile
    @id    INT,
    @name  NVARCHAR(100),
    @phone NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE users
    SET name = @name, phone = @phone, updated_at = GETDATE()
    WHERE id = @id;

    SELECT id, name, username, phone, role
    FROM users WHERE id = @id;
END
GO

-- Đổi mật khẩu
CREATE OR ALTER PROCEDURE sp_ChangePassword
    @id          INT,
    @newPassword NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE users
    SET password = @newPassword, updated_at = GETDATE()
    WHERE id = @id;
END
GO

-- Lấy mật khẩu hiện tại để verify
CREATE OR ALTER PROCEDURE sp_GetPasswordById
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT password FROM users WHERE id = @id;
END
GO

-- Cập nhật avatar
CREATE OR ALTER PROCEDURE sp_UpdateAvatar
    @id         INT,
    @avatar_url NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE users
    SET avatar_url = @avatar_url, updated_at = GETDATE()
    WHERE id = @id;

    SELECT id, name, username, phone, role, avatar_url
    FROM users WHERE id = @id;
END
GO

-- ============================================================
-- ROOMS PROCEDURES (người thuê)
-- ============================================================

-- Lấy danh sách phòng đã duyệt (có filter)
CREATE OR ALTER PROCEDURE sp_GetRooms
    @keyword  NVARCHAR(200) = NULL,
    @city     NVARCHAR(100) = NULL,
    @type     NVARCHAR(50)  = NULL,
    @minPrice DECIMAL(12,0) = NULL,
    @maxPrice DECIMAL(12,0) = NULL,
    @minArea  DECIMAL(6,1)  = NULL,
    @sort     NVARCHAR(20)  = 'newest',
    @limit    INT           = 20,
    @offset   INT           = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        r.id, r.title, r.type, r.city, r.district, r.address,
        r.price, r.area, r.is_available, r.is_featured,
        r.views, r.created_at,
        (SELECT TOP 1 url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1) AS cover_image,
        (SELECT TOP 1 url FROM room_images ri WHERE ri.room_id = r.id ORDER BY ri.sort_order) AS first_image
    FROM rooms r
    WHERE r.status = 'approved'
      AND (@keyword  IS NULL OR r.title LIKE '%' + @keyword + '%' OR r.address LIKE '%' + @keyword + '%')
      AND (@city     IS NULL OR r.city = @city)
      AND (@type     IS NULL OR r.type = @type)
      AND (@minPrice IS NULL OR r.price >= @minPrice)
      AND (@maxPrice IS NULL OR r.price <= @maxPrice)
      AND (@minArea  IS NULL OR r.area  >= @minArea)
    ORDER BY
        CASE WHEN @sort = 'newest'     THEN r.created_at END DESC,
        CASE WHEN @sort = 'price-asc'  THEN r.price      END ASC,
        CASE WHEN @sort = 'price-desc' THEN r.price      END DESC,
        CASE WHEN @sort = 'area-desc'  THEN r.area       END DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END
GO

-- Đếm tổng số phòng (để phân trang)
CREATE OR ALTER PROCEDURE sp_CountRooms
    @keyword  NVARCHAR(200) = NULL,
    @city     NVARCHAR(100) = NULL,
    @type     NVARCHAR(50)  = NULL,
    @minPrice DECIMAL(12,0) = NULL,
    @maxPrice DECIMAL(12,0) = NULL,
    @minArea  DECIMAL(6,1)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS total
    FROM rooms
    WHERE status = 'approved'
      AND (@keyword  IS NULL OR title LIKE '%' + @keyword + '%' OR address LIKE '%' + @keyword + '%')
      AND (@city     IS NULL OR city = @city)
      AND (@type     IS NULL OR type = @type)
      AND (@minPrice IS NULL OR price >= @minPrice)
      AND (@maxPrice IS NULL OR price <= @maxPrice)
      AND (@minArea  IS NULL OR area  >= @minArea);
END
GO

-- Lấy phòng mới nhất (trang chủ)
CREATE OR ALTER PROCEDURE sp_GetNewRooms
    @limit INT = 6
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@limit)
        r.id, r.title, r.type, r.city, r.address,
        r.price, r.area, r.is_available, r.created_at,
        (SELECT TOP 1 url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1) AS cover_image,
        (SELECT TOP 1 url FROM room_images ri WHERE ri.room_id = r.id ORDER BY ri.sort_order) AS first_image
    FROM rooms r
    WHERE r.status = 'approved'
    ORDER BY r.created_at DESC;
END
GO

-- Lấy phòng nổi bật (trang chủ)
CREATE OR ALTER PROCEDURE sp_GetFeaturedRooms
    @limit INT = 6
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@limit)
        r.id, r.title, r.type, r.city, r.address,
        r.price, r.area, r.is_available, r.is_featured, r.created_at,
        (SELECT TOP 1 url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_cover = 1) AS cover_image,
        (SELECT TOP 1 url FROM room_images ri WHERE ri.room_id = r.id ORDER BY ri.sort_order) AS first_image
    FROM rooms r
    WHERE r.status = 'approved'
    ORDER BY r.is_featured DESC, r.views DESC, r.created_at DESC;
END
GO

-- Thống kê trang chủ
CREATE OR ALTER PROCEDURE sp_GetStats
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM rooms  WHERE status = 'approved') AS total_rooms,
        (SELECT COUNT(*) FROM users  WHERE role = 'employer')   AS total_employers,
        (SELECT COUNT(*) FROM users  WHERE role = 'user')       AS total_users;
END
GO
