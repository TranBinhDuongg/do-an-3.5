const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const config = {
  connectionString:
    `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};Trusted_Connection=yes;TrustServerCertificate=yes;`,
  driver: 'msnodesqlv8',
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

poolConnect.catch(err => console.error('DB connection failed:', err));

module.exports = { pool, poolConnect, sql };
