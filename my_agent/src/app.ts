import  Express  from "express";
import pool from "./db";
import authrouter from "./routes/auth";
import payrollRouter from "./routes/payroll";
import bodyParser from "body-parser";
import cors from "cors";

const app = Express();
const PORT = 3000;

app.use(Express.json());
app.use("/auth", authrouter);
app.use("/api/payroll",payrollRouter);
app.use(cors());

app.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    console.log(rows);
    res.send(" MySQL 연결 성공! 서버 시간: " + (rows as any)[0].now);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB 연결 실패");
  }
});

app.listen(PORT, ()=> {
    console.log(` Server is running on http://localhost:${PORT}`)
})