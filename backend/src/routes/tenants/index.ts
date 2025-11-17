import { Router } from 'express';
import solvencyRouter from './solvency';

const router = Router();

router.use(solvencyRouter);

export default router;
