USE doan35;
GO

-- Mở rộng cột anh_dai_dien từ NVARCHAR(500) sang NVARCHAR(MAX)
-- để chứa được ảnh base64
ALTER TABLE nguoi_dung
    ALTER COLUMN anh_dai_dien NVARCHAR(MAX);
GO

PRINT 'Fix xong: cột anh_dai_dien đã được đổi thành NVARCHAR(MAX)';
