USE doan35;
GO

-- Cập nhật mat_khau plain text để test
UPDATE nguoi_dung SET mat_khau = 'pass1234'
WHERE tai_khoan IN ('admin', 'minh', 'lan', 'hung', 'mai');
GO
