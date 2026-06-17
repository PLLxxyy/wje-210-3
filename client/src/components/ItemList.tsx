import { useState, useEffect } from 'react';
import { User, Item, CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from '../types';
import { api } from '../api';

interface Props {
  user: User | null;
  onViewItem: (id: number) => void;
  onNeedLogin: () => void;
  showToast: (msg: string, type?: string) => void;
}

export default function ItemList({ user, onViewItem, onNeedLogin, showToast }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [category, setCategory] = useState('全部');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 12;

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await api.getItems({ category, search, page, limit });
      setItems(data.items);
      setTotal(data.total);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, search, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  const bgColors: Record<string, string> = {
    '数码': 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
    '服饰': 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
    '书籍': 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    '家居': 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
    '运动': 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    '其他': 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
  };

  return (
    <div>
      <div className="search-bar">
        <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, gap: 12, minWidth: 200 }}>
          <input
            className="search-input"
            placeholder="搜索闲置物品..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">搜索</button>
        </form>
      </div>

      <div className="category-tabs" style={{ marginBottom: 24 }}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`category-tab ${category === c ? 'active' : ''}`}
            onClick={() => { setCategory(c); setPage(1); }}
          >
            {c !== '全部' && CATEGORY_ICONS[c]} {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <div className="empty-text">加载中...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-text">暂无物品，快来发布第一个闲置吧！</div>
        </div>
      ) : (
        <>
          <div className="items-grid">
            {items.map(item => (
              <div key={item.id} className="item-card" onClick={() => onViewItem(item.id)}>
                <div
                  className="item-card-img"
                  style={{ background: bgColors[item.category] || bgColors['其他'] }}
                >
                  <span style={{ fontSize: 64 }}>{CATEGORY_ICONS[item.category] || '📦'}</span>
                  <span className="category-badge" style={{ background: CATEGORY_COLORS[item.category] }}>
                    {item.category}
                  </span>
                </div>
                <div className="item-card-body">
                  <div className="item-card-title">{item.title}</div>
                  <div className="item-card-desc">{item.description}</div>
                  <div className="item-card-expect">期望交换：{item.expected_item}</div>
                  <div className="item-card-rating">
                    {item.owner_rating_count ? (
                      <>
                        <span className="rating-star">★</span>
                        <span className="rating-score">{Number(item.owner_avg_rating).toFixed(1)}</span>
                        <span className="rating-count">{item.owner_rating_count}人评价</span>
                      </>
                    ) : (
                      <span className="rating-none">暂无评价</span>
                    )}
                  </div>
                  <div className="item-card-meta">
                    <div className="item-card-owner">
                      <div className="mini-avatar">{(item.owner_name || '?')[0]}</div>
                      <span>{item.owner_name}</span>
                    </div>
                    <span>{new Date(item.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
