require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const session = require('express-session');
const passport = require('passport');
require('./src/config/passport');

const app = express();

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
app.use('/api/admin',   require('./src/routes/admin'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/reviews',      require('./src/routes/reviews'));
app.use('/api/wallet',       require('./src/routes/wallet'));
app.use('/api/admin',        require('./src/routes/payment_admin'));

// Health check
app.get('/', (req, res) => res.json({ message: 'PhòngTrọVN API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
