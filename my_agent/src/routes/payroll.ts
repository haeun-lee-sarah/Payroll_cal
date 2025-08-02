import express from "express";
import {
  getAllPayroll,
  getPayrollByStaffAndMonth,
  insertAndCalculatePayroll,
} from "../controllers/payroll";

const router = express.Router();

//전체 급여 조회
router.get("/", getAllPayroll);
//특정 staff 급여 월별 조회
router.get("/:staffId/:month", getPayrollByStaffAndMonth);
//급여 계산+db삽입
router.post("/calculate-and-insert", insertAndCalculatePayroll);

export default router;
