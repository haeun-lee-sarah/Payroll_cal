import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../db";  // MySQL 연결 객체

const router = Router();

router.post("/register", async (req, res) => {
  const { userid, username, password, role } = req.body;

  if (!userid || !username || !password || !role ) {
    return res.status(400).json({ message: "아이디와 이름, 비밀번호, 역할(알바생/직원/사장)을 입력해주세요." });
  }

    const allowedRoles = ["알바생", "직원", "사장"];
    if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "유효하지 않은 역할입니다." });
    }


  try {
    // 1. 아이디 중복 체크
    const [rows]: any = await pool.query(
      "SELECT * FROM usertbl WHERE userid = ?",
      [userid]
    );
    if (rows.length > 0) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }

    // 2. 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. DB에 저장
    await pool.query(
      "INSERT INTO usertbl (userid, username, password, role) VALUES (?, ?, ?, ?)",
      [userid, username, hashedPassword, role]
    );

    res.status(201).json({ message: "회원가입 성공!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});


//로그인
router.post("/login", async (req, res) => {
  const { userid, password } = req.body;

  if (!userid || !password) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력해주세요." });
  }

  try {
    // 1. 유저 검색
    const [rows]: any = await pool.query(
      "SELECT * FROM usertbl WHERE userid = ?",
      [userid]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "존재하지 않는 아이디입니다." });
    }

    const user = rows[0];

    // 2. 비밀번호 검증
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호가 틀렸습니다." });
    }

    // 3. 로그인 성공
    res.status(200).json({
      message: "로그인 성공!",
      userid: user.userid,
      username: user.username,
      role: user.role,   
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

export default router;