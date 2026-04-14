USE doan35;
GO

-- Cập nhật password plain text để test
UPDATE users SET password = 'pass1234'
WHERE username IN ('admin', 'minh', 'lan', 'hung', 'mai');
GO
