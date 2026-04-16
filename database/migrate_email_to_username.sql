USE doan35;
GO

-- Đổi tên cột email -> tai_khoan trong bảng nguoi_dung
EXEC sp_rename 'nguoi_dung.email', 'tai_khoan', 'COLUMN';
GO

-- Cập nhật dữ liệu: lấy phần trước @ làm tài khoản
UPDATE nguoi_dung SET tai_khoan = LEFT(tai_khoan, CHARINDEX('@', tai_khoan) - 1)
WHERE CHARINDEX('@', tai_khoan) > 0;
GO
