import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentProfilesRouter from "./student-profiles";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studentProfilesRouter);

export default router;
