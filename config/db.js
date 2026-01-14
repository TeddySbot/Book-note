const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../database.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Erreur DB :", err.message);
  } else {
    console.log("✅ DB SQLite connectée");
  }
});

module.exports = db;
