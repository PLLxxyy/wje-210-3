import { Router, Response } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 发起交换请求
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { requested_item_id, offered_item_id } = req.body;
    if (!requested_item_id || !offered_item_id) {
      return res.status(400).json({ error: '请选择要交换的物品' });
    }
    const requestedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(requested_item_id) as any;
    if (!requestedItem) return res.status(404).json({ error: '目标物品不存在' });
    if (requestedItem.user_id === req.userId) return res.status(400).json({ error: '不能交换自己的物品' });
    if (requestedItem.status !== 'available') return res.status(400).json({ error: '该物品不可交换' });

    const offeredItem = db.prepare('SELECT * FROM items WHERE id = ? AND user_id = ?').get(offered_item_id, req.userId) as any;
    if (!offeredItem) return res.status(400).json({ error: '请选择你的物品' });
    if (offeredItem.status !== 'available') return res.status(400).json({ error: '你的物品不可用' });

    const existing = db.prepare(
      "SELECT id FROM exchanges WHERE requester_id = ? AND requested_item_id = ? AND offered_item_id = ? AND status = 'pending'"
    ).get(req.userId, requested_item_id, offered_item_id);
    if (existing) return res.status(400).json({ error: '已发送过相同请求' });

    const result = db.prepare(
      'INSERT INTO exchanges (requester_id, owner_id, requested_item_id, offered_item_id) VALUES (?, ?, ?, ?)'
    ).run(req.userId, requestedItem.user_id, requested_item_id, offered_item_id);

    const exchange = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(result.lastInsertRowid);
    res.json(exchange);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取我发起的请求
router.get('/sent', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const exchanges = db.prepare(`
      SELECT e.*,
        ri.title as requested_title, ri.category as requested_category, ri.photo_desc as requested_photo,
        oi.title as offered_title, oi.category as offered_category, oi.photo_desc as offered_photo,
        u.nickname as owner_name
      FROM exchanges e
      JOIN items ri ON e.requested_item_id = ri.id
      JOIN items oi ON e.offered_item_id = oi.id
      JOIN users u ON e.owner_id = u.id
      WHERE e.requester_id = ?
      ORDER BY e.created_at DESC
    `).all(req.userId);
    res.json(exchanges);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取我收到的请求
router.get('/received', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const exchanges = db.prepare(`
      SELECT e.*,
        ri.title as requested_title, ri.category as requested_category, ri.photo_desc as requested_photo,
        oi.title as offered_title, oi.category as offered_category, oi.photo_desc as offered_photo,
        u.nickname as requester_name
      FROM exchanges e
      JOIN items ri ON e.requested_item_id = ri.id
      JOIN items oi ON e.offered_item_id = oi.id
      JOIN users u ON e.requester_id = u.id
      WHERE e.owner_id = ?
      ORDER BY e.created_at DESC
    `).all(req.userId);
    res.json(exchanges);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 接受或拒绝交换
router.put('/:id/status', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '无效状态' });
    }
    const exchange = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(req.params.id) as any;
    if (!exchange) return res.status(404).json({ error: '请求不存在' });
    if (exchange.owner_id !== req.userId) return res.status(403).json({ error: '无权操作' });
    if (exchange.status !== 'pending') return res.status(400).json({ error: '该请求已处理' });

    db.prepare('UPDATE exchanges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);

    if (status === 'accepted') {
      // 交换完成，标记两个物品为已交换
      db.prepare("UPDATE items SET status = 'exchanged' WHERE id IN (?, ?)").run(exchange.requested_item_id, exchange.offered_item_id);
      // 拒绝其他涉及这两个物品的待处理请求
      db.prepare("UPDATE exchanges SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE status = 'pending' AND (requested_item_id IN (?, ?) OR offered_item_id IN (?, ?)) AND id != ?")
        .run(exchange.requested_item_id, exchange.offered_item_id, exchange.requested_item_id, exchange.offered_item_id, exchange.id);
    }

    const updated = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 提交评价
router.post('/:id/rate', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { score, comment } = req.body;
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: '评分需在1-5之间' });
    }
    const exchange = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(req.params.id) as any;
    if (!exchange) return res.status(404).json({ error: '交换不存在' });
    if (exchange.status !== 'accepted') return res.status(400).json({ error: '交换未完成' });

    let rateeId: number;
    if (exchange.requester_id === req.userId) {
      rateeId = exchange.owner_id;
    } else if (exchange.owner_id === req.userId) {
      rateeId = exchange.requester_id;
    } else {
      return res.status(403).json({ error: '无权评价' });
    }

    const existing = db.prepare('SELECT id FROM ratings WHERE exchange_id = ? AND rater_id = ?').get(exchange.id, req.userId);
    if (existing) return res.status(400).json({ error: '已评价过' });

    const result = db.prepare(
      'INSERT INTO ratings (exchange_id, rater_id, ratee_id, score, comment) VALUES (?, ?, ?, ?, ?)'
    ).run(exchange.id, req.userId, rateeId, score, comment || '');

    const rating = db.prepare('SELECT * FROM ratings WHERE id = ?').get(result.lastInsertRowid);
    res.json(rating);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取交换记录（已完成的）
router.get('/history', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const exchanges = db.prepare(`
      SELECT e.*,
        ri.title as requested_title, ri.photo_desc as requested_photo,
        oi.title as offered_title, oi.photo_desc as offered_photo,
        CASE WHEN e.requester_id = ? THEN owner_u.nickname ELSE requester_u.nickname END as partner_name,
        (SELECT score FROM ratings WHERE exchange_id = e.id AND rater_id = ?) as my_rating,
        (SELECT score FROM ratings WHERE exchange_id = e.id AND ratee_id = ?) as received_rating
      FROM exchanges e
      JOIN items ri ON e.requested_item_id = ri.id
      JOIN items oi ON e.offered_item_id = oi.id
      JOIN users requester_u ON e.requester_id = requester_u.id
      JOIN users owner_u ON e.owner_id = owner_u.id
      WHERE (e.requester_id = ? OR e.owner_id = ?) AND e.status = 'accepted'
      ORDER BY e.updated_at DESC
    `).all(req.userId, req.userId, req.userId, req.userId, req.userId);
    res.json(exchanges);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
