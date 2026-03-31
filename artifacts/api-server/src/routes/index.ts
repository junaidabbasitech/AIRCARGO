import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import airlinesRouter from "./airlines";
import airportsRouter from "./airports";
import groundHandlersRouter from "./groundHandlers";
import syncRouter from "./sync";
import auditLogsRouter from "./auditLogs";
import statsRouter from "./stats";
import airlineOperationsRouter from "./airlineOperations";
import importExportRouter from "./importExport";
import duplicatesRouter from "./duplicates";
import awbSearchRouter from "./awbSearch";
import userRequestsRouter from "./userRequests";
import dbAdminRouter from "./dbAdmin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(airlinesRouter);
router.use(airportsRouter);
router.use(groundHandlersRouter);
router.use(syncRouter);
router.use(auditLogsRouter);
router.use(statsRouter);
router.use(airlineOperationsRouter);
router.use(importExportRouter);
router.use(duplicatesRouter);
router.use(awbSearchRouter);
router.use(userRequestsRouter);
router.use(dbAdminRouter);

export default router;
