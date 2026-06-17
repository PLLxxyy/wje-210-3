import { Router, Response } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 获取物品列表（支持筛选和搜索）
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { category, search, page = '1', limit = '12' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = ["items.status = 'available'"];
    const params: any[] = [];

    if (category && category !== '全部') {
      conditions.push('items.category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push('(items.title LIKE ? OR items.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    const where = 'WHERE ' + conditions.join(' AND ');

    const total = (db.prepare(`SELECT COUNT(*) as total FROM items ${where}`).get(...params) as any).total;

    const items = db.prepare(`
      SELECT items.*, users.nickname as owner_name, users.avatar as owner_avatar,
        (SELECT ROUND(AVG(r.score), 1) FROM ratings r WHERE r.ratee_id = items.user_id) as owner_avg_rating,
        (SELECT COUNT(*) FROM ratings r WHERE r.ratee_id = items.user_id) as owner_rating_count
      FROM items JOIN users ON items.user_id = users.id ${where}
      ORDER BY items.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取物品详情
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const item = db.prepare(`
      SELECT items.*, users.nickname as owner_name, users.avatar as owner_avatar, users.bio as owner_bio,
        (SELECT ROUND(AVG(r.score), 1) FROM ratings r WHERE r.ratee_id = items.user_id) as owner_avg_rating,
        (SELECT COUNT(*) FROM ratings r WHERE r.ratee_id = items.user_id) as owner_rating_count
      FROM items JOIN users ON items.user_id = users.id WHERE items.id = ?
    `).get(req.params.id) as any;
    if (!item) return res.status(404).json({ error: '物品不存在' });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 发布物品
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, expected_item, photo_desc } = req.body;
    if (!title || !description || !category || !expected_item) {
      return res.status(400).json({ error: '请填写完整信息' });
    }
    const result = db.prepare(
      'INSERT INTO items (user_id, title, description, category, expected_item, photo_desc) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.userId, title, description, category, expected_item, photo_desc || '');
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 更新物品
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as any;
    if (!item) return res.status(404).json({ error: '物品不存在' });
    if (item.user_id !== req.userId) return res.status(403).json({ error: '无权修改' });

    const { title, description, category, expected_item, photo_desc, status } = req.body;
    db.prepare(
      'UPDATE items SET title=?, description=?, category=?, expected_item=?, photo_desc=?, status=? WHERE id=?'
    ).run(
      title || item.title, description || item.description, category || item.category,
      expected_item || item.expected_item, photo_desc ?? item.photo_desc,
      status || item.status, req.params.id
    );
    const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 删除物品
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as any;
    if (!item) return res.status(404).json({ error: '物品不存在' });
    if (item.user_id !== req.userId) return res.status(403).json({ error: '无权删除' });
    db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
    res.json({ message: '已删除' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取我的发布
router.get('/user/mine', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const items = db.prepare('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取用户可用来交换的物品
router.get('/user/available', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const items = db.prepare("SELECT * FROM items WHERE user_id = ? AND status = 'available' ORDER BY created_at DESC").all(req.userId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
