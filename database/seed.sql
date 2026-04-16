-- ============================================================
-- PhòngTrọVN - Seed Data (SQL Server / T-SQL)
-- ============================================================

USE doan35;
GO

-- ------------------------------------------------------------
-- NGUOI_DUNG
-- ------------------------------------------------------------
INSERT INTO nguoi_dung (ho_ten, tai_khoan, dien_thoai, mat_khau, vai_tro) VALUES
(N'Admin',            'admin',  '0900000000', '$2b$10$hashedpassword1', 'admin'),
(N'Nguyễn Văn Minh',  'minh',   '0912345678', '$2b$10$hashedpassword2', 'employer'),
(N'Trần Thị Lan',     'lan',    '0987654321', '$2b$10$hashedpassword3', 'employer'),
(N'Lê Văn Hùng',      'hung',   '0901234567', '$2b$10$hashedpassword4', 'user'),
(N'Phạm Thị Mai',     'mai',    '0978123456', '$2b$10$hashedpassword5', 'user');
GO

-- ------------------------------------------------------------
-- GOI_DANG_TIN
-- ------------------------------------------------------------
INSERT INTO goi_dang_tin (ten_goi, gia, so_ngay, gioi_han_tin, noi_bat, mo_ta) VALUES
(N'Cơ bản',  0,      30, 1,  0, N'Đăng 1 tin miễn phí, hiển thị thường'),
(N'Nổi bật', 99000,  30, 5,  1, N'Đăng 5 tin, ưu tiên hiển thị, huy hiệu nổi bật'),
(N'VIP',     299000, 30, 20, 1, N'Đăng không giới hạn, top tìm kiếm, hỗ trợ 24/7');
GO

-- ------------------------------------------------------------
-- NGUOI_DUNG_GOI
-- ------------------------------------------------------------
INSERT INTO nguoi_dung_goi (ma_nd, ma_goi, bat_dau, het_han) VALUES
(2, 2, '2025-04-01', '2025-05-01'),
(3, 1, '2025-04-10', '2025-05-10');
GO

-- ------------------------------------------------------------
-- TIEN_ICH
-- ------------------------------------------------------------
INSERT INTO tien_ich (ma_khoa, ten_hien_thi, bieu_tuong) VALUES
('wifi',     N'WiFi',        N'📶'),
('ac',       N'Điều hòa',    N'❄️'),
('wc',       N'WC riêng',    N'🚿'),
('fridge',   N'Tủ lạnh',     N'🧊'),
('washer',   N'Máy giặt',    N'🫧'),
('kitchen',  N'Bếp nấu',     N'🍳'),
('parking',  N'Chỗ để xe',   N'🅿️'),
('security', N'Bảo vệ 24/7', N'🔒'),
('elevator', N'Thang máy',   N'🛗'),
('balcony',  N'Ban công',    N'🌿'),
('bed',      N'Giường',      N'🛏️'),
('wardrobe', N'Tủ quần áo',  N'🗄️');
GO

-- ------------------------------------------------------------
-- PHONG_TRO
-- ------------------------------------------------------------
INSERT INTO phong_tro (ma_chu_tro, tieu_de, loai_phong, tinh_thanh, quan_huyen, dia_chi, gia_thue, tien_coc, dien_tich, mo_ta, ten_lien_he, sdt_lien_he, email_lien_he, hien_sdt, trang_thai, con_phong, luot_xem, so_lien_he) VALUES
(2, N'Phòng trọ cao cấp gần ĐH Bách Khoa',
 N'Phòng trọ', N'Hà Nội', N'Hai Bà Trưng', N'15 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội',
 3500000, 7000000, 25, N'Phòng mới xây, đầy đủ nội thất, gần trường đại học, an ninh tốt.',
 N'Nguyễn Văn Minh', '0912345678', 'minh@gmail.com', 1, 'approved', 1, 142, 8),

(2, N'Chung cư mini full nội thất, ban công view đẹp',
 N'Chung cư mini', N'Hà Nội', N'Đống Đa', N'88 Láng Hạ, Đống Đa, Hà Nội',
 5500000, 11000000, 35, N'Căn hộ mini hiện đại, ban công thoáng mát, view thành phố.',
 N'Nguyễn Văn Minh', '0912345678', 'minh@gmail.com', 1, 'approved', 1, 89, 3),

(3, N'Phòng trọ giá rẻ, gần KCN Thăng Long',
 N'Phòng trọ', N'Hà Nội', N'Bắc Từ Liêm', N'5 Phạm Văn Đồng, Bắc Từ Liêm, Hà Nội',
 1800000, 3600000, 18, N'Phòng trọ giá rẻ, phù hợp công nhân, gần khu công nghiệp.',
 N'Trần Thị Lan', '0987654321', 'lan@gmail.com', 1, 'approved', 0, 56, 0),

(2, N'Nhà nguyên căn 3 phòng ngủ, sân vườn rộng',
 N'Nhà nguyên căn', N'Hà Nội', N'Thanh Xuân', N'22 Nguyễn Trãi, Thanh Xuân, Hà Nội',
 12000000, 24000000, 80, N'Nhà 3 tầng, 3 phòng ngủ, sân vườn rộng, garage ô tô.',
 N'Nguyễn Văn Minh', '0912345678', 'minh@gmail.com', 1, 'approved', 1, 210, 15),

(3, N'Studio cao cấp trung tâm quận 1, TP.HCM',
 N'Studio', N'TP. Hồ Chí Minh', N'Quận 1', N'120 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
 8000000, 16000000, 30, N'Studio thiết kế hiện đại, trung tâm quận 1, tiện ích đầy đủ.',
 N'Trần Thị Lan', '0987654321', 'lan@gmail.com', 1, 'approved', 1, 0, 0),

(3, N'Phòng trọ sạch sẽ, yên tĩnh, gần ĐH Kinh Tế',
 N'Phòng trọ', N'TP. Hồ Chí Minh', N'Bình Thạnh', N'45 Đinh Tiên Hoàng, Bình Thạnh, TP. Hồ Chí Minh',
 2800000, 5600000, 22, N'Phòng sạch sẽ, yên tĩnh, gần trường đại học, có bảo vệ.',
 N'Trần Thị Lan', '0987654321', 'lan@gmail.com', 1, 'approved', 1, 0, 0),

(2, N'Căn hộ dịch vụ cao cấp, đầy đủ tiện nghi',
 N'Căn hộ dịch vụ', N'Đà Nẵng', N'Hải Châu', N'30 Lê Lợi, Hải Châu, Đà Nẵng',
 6500000, 13000000, 40, N'Căn hộ dịch vụ cao cấp, dọn phòng hàng ngày, bảo vệ 24/7.',
 N'Nguyễn Văn Minh', '0912345678', 'minh@gmail.com', 1, 'approved', 1, 0, 0),

(3, N'Ký túc xá sinh viên giá rẻ, an ninh tốt',
 N'Ký túc xá', N'TP. Hồ Chí Minh', N'Quận 5', N'10 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh',
 900000, 1800000, 10, N'Ký túc xá dành cho sinh viên, giá rẻ, an ninh tốt, gần trường.',
 N'Trần Thị Lan', '0987654321', 'lan@gmail.com', 1, 'approved', 1, 0, 0),

(2, N'Phòng trọ mới xây, nội thất hiện đại',
 N'Phòng trọ', N'Đà Nẵng', N'Hải Châu', N'77 Trần Phú, Hải Châu, Đà Nẵng',
 3200000, 6400000, 28, N'Phòng mới xây 2024, nội thất hiện đại, gần biển Mỹ Khê.',
 N'Nguyễn Văn Minh', '0912345678', 'minh@gmail.com', 1, 'approved', 1, 0, 0);
GO

-- ------------------------------------------------------------
-- ANH_PHONG
-- ------------------------------------------------------------
INSERT INTO anh_phong (ma_phong, duong_dan, la_anh_bia, thu_tu) VALUES
(1, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop', 1, 0),
(2, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop', 1, 0),
(3, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop', 1, 0),
(4, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=250&fit=crop', 1, 0),
(5, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=250&fit=crop', 1, 0),
(6, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop', 1, 0),
(7, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=250&fit=crop', 1, 0),
(8, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop', 1, 0),
(9, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop', 1, 0);
GO

-- ------------------------------------------------------------
-- TIEN_ICH_PHONG
-- ------------------------------------------------------------
-- Phòng 1: wifi, ac, wc, bed, wardrobe
INSERT INTO tien_ich_phong VALUES (1,1),(1,2),(1,3),(1,11),(1,12);
-- Phòng 2: wifi, ac, wc, fridge, washer, kitchen, elevator, balcony, bed, wardrobe
INSERT INTO tien_ich_phong VALUES (2,1),(2,2),(2,3),(2,4),(2,5),(2,6),(2,9),(2,10),(2,11),(2,12);
-- Phòng 3: wifi, parking
INSERT INTO tien_ich_phong VALUES (3,1),(3,7);
-- Phòng 4: wifi, ac, wc, fridge, washer, kitchen, parking, security, bed, wardrobe
INSERT INTO tien_ich_phong VALUES (4,1),(4,2),(4,3),(4,4),(4,5),(4,6),(4,7),(4,8),(4,11),(4,12);
-- Phòng 5: wifi, ac, wc, fridge, elevator, balcony, bed
INSERT INTO tien_ich_phong VALUES (5,1),(5,2),(5,3),(5,4),(5,9),(5,10),(5,11);
-- Phòng 6: wifi, wc, security, bed
INSERT INTO tien_ich_phong VALUES (6,1),(6,3),(6,8),(6,11);
-- Phòng 7: wifi, ac, wc, fridge, washer, kitchen, security, elevator, bed, wardrobe
INSERT INTO tien_ich_phong VALUES (7,1),(7,2),(7,3),(7,4),(7,5),(7,6),(7,8),(7,9),(7,11),(7,12);
-- Phòng 8: wifi, security
INSERT INTO tien_ich_phong VALUES (8,1),(8,8);
-- Phòng 9: wifi, ac, wc, bed, wardrobe, balcony
INSERT INTO tien_ich_phong VALUES (9,1),(9,2),(9,3),(9,11),(9,12),(9,10);
GO

-- ------------------------------------------------------------
-- YEU_THICH
-- ------------------------------------------------------------
INSERT INTO yeu_thich (ma_nd, ma_phong) VALUES
(4, 1), (4, 4), (5, 2), (5, 5);
GO

-- ------------------------------------------------------------
-- CUOC_TRO_CHUYEN & TIN_NHAN
-- ------------------------------------------------------------
INSERT INTO cuoc_tro_chuyen (ma_nd, ma_chu_tro, ma_phong) VALUES
(4, 2, 1),
(5, 3, 5);
GO

INSERT INTO tin_nhan (ma_ctc, ma_nguoi_gui, noi_dung, da_doc) VALUES
(1, 4, N'Chào anh, phòng còn trống không ạ?', 1),
(1, 2, N'Chào bạn, phòng vẫn còn trống nhé. Bạn muốn xem phòng lúc nào?', 1),
(1, 4, N'Anh cho em xem phòng vào chiều thứ 7 được không ạ?', 0),
(2, 5, N'Cho mình hỏi phòng có bao gồm điện nước không?', 1),
(2, 3, N'Phòng tính điện nước riêng theo giá nhà nước bạn nhé.', 0);
GO

-- ------------------------------------------------------------
-- THONG_BAO
-- ------------------------------------------------------------
INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung, da_doc) VALUES
(2, N'📞', N'Nguyễn Văn A vừa xem số điện thoại của bạn', 0),
(2, N'❤️', N'Có người lưu tin "Phòng trọ cao cấp"', 0),
(2, N'✅', N'Tin đăng của bạn đã được duyệt', 1),
(3, N'✅', N'Tin đăng "Studio cao cấp" đã được duyệt', 1);
GO
