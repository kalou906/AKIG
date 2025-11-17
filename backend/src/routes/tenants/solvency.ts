
import { Router, Request, Response, NextFunction } from 'express';
import { param, query } from 'express-validator';
import { validateRequest } from '../../middleware/validateRequest';
import { handleAsync } from '../../middleware/handleAsync';
import { cacheMiddleware } from '../../middleware/cache';
import { solvencyService } from '../../container';

const router = Router();

// GET /tenants/:id/solvency
router.get(
  '/:id/solvency',
  [
    param('id').isUUID(4).withMessage('Invalid UUID format for tenant ID'),
    query('detailed').optional().isBoolean().withMessage('detailed must be boolean'),
    query('recalculate').optional().isBoolean().withMessage('recalculate must be boolean'),
    validateRequest,
  ],
  cacheMiddleware({ ttl: 300 }),
  handleAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const detailed = req.query.detailed === 'true';
    const recalculate = req.query.recalculate === 'true';
    const result = await solvencyService.calculateScore(id, { detailed, recalculate });
    return res.status(200).json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        cached: res.locals.cached || false,
      },
    });
  })
);

export default router;
