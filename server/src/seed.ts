import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '..', 'data.db');

// 删除旧数据库
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('已清除旧数据库');
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    expected_item TEXT NOT NULL,
    photo_desc TEXT DEFAULT '',
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS exchanges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    requested_item_id INTEGER NOT NULL,
    offered_item_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (requested_item_id) REFERENCES items(id),
    FOREIGN KEY (offered_item_id) REFERENCES items(id)
  );
  CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exchange_id INTEGER NOT NULL,
    rater_id INTEGER NOT NULL,
    ratee_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    comment TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exchange_id) REFERENCES exchanges(id),
    FOREIGN KEY (rater_id) REFERENCES users(id),
    FOREIGN KEY (ratee_id) REFERENCES users(id)
  );
`);

// 种子数据
const password = bcrypt.hashSync('123456', 10);

const insertUser = db.prepare('INSERT INTO users (username, password, nickname, avatar, bio) VALUES (?, ?, ?, ?, ?)');
const users = [
  ['alice', password, '小爱', '', '喜欢收集各种数码产品'],
  ['bob', password, '小波', '', '运动达人，有很多闲置运动装备'],
  ['carol', password, '小卡', '', '书籍爱好者，看过的书想分享'],
  ['dave', password, '大卫', '', '家居设计师，有很多好物'],
  ['eve', password, '小伊', '', '时尚达人，衣服太多了'],
  ['frank', password, '老范', '', '数码发烧友'],
];
const userIds = users.map(u => insertUser.run(...u).lastInsertRowid);

const insertItem = db.prepare('INSERT INTO items (user_id, title, description, category, expected_item, photo_desc) VALUES (?, ?, ?, ?, ?, ?)');
const items = [
  [userIds[0], 'iPad Air 5', '去年买的iPad Air 5，64G WiFi版，紫色，成色很好，配有官方保护壳和Apple Pencil 2代', '数码', '耳机或智能手表', '紫色iPad Air，屏幕干净无划痕'],
  [userIds[0], '索尼WH-1000XM4', '降噪耳机，黑色，音质很好，电池续航长，附带耳机包和充电线', '数码', '机械键盘或蓝牙音箱', '黑色头戴式耳机，状态良好'],
  [userIds[1], 'Nike Air Zoom跑鞋', 'US 10码，只穿过3次，几乎全新，适合跑步和健身', '运动', '运动手表或健身器材', '黑白配色跑鞋，鞋底干净'],
  [userIds[1], '瑜伽垫加阻力带套装', '包含瑜伽垫、弹力带5条、瑜伽砖2块，紫色系，买多了一套', '运动', '哑铃或跳绳', '紫色瑜伽套装，全新未拆'],
  [userIds[2], '三体全集', '刘慈欣著，精装版三册，保存完好，只读过一遍', '书籍', '科幻类或推理小说', '三本精装书，深蓝色封面'],
  [userIds[2], 'JavaScript高级程序设计', '第4版，红宝书，有少量笔记标注，内容完整', '书籍', '编程类书籍', '红色封面的技术书籍'],
  [userIds[3], '宜家台灯', 'IKEA TERTIAL工作灯，银色，九成新，可以调节角度', '家居', '收纳用品或装饰品', '银色宜家台灯，金属材质'],
  [userIds[3], '北欧风花瓶', '白色陶瓷花瓶，高25cm，简约北欧风格，搬家带不走', '家居', '香薰蜡烛或摆件', '白色简约花瓶，造型优美'],
  [userIds[4], '优衣库羽绒服', 'L码，黑色轻型羽绒服，去年冬天买的，穿了几次', '服饰', '外套或卫衣', '黑色轻薄羽绒服，状态良好'],
  [userIds[4], '帆布托特包', '米白色大容量帆布包，适合通勤和逛街，几乎全新', '服饰', '斜挎包或双肩包', '米白色帆布包，容量很大'],
  [userIds[5], '机械键盘', 'Cherry红轴，87键，白色背光，手感很好，换了新键盘所以出', '数码', '鼠标或显示器支架', '白色机械键盘，紧凑布局'],
  [userIds[5], '小米智能音箱', '小米小爱音箱Pro，音质不错，可控制智能家居，闲置转让', '数码', '耳机或充电宝', '黑色圆柱形智能音箱'],
];

items.forEach(item => insertItem.run(...item));

// 添加一些交换记录
const insertExchange = db.prepare('INSERT INTO exchanges (requester_id, owner_id, requested_item_id, offered_item_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
// 已完成的交换
insertExchange.run(userIds[1], userIds[0], 1, 3, 'accepted', '2026-06-01 10:00:00', '2026-06-02 15:00:00');
// 待处理的请求
insertExchange.run(userIds[2], userIds[0], 2, 5, 'pending', '2026-06-10 09:00:00', '2026-06-10 09:00:00');
insertExchange.run(userIds[4], userIds[1], 3, 9, 'pending', '2026-06-11 14:00:00', '2026-06-11 14:00:00');

// 已拒绝的交换
insertExchange.run(userIds[3], userIds[2], 5, 7, 'rejected', '2026-06-05 11:00:00', '2026-06-06 08:00:00');

// 评价
const insertRating = db.prepare('INSERT INTO ratings (exchange_id, rater_id, ratee_id, score, comment) VALUES (?, ?, ?, ?, ?)');
insertRating.run(1, userIds[1], userIds[0], 5, '物品和描述完全一致，非常满意！');
insertRating.run(1, userIds[0], userIds[1], 4, '鞋子很新，沟通也很顺畅');

// 更新已交换物品的状态
db.prepare("UPDATE items SET status = 'exchanged' WHERE id IN (1, 3)").run();

console.log('种子数据创建完成！');
console.log(`创建了 ${users.length} 个用户，${items.length} 个物品，4 条交换记录，2 条评价`);
console.log('测试账号密码均为: 123456');

db.close();
