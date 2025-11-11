const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

async function initDatabase() {
  const SQL = await initSqlJs();

  const dbPath = path.join(app.getPath("userData"), "app.db");
  let db;

  // Si existe DB en disco, cargarla
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log("📦 Base de datos cargada desde disco:", dbPath);
  } else {
    db = new SQL.Database(); // Nueva DB en memoria
    console.log("📦 Base de datos nueva en memoria");
  }

  // Crear tabla rol si no existe
  db.run(`
    CREATE TABLE IF NOT EXISTS rol (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      number TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insertar roles iniciales solo si no existen
  const result = db.exec("SELECT COUNT(*) AS count FROM rol;");
  const countRol = result[0]?.values[0][0] || 0;

  if (countRol === 0) {
    db.run("INSERT INTO rol (description, number) VALUES (?, ?);", [
      "admin",
      "1",
    ]);
    db.run("INSERT INTO rol (description, number) VALUES (?, ?);", [
      "user",
      "2",
    ]);
    console.log("✅ Roles iniciales insertados (admin, user)");
  } else {
    console.log("📦 Roles ya existentes, no se insertó nada");
  }

  // Guardar la DB en disco
  const data = Buffer.from(db.export());
  fs.writeFileSync(dbPath, data);

  console.log("✅ Base de datos persistida en:", dbPath);

  return db;
}

module.exports = { initDatabase };
