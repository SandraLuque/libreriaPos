const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

async function initDatabase() {
  const SQL = await initSqlJs();

  const dbPath = path.join(app.getPath("userData"), "app.db");
  let db;

  // CREATE DB IF NOT EXISTING
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log("📦 DB loaded from disk:", dbPath);
  } else {
    db = new SQL.Database();
    console.log("📦 New DB created on disk");
  }

  // CREATE ROL TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS rol (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code INTEGER UNIQUE NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // CREATE SATUS TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code INTEGER UNIQUE NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // INSERT ROLS IF NOT EXISTING
  const resultRol = db.exec("SELECT COUNT(*) AS count FROM rol;");
  const countRol = resultRol[0]?.values[0][0] || 0;

  if (countRol === 0) {
    db.run("INSERT INTO rol (code, description) VALUES (?, ?);", [
      "1",
      "admin",
    ]);
    db.run("INSERT INTO rol (code, description) VALUES (?, ?);", ["2", "user"]);
    console.log("✅ Roles inserted (admin, user)");
  } else {
    console.log("📦 Roles already exist");
  }

  // INSERT STATUS IF NOT EXISTING
  const resultStatus = db.exec("SELECT COUNT(*) AS count FROM status;");
  const countStatus = resultStatus[0]?.values[0][0] || 0;

  if (countStatus === 0) {
    db.run("INSERT INTO status (code, description) VALUES (?, ?);", [
      "0",
      "desactive",
    ]);
    db.run("INSERT INTO status (code, description) VALUES (?, ?);", [
      "1",
      "active",
    ]);
    db.run("INSERT INTO status (code, description) VALUES (?, ?);", [
      "3",
      "paid",
    ]);
    db.run("INSERT INTO status (code, description) VALUES (?, ?);", [
      "4",
      "debt",
    ]);
    console.log("✅ Status inserted (desactive, active, paid, debt)");
  } else {
    console.log("📦 Status already exist");
  }

  // CREATE USER TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lastname TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol_id INTEGER NOT NULL,
      status_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      delete_at DATETIME DEFAULT NULL,
      FOREIGN KEY (rol_id) REFERENCES rol(id),
      FOREIGN KEY (status_id) REFERENCES status(id)
    );
  `);

  // CREATE CUSTOMER TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS customer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lastname TEXT NOT NULL,
      phone TEXT UNIQUE,
      status_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      delete_at DATETIME DEFAULT NULL,
      FOREIGN KEY (status_id) REFERENCES status(id)
    );
  `);

  // CREATE CATEGORY TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      status_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      delete_at DATETIME DEFAULT NULL,
      FOREIGN KEY (status_id) REFERENCES status(id)
    );
  `);

  // CREATE PRODUCT TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS product (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code_sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      cost_price INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      status_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      delete_at DATETIME DEFAULT NULL,
      FOREIGN KEY (category_id) REFERENCES category(id),
      FOREIGN KEY (status_id) REFERENCES status(id)
    );
  `);

  // CREATE SALE TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS sale (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_amount INTEGER NOT NULL,
      paid_amount INTEGER NOT NULL,
      customer_id INTEGER,
      status_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      delete_at DATETIME DEFAULT NULL,
      FOREIGN KEY (status_id) REFERENCES status(id),
      FOREIGN KEY (customer_id) REFERENCES customer(id),
      FOREIGN KEY (user_id) REFERENCES user(id)
    );
  `);

  // CREATE SALE DETAIL TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS sale_detail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      subt_price INTEGER NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sale(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES product(id)
    );
  `);

  // CREATE PAYMENT TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS payment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount INTEGER NOT NULL,
      note TEXT,
      sale_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sale(id)
    );
  `);

  // SAVE DB
  const data = Buffer.from(db.export());
  fs.writeFileSync(dbPath, data);
  console.log("✅ DB persisted to disk:", dbPath);

  return db;
}

module.exports = { initDatabase };
