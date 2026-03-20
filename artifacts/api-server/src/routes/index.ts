import { Router, type IRouter } from "express";
import healthRouter from "./health";
import airlinesRouter from "./airlines";
import airportsRouter from "./airports";
import groundHandlersRouter from "./groundHandlers";
import syncRouter from "./sync";
import auditLogsRouter from "./auditLogs";
import statsRouter from "./stats";
import airlineOperationsRouter from "./airlineOperations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(airlinesRouter);
router.use(airportsRouter);
router.use(groundHandlersRouter);
router.use(syncRouter);
router.use(auditLogsRouter);
router.use(statsRouter);
router.use(airlineOperationsRouter);

export default router;
