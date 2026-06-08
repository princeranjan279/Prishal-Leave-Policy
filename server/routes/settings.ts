import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await db.execute({
      sql: 'SELECT simulated_year, simulated_today, el_carry_forwarded FROM user_settings WHERE user_id = ?',
      args: [userId]
    });

    if (result.rows.length === 0) {
      res.json({ simulatedYear: 2026, simulatedToday: '2026-06-08', elCarryForwarded: 0 });
      return;
    }

    const row = result.rows[0];
    res.json({
      simulatedYear: row[0] as number,
      simulatedToday: row[1] as string,
      elCarryForwarded: row[2] as number
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { simulatedYear, simulatedToday, elCarryForwarded } = req.body;
    
    await db.execute({
      sql: 'UPDATE user_settings SET simulated_year = ?, simulated_today = ?, el_carry_forwarded = ? WHERE user_id = ?',
      args: [simulatedYear, simulatedToday, elCarryForwarded, userId]
    });
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await db.execute({
      sql: "UPDATE user_settings SET simulated_year = 2026, simulated_today = '2026-06-08', el_carry_forwarded = 0 WHERE user_id = ?",
      args: [userId]
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
