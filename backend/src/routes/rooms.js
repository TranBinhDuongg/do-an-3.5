const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');

const router = express.Router();

// Helper: format thời gian đăng
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `${mins} phút trước`;
  if (hours < 24)  return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

function formatRoom(r) {
  return {
    id:          r.id,
    title:       r.title,
    type:        r.type,
    city:        r.city,
    address:     r.address,
    price:       r.price,
    area:        r.area,
    available:   r.is_available,
    isFeatured:  r.is_featured,
    image:       r.cover_image || r.first_image || null,
    postedAt:    timeAgo(r.created_at),
  };
}

// GET /api/rooms?keyword=&city=&type=&minPrice=&maxPrice=&minArea=&sort=&page=
router.get('/', async (req, res) => {
  const { keyword, city, type, minPrice, maxPrice, minArea, sort = 'newest', page = 1 } = req.query;
  const limit  = 12;
  const offset = (parseInt(page) - 1) * limit;

  try {
    await poolConnect;
    const req1 = pool.request()
      .input('keyword',  sql.NVarChar, keyword  || null)
      .input('city',     sql.NVarChar, city     || null)
      .input('type',     sql.NVarChar, type     || null)
      .input('minPrice', sql.Decimal,  minPrice ? parseFloat(minPrice) : null)
      .input('maxPrice', sql.Decimal,  maxPrice ? parseFloat(maxPrice) : null)
      .input('minArea',  sql.Decimal,  minArea  ? parseFloat(minArea)  : null)
      .input('sort',     sql.NVarChar, sort)
      .input('limit',    sql.Int,      limit)
      .input('offset',   sql.Int,      offset);

    const req2 = pool.request()
      .input('keyword',  sql.NVarChar, keyword  || null)
      .input('city',     sql.NVarChar, city     || null)
      .input('type',     sql.NVarChar, type     || null)
      .input('minPrice', sql.Decimal,  minPrice ? parseFloat(minPrice) : null)
      .input('maxPrice', sql.Decimal,  maxPrice ? parseFloat(maxPrice) : null)
      .input('minArea',  sql.Decimal,  minArea  ? parseFloat(minArea)  : null);

    const [roomsResult, countResult] = await Promise.all([
      req1.execute('sp_GetRooms'),
      req2.execute('sp_CountRooms'),
    ]);

    const rooms = roomsResult.recordset.map(formatRoom);
    const total = countResult.recordset[0].total;

    return res.json({ rooms, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/rooms/home  - trang chủ: new + featured + stats
router.get('/home', async (req, res) => {
  try {
    await poolConnect;
    const [newRes, featRes, statsRes] = await Promise.all([
      pool.request().input('limit', sql.Int, 6).execute('sp_GetNewRooms'),
      pool.request().input('limit', sql.Int, 6).execute('sp_GetFeaturedRooms'),
      pool.request().execute('sp_GetStats'),
    ]);

    return res.json({
      newRooms:      newRes.recordset.map(formatRoom),
      featuredRooms: featRes.recordset.map(formatRoom),
      stats:         statsRes.recordset[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
