const db = require("../db");

db.run(`
CREATE TABLE IF NOT EXISTS auth_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider VARCHAR(50) NOT NULL, -- local | google
  password_hash VARCHAR(255),
  provider_id VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
`, (err) => {
  if (err) console.error("❌ auth_providers table error:", err.message);
  else console.log("✅ Table auth_providers prête");
});

module.exports = db;
