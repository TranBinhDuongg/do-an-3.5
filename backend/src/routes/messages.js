const express = require('express');
const auth = require('../middleware/auth');
const { pool, poolConnect, sql } = require('../config/db');

const router = express.Router();

// Helper: lấy thông tin conversation để emit cho đối phương
async function getConvParticipants(ma_ctc) {
  const r = await pool.request()
    .input('ma_ctc', sql.Int, ma_ctc)
    .query(`SELECT ma_nd, ma_chu_tro FROM cuoc_tro_chuyen WHERE ma_ctc = @ma_ctc`);
  return r.recordset[0];
}

// GET /api/messages
router.get('/', auth(), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd', sql.Int, req.user.id)
      .query(`
        SELECT
          c.ma_ctc,
          c.ma_phong,
          p.tieu_de AS ten_phong,
          CASE WHEN c.ma_nd = @ma_nd THEN c.ma_chu_tro ELSE c.ma_nd END AS ma_doi_phuong,
          CASE WHEN c.ma_nd = @ma_nd THEN nd2.ho_ten    ELSE nd1.ho_ten END AS ten_doi_phuong,
          CASE WHEN c.ma_nd = @ma_nd THEN nd2.anh_dai_dien ELSE nd1.anh_dai_dien END AS avatar_doi_phuong,
          CASE WHEN c.ma_nd = @ma_nd THEN nd2.vai_tro   ELSE nd1.vai_tro END AS vai_tro_doi_phuong,
          (SELECT TOP 1 noi_dung FROM tin_nhan WHERE ma_ctc = c.ma_ctc ORDER BY ngay_tao DESC) AS tin_nhan_cuoi,
          (SELECT TOP 1 ngay_tao FROM tin_nhan WHERE ma_ctc = c.ma_ctc ORDER BY ngay_tao DESC) AS thoi_gian_cuoi,
          (SELECT COUNT(*) FROM tin_nhan WHERE ma_ctc = c.ma_ctc AND ma_nguoi_gui <> @ma_nd AND da_doc = 0) AS chua_doc
        FROM cuoc_tro_chuyen c
        JOIN nguoi_dung nd1 ON nd1.ma_nd = c.ma_nd
        JOIN nguoi_dung nd2 ON nd2.ma_nd = c.ma_chu_tro
        LEFT JOIN phong_tro p ON p.ma_phong = c.ma_phong
        WHERE c.ma_nd = @ma_nd OR c.ma_chu_tro = @ma_nd
        ORDER BY thoi_gian_cuoi DESC
      `);
    res.json({ conversations: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/messages/:conversationId
router.get('/:conversationId', auth(), async (req, res) => {
  const { conversationId } = req.params;
  try {
    await poolConnect;
    const check = await pool.request()
      .input('ma_ctc', sql.Int, conversationId)
      .input('ma_nd',  sql.Int, req.user.id)
      .query(`SELECT ma_ctc FROM cuoc_tro_chuyen WHERE ma_ctc = @ma_ctc AND (ma_nd = @ma_nd OR ma_chu_tro = @ma_nd)`);
    if (!check.recordset.length)
      return res.status(403).json({ message: 'Không có quyền truy cập' });

    await pool.request()
      .input('ma_ctc', sql.Int, conversationId)
      .input('ma_nd',  sql.Int, req.user.id)
      .query(`UPDATE tin_nhan SET da_doc = 1 WHERE ma_ctc = @ma_ctc AND ma_nguoi_gui <> @ma_nd AND da_doc = 0`);

    const result = await pool.request()
      .input('ma_ctc', sql.Int, conversationId)
      .query(`
        SELECT t.ma_tn, t.ma_nguoi_gui, t.noi_dung, t.loai, t.anh_url, t.da_doc, t.ngay_tao,
               nd.ho_ten AS ten_nguoi_gui, nd.anh_dai_dien AS avatar_nguoi_gui
        FROM tin_nhan t
        JOIN nguoi_dung nd ON nd.ma_nd = t.ma_nguoi_gui
        WHERE t.ma_ctc = @ma_ctc
        ORDER BY t.ngay_tao ASC
      `);
    res.json({ messages: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/messages — tạo conversation mới + gửi tin đầu tiên
router.post('/', auth(), async (req, res) => {
  const { ma_doi_phuong, ma_phong, noi_dung } = req.body;
  if (!ma_doi_phuong || !noi_dung?.trim())
    return res.status(400).json({ message: 'Thiếu thông tin' });

  try {
    await poolConnect;
    const myId = req.user.id;

    let ma_nd_val, ma_chu_tro_val;
    if (req.user.role === 'user') {
      ma_nd_val = myId;
      ma_chu_tro_val = ma_doi_phuong;
    } else {
      ma_nd_val = ma_doi_phuong;
      ma_chu_tro_val = myId;
    }

    // Tìm conversation đã tồn tại giữa 2 người (bất kể phòng nào)
    const existing = await pool.request()
      .input('ma_nd',      sql.Int, ma_nd_val)
      .input('ma_chu_tro', sql.Int, ma_chu_tro_val)
      .query(`
        SELECT TOP 1 ma_ctc FROM cuoc_tro_chuyen
        WHERE ma_nd = @ma_nd AND ma_chu_tro = @ma_chu_tro
        ORDER BY ngay_tao DESC
      `);

    let ma_ctc;
    if (existing.recordset.length) {
      ma_ctc = existing.recordset[0].ma_ctc;
    } else {
      const created = await pool.request()
        .input('ma_nd',      sql.Int, ma_nd_val)
        .input('ma_chu_tro', sql.Int, ma_chu_tro_val)
        .input('ma_phong',   sql.Int, ma_phong || null)
        .query(`
          INSERT INTO cuoc_tro_chuyen (ma_nd, ma_chu_tro, ma_phong)
          OUTPUT INSERTED.ma_ctc
          VALUES (@ma_nd, @ma_chu_tro, @ma_phong)
        `);
      ma_ctc = created.recordset[0].ma_ctc;
    }

    // Gửi tin nhắn
    const msgRes = await pool.request()
      .input('ma_ctc',       sql.Int,      ma_ctc)
      .input('ma_nguoi_gui', sql.Int,      myId)
      .input('noi_dung',     sql.NVarChar, noi_dung.trim())
      .query(`
        INSERT INTO tin_nhan (ma_ctc, ma_nguoi_gui, noi_dung)
        OUTPUT INSERTED.ma_tn, INSERTED.ngay_tao
        VALUES (@ma_ctc, @ma_nguoi_gui, @noi_dung)
      `);

    const newMsg = {
      ma_tn:        msgRes.recordset[0].ma_tn,
      ngay_tao:     msgRes.recordset[0].ngay_tao,
      noi_dung:     noi_dung.trim(),
      ma_nguoi_gui: myId,
    };

    // Emit socket tới cả 2 người trong conversation
    const io = req.app.get('io');
    if (io) {
      io.to(`conv:${ma_ctc}`).emit('new_message', { ma_ctc, message: newMsg });
      // Notify đối phương dù họ không đang mở conversation này
      io.to(`user:${ma_doi_phuong}`).emit('conversation_updated', { ma_ctc, tin_nhan_cuoi: noi_dung.trim(), thoi_gian_cuoi: newMsg.ngay_tao });
    }

    res.status(201).json({ ma_ctc, message: newMsg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/messages/:conversationId — gửi tin nhắn (text, ảnh, hoặc cả hai)
router.post('/:conversationId', auth(), async (req, res) => {
  const { conversationId } = req.params;
  const { noi_dung, anh_url } = req.body;

  if (!noi_dung?.trim() && !anh_url)
    return res.status(400).json({ message: 'Nội dung không được trống' });

  try {
    await poolConnect;
    const check = await pool.request()
      .input('ma_ctc', sql.Int, conversationId)
      .input('ma_nd',  sql.Int, req.user.id)
      .query(`SELECT ma_nd, ma_chu_tro FROM cuoc_tro_chuyen WHERE ma_ctc = @ma_ctc AND (ma_nd = @ma_nd OR ma_chu_tro = @ma_nd)`);
    if (!check.recordset.length)
      return res.status(403).json({ message: 'Không có quyền truy cập' });

    const conv = check.recordset[0];
    const doiPhuongId = conv.ma_nd === req.user.id ? conv.ma_chu_tro : conv.ma_nd;

    // Xác định loại: image nếu có ảnh, text nếu chỉ có text
    const loai = anh_url ? 'image' : 'text';
    const noiDungLuu = noi_dung?.trim() || (anh_url ? '[Hình ảnh]' : '');

    const msgRes = await pool.request()
      .input('ma_ctc',       sql.Int,               conversationId)
      .input('ma_nguoi_gui', sql.Int,               req.user.id)
      .input('noi_dung',     sql.NVarChar,          noiDungLuu)
      .input('loai',         sql.NVarChar(10),      loai)
      .input('anh_url',      sql.NVarChar(sql.MAX), anh_url || null)
      .query(`
        INSERT INTO tin_nhan (ma_ctc, ma_nguoi_gui, noi_dung, loai, anh_url)
        OUTPUT INSERTED.ma_tn, INSERTED.ngay_tao
        VALUES (@ma_ctc, @ma_nguoi_gui, @noi_dung, @loai, @anh_url)
      `);

    const newMsg = {
      ma_tn:        msgRes.recordset[0].ma_tn,
      ngay_tao:     msgRes.recordset[0].ngay_tao,
      noi_dung:     noiDungLuu,
      loai,
      anh_url:      anh_url || null,
      ma_nguoi_gui: req.user.id,
    };

    // Nếu có cả text lẫn ảnh, lưu thêm 1 tin nhắn text riêng
    let textMsg = null;
    if (anh_url && noi_dung?.trim()) {
      const textRes = await pool.request()
        .input('ma_ctc',       sql.Int,          conversationId)
        .input('ma_nguoi_gui', sql.Int,          req.user.id)
        .input('noi_dung',     sql.NVarChar,     noi_dung.trim())
        .input('loai',         sql.NVarChar(10), 'text')
        .query(`
          INSERT INTO tin_nhan (ma_ctc, ma_nguoi_gui, noi_dung, loai, anh_url)
          OUTPUT INSERTED.ma_tn, INSERTED.ngay_tao
          VALUES (@ma_ctc, @ma_nguoi_gui, @noi_dung, @loai, NULL)
        `);
      textMsg = {
        ma_tn:        textRes.recordset[0].ma_tn,
        ngay_tao:     textRes.recordset[0].ngay_tao,
        noi_dung:     noi_dung.trim(),
        loai:         'text',
        anh_url:      null,
        ma_nguoi_gui: req.user.id,
      };
    }

    const previewSidebar = noi_dung?.trim()
      ? (anh_url ? `🖼 ${noi_dung.trim()}` : noi_dung.trim())
      : '[Hình ảnh]';

    const io = req.app.get('io');
    if (io) {
      // Không emit anh_url (base64) qua socket — quá nặng
      // Người nhận sẽ reload messages để lấy ảnh
      const socketMsg = { ...newMsg, anh_url: anh_url ? '[has_image]' : null };
      io.to(`conv:${conversationId}`).emit('new_message', { ma_ctc: parseInt(conversationId), message: socketMsg });
      if (textMsg) {
        io.to(`conv:${conversationId}`).emit('new_message', { ma_ctc: parseInt(conversationId), message: textMsg });
      }
      io.to(`user:${doiPhuongId}`).emit('conversation_updated', {
        ma_ctc: parseInt(conversationId),
        tin_nhan_cuoi: previewSidebar,
        thoi_gian_cuoi: (textMsg || newMsg).ngay_tao,
      });
    }

    res.status(201).json({ message: newMsg, textMessage: textMsg || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/messages/:conversationId/:messageId — xóa tin nhắn (chỉ của mình)
router.delete('/:conversationId/:messageId', auth(), async (req, res) => {
  const { conversationId, messageId } = req.params;
  try {
    await poolConnect;
    // Chỉ cho xóa tin nhắn của chính mình
    const result = await pool.request()
      .input('ma_tn',        sql.Int, messageId)
      .input('ma_nguoi_gui', sql.Int, req.user.id)
      .query(`DELETE FROM tin_nhan WHERE ma_tn = @ma_tn AND ma_nguoi_gui = @ma_nguoi_gui`);

    if (result.rowsAffected[0] === 0)
      return res.status(403).json({ message: 'Không thể xóa tin nhắn này' });

    // Emit socket để đối phương cũng thấy tin bị xóa
    const io = req.app.get('io');
    if (io) {
      io.to(`conv:${conversationId}`).emit('message_deleted', {
        ma_ctc: parseInt(conversationId),
        ma_tn:  parseInt(messageId),
      });
    }

    res.json({ message: 'Đã xóa' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
