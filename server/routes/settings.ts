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
    // Null-coalesce each column: if the row exists but columns are NULL
    // (e.g. signup inserted only user_id without column defaults), fall back
    // to safe defaults so the client never receives null values.
    // null simulatedToday would cause new Date(null) = epoch 1970 → 0 EL.
    res.json({
      simulatedYear: (row[0] as number) ?? 2026,
      simulatedToday: (row[1] as string) ?? '2026-06-08',
      elCarryForwarded: (row[2] as number) ?? 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { simulatedYear, simulatedToday, elCarryForwarded } = req.body;
    
    if (simulatedYear === undefined || simulatedToday === undefined || elCarryForwarded === undefined) {
      res.status(400).json({ error: 'Missing required settings fields' });
      return;
    }

    // Use INSERT OR REPLACE (UPSERT) so settings persist even if the row
    // is unexpectedly absent (e.g., partial signup or DB hiccup).
    // A bare UPDATE would silently do nothing in that case, causing EL to
    // revert to default on the next page load.
    await db.execute({
      sql: `INSERT INTO user_settings (user_id, simulated_year, simulated_today, el_carry_forwarded)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              simulated_year = excluded.simulated_year,
              simulated_today = excluded.simulated_today,
              el_carry_forwarded = excluded.el_carry_forwarded`,
      args: [userId, simulatedYear, simulatedToday, elCarryForwarded]
    });
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    // UPSERT so reset always works even if the row was absent
    await db.execute({
      sql: `INSERT INTO user_settings (user_id, simulated_year, simulated_today, el_carry_forwarded)
            VALUES (?, 2026, '2026-06-08', 0)
            ON CONFLICT(user_id) DO UPDATE SET
              simulated_year = 2026,
              simulated_today = '2026-06-08',
              el_carry_forwarded = 0`,
      args: [userId]
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
