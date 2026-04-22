-- ============================================================
-- PhòngTrọVN - Extra Seed Data (nhiều khoảng thời gian)
-- Chạy SAU seed.sql
-- Người dùng: ma_nd 1-5 đã có, thêm từ 6 trở đi
-- Phòng: ma_phong 1-9 đã có, thêm từ 10 trở đi
-- ============================================================
USE doan35;
GO

-- ============================================================
-- NGUOI_DUNG (thêm 10 user + 3 employer)
-- ============================================================
INSERT INTO nguoi_dung (ho_ten, tai_khoan, dien_thoai, mat_khau, vai_tro, ngay_tao) VALUES
-- Employer mới
(N'Đặng Văn Khoa',    'khoa',    '0911222333', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employer', '2024-08-15'),
(N'Bùi Thị Ngọc',    'ngoc',    '0922333444', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employer', '2024-10-01'),
(N'Lý Minh Phúc',    'phuc',    '0933444555', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employer', '2025-01-10'),
-- User mới
(N'Trần Quốc Anh',   'quocanh', '0944555666', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '2024-07-20'),
(N'Nguyễn Thị Bích', 'bich',    '0955666777', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '2024-08-05'),
(N'Lê Hoàng Nam',    'nam',     '0966777888', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '2024-09-12'),
(N'Phạm Thị Thu',    'thu',     '0977888999', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '2024-10-18'),
(N'Võ Văn Tài',      'tai',     '0988999000', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '2024-11-03'),
(N'Hoàng Thị Yến',   'yen',     '0909111222', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '2024-12-20'),
(N'Đinh Văn Long',   'long',    '0919222333', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '2025-01-08'),
(N'Trịnh Thị Hằng',  'hang',    '0929333444', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '2025-02-14'),
(N'Ngô Minh Đức',    'duc',     '0939444555', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '2025-03-01'),
(N'Cao Thị Linh',    'linh',    '0949555666', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '2025-03-22');
GO
-- ma_nd: 6=khoa(emp), 7=ngoc(emp), 8=phuc(emp), 9=quocanh, 10=bich, 11=nam, 12=thu, 13=tai, 14=yen, 15=long, 16=hang, 17=duc, 18=linh

-- ============================================================
-- NGUOI_DUNG_GOI
-- ============================================================
INSERT INTO nguoi_dung_goi (ma_nd, ma_goi, bat_dau, het_han) VALUES
(6, 3, '2024-08-15', '2024-09-15'),
(6, 3, '2024-09-15', '2024-10-15'),
(6, 2, '2024-10-15', '2024-11-15'),
(7, 2, '2024-10-01', '2024-11-01'),
(7, 3, '2025-01-01', '2025-02-01'),
(8, 1, '2025-01-10', '2025-02-10'),
(8, 2, '2025-02-10', '2025-03-10');
GO

-- ============================================================
-- PHONG_TRO (20 phòng mới, trải từ T7/2024 đến T4/2025)
-- nhiều trạng thái: approved, pending, rejected, paused
-- ============================================================
INSERT INTO phong_tro (ma_chu_tro,tieu_de,loai_phong,tinh_thanh,quan_huyen,dia_chi,gia_thue,tien_coc,dien_tich,mo_ta,ten_lien_he,sdt_lien_he,email_lien_he,hien_sdt,trang_thai,con_phong,luot_xem,so_lien_he,ngay_tao) VALUES
-- T7/2024
(6,N'Phòng trọ giá rẻ khu vực Gò Vấp',N'Phòng trọ',N'TP. Hồ Chí Minh',N'Gò Vấp',N'102 Nguyễn Oanh, Gò Vấp',2200000,4400000,20,N'Phòng sạch sẽ, hẻm yên tĩnh, gần chợ Gò Vấp.',N'Đặng Văn Khoa','0911222333','khoa@gmail.com',1,'approved',1,312,22,'2024-07-10'),
(6,N'Chung cư mini 1PN full nội thất Bình Dương',N'Chung cư mini',N'Bình Dương',N'Thuận An',N'45 Lê Lợi, Thuận An, Bình Dương',4500000,9000000,32,N'Căn hộ 1 phòng ngủ, đầy đủ nội thất, gần KCN Sóng Thần.',N'Đặng Văn Khoa','0911222333','khoa@gmail.com',1,'approved',1,278,18,'2024-07-25'),
-- T8/2024
(6,N'Nhà nguyên căn hẻm xe hơi, Bình Thạnh',N'Nhà nguyên căn',N'TP. Hồ Chí Minh',N'Bình Thạnh',N'18 Nơ Trang Long, Bình Thạnh',15000000,30000000,90,N'Nhà 4 tầng, 4PN, hẻm xe hơi, sân thượng rộng.',N'Đặng Văn Khoa','0911222333','khoa@gmail.com',1,'approved',1,195,14,'2024-08-03'),
(7,N'Studio view sông Hàn, Đà Nẵng',N'Studio',N'Đà Nẵng',N'Sơn Trà',N'55 Phạm Văn Đồng, Sơn Trà, Đà Nẵng',7000000,14000000,28,N'Studio view sông Hàn cực đẹp, nội thất hiện đại, tầng cao.',N'Bùi Thị Ngọc','0922333444','ngoc@gmail.com',1,'approved',1,421,35,'2024-08-20'),
-- T9/2024
(7,N'Phòng trọ sinh viên gần ĐH Đà Nẵng',N'Phòng trọ',N'Đà Nẵng',N'Liên Chiểu',N'33 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng',1500000,3000000,16,N'Phòng trọ giá rẻ cho sinh viên, gần trường, an ninh tốt.',N'Bùi Thị Ngọc','0922333444','ngoc@gmail.com',1,'approved',0,167,8,'2024-09-05'),
(6,N'Căn hộ dịch vụ cao cấp Phú Nhuận',N'Căn hộ dịch vụ',N'TP. Hồ Chí Minh',N'Phú Nhuận',N'77 Hoàng Văn Thụ, Phú Nhuận',8500000,17000000,42,N'Căn hộ dịch vụ 5 sao, dọn phòng hàng ngày, hồ bơi, gym.',N'Đặng Văn Khoa','0911222333','khoa@gmail.com',1,'approved',1,389,28,'2024-09-18'),
-- T10/2024
(7,N'Ký túc xá cao cấp gần ĐH Bách Khoa Đà Nẵng',N'Ký túc xá',N'Đà Nẵng',N'Ngũ Hành Sơn',N'10 Nguyễn Lương Bằng, Ngũ Hành Sơn',1200000,2400000,12,N'KTX cao cấp, phòng 2 người, điều hòa, wifi, bảo vệ 24/7.',N'Bùi Thị Ngọc','0922333444','ngoc@gmail.com',1,'approved',1,203,11,'2024-10-02'),
(6,N'Phòng trọ mới xây, nội thất cơ bản, Quận 12',N'Phòng trọ',N'TP. Hồ Chí Minh',N'Quận 12',N'25 Tô Ký, Quận 12',2500000,5000000,22,N'Phòng mới xây, WC riêng, có gác lửng, gần chợ đầu mối.',N'Đặng Văn Khoa','0911222333','khoa@gmail.com',1,'paused',1,88,3,'2024-10-15'),
-- T11/2024
(7,N'Chung cư mini ban công view biển Mỹ Khê',N'Chung cư mini',N'Đà Nẵng',N'Ngũ Hành Sơn',N'88 Võ Nguyên Giáp, Ngũ Hành Sơn',9000000,18000000,45,N'View biển Mỹ Khê tuyệt đẹp, nội thất cao cấp, tầng 8.',N'Bùi Thị Ngọc','0922333444','ngoc@gmail.com',1,'approved',1,534,42,'2024-11-08'),
(6,N'Nhà trọ sân vườn, yên tĩnh, Hóc Môn',N'Nhà nguyên căn',N'TP. Hồ Chí Minh',N'Hóc Môn',N'5 Lý Thường Kiệt, Hóc Môn',8000000,16000000,65,N'Nhà vườn yên tĩnh, 3PN, sân rộng, phù hợp gia đình.',N'Đặng Văn Khoa','0911222333','khoa@gmail.com',1,'rejected',1,0,0,'2024-11-20'),
-- T12/2024
(8,N'Studio mới 100% trung tâm Hà Nội',N'Studio',N'Hà Nội',N'Hoàn Kiếm',N'5 Hàng Bài, Hoàn Kiếm, Hà Nội',10000000,20000000,35,N'Studio brand new, thiết kế Nhật Bản, trung tâm Hà Nội.',N'Lý Minh Phúc','0933444555','phuc@gmail.com',1,'approved',1,445,38,'2024-12-01'),
(8,N'Phòng trọ cao cấp gần Hồ Gươm',N'Phòng trọ',N'Hà Nội',N'Hoàn Kiếm',N'12 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội',4500000,9000000,30,N'Phòng cao cấp, view Hồ Gươm, đầy đủ nội thất, an ninh.',N'Lý Minh Phúc','0933444555','phuc@gmail.com',1,'approved',1,367,25,'2024-12-15'),
-- T1/2025
(8,N'Căn hộ 2PN Vinhomes Smart City',N'Chung cư mini',N'Hà Nội',N'Nam Từ Liêm',N'Vinhomes Smart City, Nam Từ Liêm, Hà Nội',12000000,24000000,65,N'Căn hộ 2PN Vinhomes, đầy đủ tiện ích nội khu, hồ bơi, gym.',N'Lý Minh Phúc','0933444555','phuc@gmail.com',1,'approved',1,289,19,'2025-01-05'),
(7,N'Phòng trọ giá rẻ gần cầu Rồng',N'Phòng trọ',N'Đà Nẵng',N'Hải Châu',N'20 Trần Hưng Đạo, Hải Châu, Đà Nẵng',2000000,4000000,18,N'Phòng trọ giá rẻ, gần cầu Rồng, tiện di chuyển.',N'Bùi Thị Ngọc','0922333444','ngoc@gmail.com',1,'approved',1,156,9,'2025-01-18'),
-- T2/2025
(8,N'Nhà nguyên căn 4PN Mỹ Đình',N'Nhà nguyên căn',N'Hà Nội',N'Nam Từ Liêm',N'33 Mỹ Đình, Nam Từ Liêm, Hà Nội',18000000,36000000,110,N'Nhà 5 tầng, 4PN, 2 phòng khách, garage, gần sân vận động.',N'Lý Minh Phúc','0933444555','phuc@gmail.com',1,'approved',1,178,12,'2025-02-10'),
(6,N'Phòng trọ WC riêng, gần BV Chợ Rẫy',N'Phòng trọ',N'TP. Hồ Chí Minh',N'Quận 5',N'88 Nguyễn Chí Thanh, Quận 5',3000000,6000000,24,N'Phòng WC riêng, gần bệnh viện Chợ Rẫy, phù hợp y bác sĩ.',N'Đặng Văn Khoa','0911222333','khoa@gmail.com',1,'approved',1,134,7,'2025-02-20'),
-- T3/2025
(8,N'Studio Cầu Giấy, gần các trường ĐH lớn',N'Studio',N'Hà Nội',N'Cầu Giấy',N'66 Xuân Thủy, Cầu Giấy, Hà Nội',6500000,13000000,30,N'Studio hiện đại, gần ĐHQG, ĐH Ngoại Thương, tiện ích đầy đủ.',N'Lý Minh Phúc','0933444555','phuc@gmail.com',1,'approved',1,98,5,'2025-03-08'),
(7,N'Căn hộ dịch vụ gần sân bay Đà Nẵng',N'Căn hộ dịch vụ',N'Đà Nẵng',N'Thanh Khê',N'15 Duy Tân, Thanh Khê, Đà Nẵng',7500000,15000000,38,N'Căn hộ dịch vụ gần sân bay, phù hợp người hay đi công tác.',N'Bùi Thị Ngọc','0922333444','ngoc@gmail.com',1,'approved',1,112,6,'2025-03-15'),
-- T4/2025 (pending để test duyệt)
(8,N'Phòng trọ mới khai trương, Đống Đa',N'Phòng trọ',N'Hà Nội',N'Đống Đa',N'9 Khâm Thiên, Đống Đa, Hà Nội',3800000,7600000,26,N'Phòng mới khai trương, nội thất mới 100%, gần phố cổ.',N'Lý Minh Phúc','0933444555','phuc@gmail.com',1,'pending',1,0,0,'2025-04-01'),
(6,N'Chung cư mini Thủ Đức, gần ĐHQG',N'Chung cư mini',N'TP. Hồ Chí Minh',N'Thủ Đức',N'100 Võ Văn Ngân, Thủ Đức',5000000,10000000,33,N'Căn hộ mini gần ĐHQG TP.HCM, nội thất đầy đủ, an ninh.',N'Đặng Văn Khoa','0911222333','khoa@gmail.com',1,'pending',1,0,0,'2025-04-10');
GO
-- ma_phong: 10..29 (10 đến 29)

-- ============================================================
-- ANH_PHONG (1 ảnh bìa mỗi phòng)
-- ============================================================
INSERT INTO anh_phong (ma_phong, duong_dan, la_anh_bia, thu_tu) VALUES
(10, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=250&fit=crop', 1, 0),
(11, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop', 1, 0),
(12, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=250&fit=crop', 1, 0),
(13, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=250&fit=crop', 1, 0),
(14, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop', 1, 0),
(15, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop', 1, 0),
(16, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop', 1, 0),
(17, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=250&fit=crop', 1, 0),
(18, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop', 1, 0),
(19, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=250&fit=crop', 1, 0),
(20, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=250&fit=crop', 1, 0),
(21, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop', 1, 0),
(22, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop', 1, 0),
(23, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop', 1, 0),
(24, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=250&fit=crop', 1, 0),
(25, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop', 1, 0),
(26, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=250&fit=crop', 1, 0),
(27, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=250&fit=crop', 1, 0),
(28, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop', 1, 0),
(29, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop', 1, 0);
GO

-- ============================================================
-- TIEN_ICH_PHONG
-- ============================================================
INSERT INTO tien_ich_phong VALUES
(10,1),(10,3),(10,7),(10,11),
(11,1),(11,2),(11,3),(11,4),(11,5),(11,6),(11,9),(11,11),(11,12),
(12,1),(12,2),(12,3),(12,4),(12,5),(12,6),(12,7),(12,8),(12,11),(12,12),
(13,1),(13,2),(13,3),(13,4),(13,9),(13,10),(13,11),(13,12),
(14,1),(14,3),(14,7),(14,11),
(15,1),(15,2),(15,3),(15,4),(15,5),(15,6),(15,8),(15,9),(15,11),(15,12),
(16,1),(16,2),(16,8),(16,9),(16,11),
(17,1),(17,3),(17,11),
(18,1),(18,2),(18,3),(18,4),(18,9),(18,10),(18,11),(18,12),
(19,1),(19,2),(19,3),(19,4),(19,5),(19,6),(19,7),(19,8),(19,11),(19,12),
(20,1),(20,2),(20,3),(20,4),(20,5),(20,6),(20,9),(20,10),(20,11),(20,12),
(21,1),(21,2),(21,3),(21,11),(21,12),
(22,1),(22,2),(22,3),(22,4),(22,5),(22,6),(22,7),(22,8),(22,9),(22,11),(22,12),
(23,1),(23,3),(23,7),(23,11),
(24,1),(24,2),(24,3),(24,4),(24,5),(24,6),(24,7),(24,8),(24,9),(24,11),(24,12),
(25,1),(25,3),(25,8),(25,11),
(26,1),(26,2),(26,3),(26,4),(26,9),(26,11),(26,12),
(27,1),(27,2),(27,3),(27,4),(27,5),(27,6),(27,8),(27,9),(27,11),(27,12),
(28,1),(28,2),(28,3),(28,11),
(29,1),(29,2),(29,3),(29,4),(29,5),(29,6),(29,9),(29,11),(29,12);
GO

-- ============================================================
-- YEU_THICH (user mới lưu phòng)
-- ============================================================
INSERT INTO yeu_thich (ma_nd, ma_phong) VALUES
(9,  10),(9,  13),(9,  18),
(10, 11),(10, 19),(10, 22),
(11, 13),(11, 16),(11, 21),
(12, 10),(12, 15),(12, 24),
(13, 18),(13, 20),(13, 27),
(14, 13),(14, 22),(14, 26),
(15, 11),(15, 21),(15, 28),
(16, 16),(16, 19),(16, 25),
(17, 10),(17, 13),(17, 20),
(18, 22),(18, 27),(18, 29),
-- user cũ lưu thêm phòng mới
(4,  13),(4,  18),(4,  22),
(5,  16),(5,  20),(5,  27);
GO

-- ============================================================
-- CUOC_TRO_CHUYEN & TIN_NHAN
-- ============================================================
INSERT INTO cuoc_tro_chuyen (ma_nd, ma_chu_tro, ma_phong, ngay_tao) VALUES
(9,  6, 10, '2024-07-15'),
(10, 6, 11, '2024-08-10'),
(11, 7, 13, '2024-08-25'),
(12, 7, 16, '2024-09-20'),
(13, 6, 15, '2024-09-28'),
(14, 7, 18, '2024-11-12'),
(15, 8, 21, '2024-12-05'),
(16, 8, 22, '2024-12-18'),
(17, 8, 24, '2025-01-10'),
(18, 7, 27, '2025-03-20');
GO
-- ma_ctc: 3..12 (3 đến 12, vì seed.sql đã có 1,2)

INSERT INTO tin_nhan (ma_ctc, ma_nguoi_gui, noi_dung, da_doc, ngay_tao) VALUES
-- Cuộc 3: quocanh hỏi khoa về phòng 10
(3, 9,  N'Chào anh, phòng còn trống không ạ?', 1, '2024-07-15 09:00'),
(3, 6,  N'Còn trống bạn nhé, bạn muốn xem phòng không?', 1, '2024-07-15 09:30'),
(3, 9,  N'Cho em xem phòng chiều thứ 7 được không ạ?', 1, '2024-07-15 10:00'),
(3, 6,  N'Được bạn, 2h chiều thứ 7 nhé.', 1, '2024-07-15 10:15'),
(3, 9,  N'Vâng em cảm ơn anh!', 1, '2024-07-15 10:20'),
-- Cuộc 4: bich hỏi khoa về phòng 11
(4, 10, N'Phòng có bao gồm điện nước không ạ?', 1, '2024-08-10 14:00'),
(4, 6,  N'Điện nước tính riêng theo giá nhà nước bạn nhé.', 1, '2024-08-10 14:30'),
(4, 10, N'Phòng có chỗ để xe không anh?', 1, '2024-08-10 15:00'),
(4, 6,  N'Có bãi xe riêng, phí 100k/tháng.', 0, '2024-08-10 15:10'),
-- Cuộc 5: nam hỏi ngoc về phòng 13
(5, 11, N'Anh ơi phòng view sông có bị ồn không ạ?', 1, '2024-08-25 08:00'),
(5, 7,  N'Phòng cách âm tốt bạn nhé, rất yên tĩnh.', 1, '2024-08-25 08:30'),
(5, 11, N'Tầng mấy ạ anh?', 1, '2024-08-25 09:00'),
(5, 7,  N'Tầng 7, view sông rất đẹp.', 0, '2024-08-25 09:15'),
-- Cuộc 6: thu hỏi ngoc về phòng 16
(6, 12, N'Phòng có hợp đồng thuê không ạ?', 1, '2024-09-20 10:00'),
(6, 7,  N'Có hợp đồng 6 tháng hoặc 1 năm bạn nhé.', 1, '2024-09-20 10:30'),
(6, 12, N'Cho mình thuê theo tháng được không?', 0, '2024-09-20 11:00'),
-- Cuộc 7: tai hỏi khoa về phòng 15
(7, 13, N'Căn hộ dịch vụ có dọn phòng hàng ngày không ạ?', 1, '2024-09-28 16:00'),
(7, 6,  N'Có dọn phòng hàng ngày và thay đồ giường 2 lần/tuần.', 1, '2024-09-28 16:30'),
(7, 13, N'Giá có thể thương lượng không anh?', 0, '2024-09-28 17:00'),
-- Cuộc 8: yen hỏi ngoc về phòng 18
(8, 14, N'Chung cư có hồ bơi không ạ?', 1, '2024-11-12 11:00'),
(8, 7,  N'Có hồ bơi tầng 3 và gym tầng 4 bạn nhé.', 1, '2024-11-12 11:30'),
(8, 14, N'Phí quản lý bao nhiêu một tháng ạ?', 1, '2024-11-12 12:00'),
(8, 7,  N'500k/tháng bao gồm điện thang máy, vệ sinh chung.', 0, '2024-11-12 12:30'),
-- Cuộc 9: long hỏi phuc về phòng 21
(9, 15, N'Studio có bếp nấu không anh?', 1, '2024-12-05 09:00'),
(9, 8,  N'Có bếp từ và đầy đủ dụng cụ nấu ăn bạn nhé.', 1, '2024-12-05 09:30'),
(9, 15, N'Cho mình đặt cọc online được không?', 0, '2024-12-05 10:00'),
-- Cuộc 10: hang hỏi phuc về phòng 22
(10, 16, N'Phòng gần Hồ Gươm đi bộ mất bao lâu ạ?', 1, '2024-12-18 14:00'),
(10, 8,  N'Đi bộ khoảng 5 phút bạn nhé.', 1, '2024-12-18 14:20'),
(10, 16, N'Phòng có ban công không anh?', 1, '2024-12-18 14:30'),
(10, 8,  N'Có ban công nhỏ nhìn ra phố bạn nhé.', 0, '2024-12-18 15:00'),
-- Cuộc 11: duc hỏi phuc về phòng 24
(11, 17, N'Vinhomes có chỗ để ô tô không anh?', 1, '2025-01-10 10:00'),
(11, 8,  N'Có hầm để xe ô tô, phí 1.5tr/tháng.', 1, '2025-01-10 10:30'),
(11, 17, N'Căn hộ hướng nào ạ?', 0, '2025-01-10 11:00'),
-- Cuộc 12: linh hỏi ngoc về phòng 27
(12, 18, N'Căn hộ gần sân bay đi taxi mất bao nhiêu ạ?', 1, '2025-03-20 08:00'),
(12, 7,  N'Khoảng 50-70k bạn nhé, rất tiện.', 1, '2025-03-20 08:30'),
(12, 18, N'Phòng có cửa sổ lớn không anh?', 0, '2025-03-20 09:00');
GO

-- ============================================================
-- THONG_BAO (trải nhiều tháng)
-- ============================================================
INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung, da_doc, ngay_tao) VALUES
-- T7/2024
(6, N'✅', N'Tin đăng "Phòng trọ giá rẻ khu vực Gò Vấp" đã được duyệt', 1, '2024-07-11'),
(6, N'✅', N'Tin đăng "Chung cư mini 1PN Bình Dương" đã được duyệt', 1, '2024-07-26'),
(6, N'📞', N'Trần Quốc Anh vừa xem số điện thoại của bạn', 1, '2024-07-15'),
-- T8/2024
(6, N'✅', N'Tin đăng "Nhà nguyên căn hẻm xe hơi, Bình Thạnh" đã được duyệt', 1, '2024-08-04'),
(7, N'✅', N'Tin đăng "Studio view sông Hàn" đã được duyệt', 1, '2024-08-21'),
(6, N'❤️', N'Có người lưu tin "Chung cư mini 1PN Bình Dương"', 1, '2024-08-10'),
(7, N'📞', N'Lê Hoàng Nam vừa xem số điện thoại của bạn', 1, '2024-08-25'),
-- T9/2024
(7, N'✅', N'Tin đăng "Phòng trọ sinh viên gần ĐH Đà Nẵng" đã được duyệt', 1, '2024-09-06'),
(6, N'✅', N'Tin đăng "Căn hộ dịch vụ cao cấp Phú Nhuận" đã được duyệt', 1, '2024-09-19'),
(7, N'❤️', N'Có người lưu tin "Studio view sông Hàn"', 1, '2024-09-20'),
-- T10/2024
(7, N'✅', N'Tin đăng "Ký túc xá cao cấp gần ĐH Bách Khoa Đà Nẵng" đã được duyệt', 1, '2024-10-03'),
(6, N'⏸', N'Tin đăng "Phòng trọ mới xây, Quận 12" đã bị tạm dừng bởi quản trị viên.', 1, '2024-10-16'),
-- T11/2024
(7, N'✅', N'Tin đăng "Chung cư mini ban công view biển Mỹ Khê" đã được duyệt', 1, '2024-11-09'),
(6, N'❌', N'Tin đăng "Nhà trọ sân vườn, Hóc Môn" đã bị từ chối.', 1, '2024-11-21'),
(7, N'📞', N'Hoàng Thị Yến vừa xem số điện thoại của bạn', 1, '2024-11-12'),
-- T12/2024
(8, N'✅', N'Tin đăng "Studio mới 100% trung tâm Hà Nội" đã được duyệt', 1, '2024-12-02'),
(8, N'✅', N'Tin đăng "Phòng trọ cao cấp gần Hồ Gươm" đã được duyệt', 1, '2024-12-16'),
(8, N'❤️', N'Có người lưu tin "Studio mới 100% trung tâm Hà Nội"', 1, '2024-12-05'),
(8, N'📞', N'Đinh Văn Long vừa xem số điện thoại của bạn', 1, '2024-12-05'),
-- T1/2025
(8, N'✅', N'Tin đăng "Căn hộ 2PN Vinhomes Smart City" đã được duyệt', 1, '2025-01-06'),
(7, N'✅', N'Tin đăng "Phòng trọ giá rẻ gần cầu Rồng" đã được duyệt', 1, '2025-01-19'),
(8, N'❤️', N'Có người lưu tin "Căn hộ 2PN Vinhomes Smart City"', 0, '2025-01-10'),
-- T2/2025
(8, N'✅', N'Tin đăng "Nhà nguyên căn 4PN Mỹ Đình" đã được duyệt', 1, '2025-02-11'),
(6, N'✅', N'Tin đăng "Phòng trọ WC riêng, gần BV Chợ Rẫy" đã được duyệt', 1, '2025-02-21'),
(8, N'📞', N'Trịnh Thị Hằng vừa xem số điện thoại của bạn', 1, '2025-02-14'),
-- T3/2025
(8, N'✅', N'Tin đăng "Studio Cầu Giấy" đã được duyệt', 0, '2025-03-09'),
(7, N'✅', N'Tin đăng "Căn hộ dịch vụ gần sân bay Đà Nẵng" đã được duyệt', 0, '2025-03-16'),
(7, N'❤️', N'Có người lưu tin "Căn hộ dịch vụ gần sân bay Đà Nẵng"', 0, '2025-03-20'),
-- T4/2025
(8, N'🕐', N'Tin đăng "Phòng trọ mới khai trương, Đống Đa" đang chờ duyệt', 0, '2025-04-01'),
(6, N'🕐', N'Tin đăng "Chung cư mini Thủ Đức" đang chờ duyệt', 0, '2025-04-10');
GO
