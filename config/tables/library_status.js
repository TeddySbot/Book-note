const db = require("../db");

db.run(`
CREATE TABLE IF NOT EXISTS library_status (
  user_id INTEGER NOT NULL,
  api_book_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, api_book_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, api_book_id)
)
`, (err) => {
  if (err) console.error("❌ library_status table error:", err.message);
});

module.exports = db;
