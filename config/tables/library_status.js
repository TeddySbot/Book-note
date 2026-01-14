const db = require("../db");

db.run(`
CREATE TABLE IF NOT EXISTS library_status (
  user_id INTEGER NOT NULL,
  api_book_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL, -- favoris | en_cours | deja_lu
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, api_book_id, status),
  FOREIGN KEY (user_id) REFERENCES users(id)
)
`, (err) => {
  if (err) console.error("❌ library_status table error:", err.message);
  else console.log("✅ Table library_status prête");
});

module.exports = db;
