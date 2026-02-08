import { Router, type Response } from 'express';
import { requireAuth, loadUser, type AppRequest } from '../../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, loadUser, (req: AppRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not found' } });
  res.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      wholesalerId: user.wholesalerId,
    },
  });
});

export default router;
