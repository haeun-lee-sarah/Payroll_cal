import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "127.0.0.1", // localhost
  user: "root",      // MySQL 사용자명
  password: "heesoo0921!",      // MySQL 비밀번호
  database: "userdb", // 데이터베이스 이름
});

export default pool;
