const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool, poolConnect, sql } = require('./db');

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    await poolConnect;
    const email  = profile.emails?.[0]?.value || '';
    const name   = profile.displayName || '';
    const avatar = profile.photos?.[0]?.value || '';
    const role   = ['user', 'employer'].includes(req.query.state) ? req.query.state : 'user';

    const result = await pool.request()
      .input('google_id',    sql.NVarChar, profile.id)
      .input('ho_ten',       sql.NVarChar, name)
      .input('email',        sql.NVarChar, email)
      .input('anh_dai_dien', sql.NVarChar, avatar)
      .input('vai_tro',      sql.NVarChar, role)
      .execute('sp_DangNhapGoogle');

    const user = result.recordset[0];
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.ma_nd));
passport.deserializeUser(async (id, done) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd', sql.Int, id)
      .execute('sp_LayHoSo');
    done(null, result.recordset[0]);
  } catch (err) {
    done(err, null);
  }
});
