require('dotenv').config();
const express = require('express');
const http    = require('http');
const cors    = require('cors');
const session = require('express-session');
const passport = require('passport');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('./src/config/passport');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', credentials: true },
});

// Xác thực socket bằng JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Chưa xác thực'));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Token không hợp lệ'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user.id;

  // Mỗi user join room riêng theo userId để nhận tin nhắn
  socket.join(`user:${userId}`);

  // Join vào conversation room khi user mở chat
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv:${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conv:${conversationId}`);
  });

  socket.on('disconnect', () => {});
});

// Export io để dùng trong routes
app.set('io', io);

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth',    require('./src/routes/auth'));
app.use('/api/profile', require('./src/routes/profile'));
app.use('/api/rooms',     require('./src/routes/rooms'));
app.use('/api/favorites', require('./src/routes/favorites'));
app.use('/api/employer', require('./src/routes/employer'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/admin',   require('./src/routes/admin'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/reviews',      require('./src/routes/reviews'));
app.use('/api/wallet',       require('./src/routes/wallet'));
app.use('/api/admin',        require('./src/routes/payment_admin'));
app.use('/api/messages',     require('./src/routes/messages'));
app.use('/api/bookings',     require('./src/routes/bookings'));
app.use('/api/contracts',    require('./src/routes/contracts'));
app.use('/api/maintenance',  require('./src/routes/maintenance'));

app.get('/', (req, res) => res.json({ message: 'ThueNhaVN API running' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
