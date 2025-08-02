import { Request, Response } from "express";
import pool from "../db";//MySQL 연결

//함수 getAllPayroll 전체 급여 데이터 조회
export async function getAllPayroll(req: Request, res: Response) {
  try {
    const [rows] = await pool.query("SELECT * FROM Payroll");
    res.json(rows); //결과 호출
  } catch (err) {
    res.status(500).json({ error: "급여 조회 실패", detail: err });
  }
}
//함수 getPayrollByStaffAndMonth 원하는 staff의 급여 조회
export async function getPayrollByStaffAndMonth(req: Request, res: Response) {
  const { staff_id, month } = req.body;
  if(!staff_id || !month){
    return res.status(400).json({message: "staff_id와 month를 입력해주세요."});
   }
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Payroll WHERE staff_id = ? AND month = ?",
      [staff_id, month]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "급여 상세 조회 실패", detail: err });
  }
}

//함수 insertAndCalculatePayroll 수당 계산+db에 해당 데이터 삽입
export async function insertAndCalculatePayroll(req: Request, res: Response) {
  try {
    const { staff_id, base_hours, month } = req.body;

    if (!staff_id || !base_hours || !month) {
      return res.status(400).json({ message: "staff_id, base_hours,month를 입력해주세요." });
    }
    //staff 테이블에서 시급 가져오기
    const [staffRows] = await pool.query("SELECT hourly_wage FROM Staff WHERE staff_id = ?", [staff_id]);
    if ((staffRows as any[]).length === 0) {
      return res.status(404).json({ error: "해당 staff_id를 가진 직원이 존재하지 않습니다." });
    }

    const hourly_wage = (staffRows as any)[0].hourly_wage;

    //급여 계산 로직
    const base_pay = base_hours * hourly_wage; //기본급=근무 시간*시급
    // 주휴수당: 주 15시간 이상 근무 시 시급 × 1일 근무시간
    const eligibleForHoliday = base_hours >= 60; // 주 15시간 × 4주(60시간)
    const daily_hours = base_hours / 30; // 대략 30일 근무 기준(평균 1일 근무 시간)
    const holiday_pay = eligibleForHoliday ? hourly_wage * daily_hours : 0; //자격이 있음->주휴수당 계산, 자격 없음->주휴수당 0원
    const pre_tax_total = base_pay + holiday_pay; //세금 전 총 급여
    const tax_deduction = Math.floor(pre_tax_total * 0.033); // 3.3% 세금 원천징수
    const total_pay = pre_tax_total - tax_deduction; //지급될 총 급여
    const generated_at = Date.now(); //현재 시간을 밀리초 단위로 저장

    //db 삽입 로직
    const [result] = await pool.execute(
      `INSERT INTO Payroll (staff_id, month, base_hours, base_pay, holiday_pay, tax_deduction, total_pay, generated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [staff_id, month, base_hours, base_pay, holiday_pay, tax_deduction, total_pay, generated_at]
    );

    res.status(201).json({
      message: "급여 계산 및 저장 완료",
      id: (result as any).insertId,
      data: {
        staff_id,
        month,
        base_hours,
        base_pay,
        holiday_pay,
        tax_deduction,
        total_pay,
        generated_at,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "급여 계산 또는 저장 실패", detail: error });
  }
}
