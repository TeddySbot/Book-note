const db = require("../db");

db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(100),
  local VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`, (err) => {
  if (err) console.error("❌ users table error:", err.message);
});

module.exports = db;
