// lib/db.js
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "repair_system",
  waitForConnections: true,
});

export default pool;


