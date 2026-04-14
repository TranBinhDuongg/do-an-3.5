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
