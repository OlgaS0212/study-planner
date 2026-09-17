const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "study-planner.db");
const schemaPath = path.join(__dirname, "schema.sql");

const db = new Database(dbPath);

// Enable foreign key enforcement
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

module.exports = db;