// src/main/database.js
const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

let db = null;

function initDatabase() {
  const dbPath = path.join(app.getPath("userData"), "app.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL"); // Mejora rendimiento y seguridad

  console.log("📦 Inicializando base de datos en:", dbPath);

  // === CREATE TABLES ===

  // ROL
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS rol (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      number TEXT NOT NULL,
      created_at DATETIME DEFAULT (datetime('now'))
    )
  `
  ).run();

  // USERS
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lastname TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT (datetime('now')),
      rol_id INTEGER NOT NULL,
      FOREIGN KEY (rol_id) REFERENCES rol(id)
    )
  `
  ).run();

  console.log("✅ Tablas creadas (si no existían).");
  return db;
}

function getDb() {
  if (!db) {
    throw new Error(
      "❌ Database not initialized! Llama a initDatabase() primero."
    );
  }
  return db;
}

module.exports = { initDatabase, getDb };
