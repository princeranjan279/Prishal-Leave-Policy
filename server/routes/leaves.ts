import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();

    const result = await db.execute({
      sql: 'SELECT id, type, start_date, end_date, days, reason, created_at FROM leave_records WHERE user_id = ? AND year = ? ORDER BY start_date ASC',
      args: [userId, year]
    });

    const leaves = result.rows.map(row => ({
      id: row[0] as string,
      type: row[1] as string,
      startDate: row[2] as string,
      endDate: row[3] as string,
      days: row[4] as number,
      reason: row[5] as string,
      createdAt: row[6] as string
    }));

    res.json(leaves);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { year, type, startDate, endDate, days, reason } = req.body;
    
    if (!year || !type || !startDate || !endDate || days === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const id = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();

    await db.execute({
      sql: 'INSERT INTO leave_records (id, user_id, year, type, start_date, end_date, days, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, userId, year, type, startDate, endDate, days, reason || '', now]
    });

    res.json({ id, year, type, startDate, endDate, days, reason, createdAt: now });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await db.execute({
      sql: 'DELETE FROM leave_records WHERE id = ? AND user_id = ?',
      args: [id, userId]
    });

    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Leave record not found or unauthorized' });
      return;
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await db.execute({
      sql: 'DELETE FROM leave_records WHERE user_id = ?',
      args: [userId]
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
