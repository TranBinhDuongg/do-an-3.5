USE doan35;
GO

-- Đổi tên cột email -> username trong bảng users
EXEC sp_rename 'users.email', 'username', 'COLUMN';
GO

-- Cập nhật dữ liệu: lấy phần trước @ làm username
UPDATE users SET username = LEFT(username, CHARINDEX('@', username) - 1)
WHERE CHARINDEX('@', username) > 0;
GO
