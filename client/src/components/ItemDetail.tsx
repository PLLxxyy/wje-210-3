import { useState, useEffect } from 'react';
import { User, Item, CATEGORY_COLORS, CATEGORY_ICONS } from '../types';
import { api } from '../api';

interface Props {
  itemId: number;
  user: User | null;
  onBack: () => void;
  onNeedLogin: () => void;
  showToast: (msg: string, type?: string) => void;
}

export default function ItemDetail({ itemId, user, onBack, onNeedLogin, showToast }: Props) {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [selectedMyItem, setSelectedMyItem] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getItem(itemId).then(setItem).catch(() => showToast('物品不存在', 'error')).finally(() => setLoading(false));
  }, [itemId]);

  const handleExchange = async () => {
    if (!user) { onNeedLogin(); return; }
    try {
      const items = await api.getAvailableItems();
      setMyItems(items);
      setShowExchangeModal(true);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const submitExchange = async () => {
    if (!selectedMyItem || !item) return;
    setSubmitting(true);
    try {
      await api.createExchange({ requested_item_id: item.id, offered_item_id: selectedMyItem });
      showToast('交换请求已发送');
      setShowExchangeModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-text">加载中...</div></div>;
  }
  if (!item) {
    return <div className="empty-state"><div className="empty-icon">😕</div><div className="empty-text">物品不存在</div></div>;
  }

  const bgColors: Record<string, string> = {
    '数码': 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
    '服饰': 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
    '书籍': 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    '家居': 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
    '运动': 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    '其他': 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
  };

  const isOwner = user && user.id === item.user_id;
  const canExchange = user && !isOwner && item.status === 'available';

  return (
    <>
      <div className="back-btn" onClick={onBack}>&larr; 返回列表</div>

      <div className="detail-container">
        <div
          className="detail-image"
          style={{ background: bgColors[item.category] || bgColors['其他'] }}
        >
          <span>{CATEGORY_ICONS[item.category] || '📦'}</span>
        </div>
        <div className="detail-info">
          <h2>{item.title}</h2>
          <span className="detail-category" style={{ background: CATEGORY_COLORS[item.category] + '20', color: CATEGORY_COLORS[item.category] }}>
            {item.category}
          </span>
          {item.status === 'exchanged' && (
            <span className="detail-category" style={{ background: '#fee2e2', color: '#dc2626', marginLeft: 8 }}>
              已交换
            </span>
          )}
          <p className="detail-desc">{item.description}</p>
          <div className="detail-expect">
            <strong>期望交换：</strong>{item.expected_item}
          </div>
          {item.photo_desc && (
            <div className="detail-expect" style={{ background: '#fffbeb' }}>
              <strong>物品照片描述：</strong>{item.photo_desc}
            </div>
          )}
          <div className="detail-owner">
            <div className="owner-avatar">{(item.owner_name || '?')[0]}</div>
            <div className="owner-info">
              <div className="owner-name">{item.owner_name}</div>
              <div className="owner-bio">{item.owner_bio || '这个用户很懒，什么都没写'}</div>
              <div className="owner-rating">
                {item.owner_rating_count ? (
                  <>
                    <span className="stars-row">
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} className={`star-sm ${s <= Math.round(Number(item.owner_avg_rating)) ? 'filled' : ''}`}>★</span>
                      ))}
                    </span>
                    <span className="owner-rating-score">{Number(item.owner_avg_rating).toFixed(1)}</span>
                  </>
                ) : null}
                <span className={item.owner_rating_count ? 'owner-rating-count' : 'owner-rating-count zero'}>
                  {item.owner_rating_count || 0} 人评价
                </span>
              </div>
            </div>
          </div>
          {canExchange && (
            <button className="btn btn-primary btn-block" onClick={handleExchange}>
              发起交换
            </button>
          )}
          {isOwner && (
            <p style={{ textAlign: 'center', color: '#888', fontSize: 14 }}>这是你发布的物品</p>
          )}
          {!user && (
            <button className="btn btn-primary btn-block" onClick={onNeedLogin}>
              登录后发起交换
            </button>
          )}
        </div>
      </div>

      {showExchangeModal && (
        <div className="modal-overlay" onClick={() => setShowExchangeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>选择你要交换的物品</h3>
            <p style={{ color: '#888', marginBottom: 16, fontSize: 14 }}>
              选择一件你的闲置物品来交换「{item.title}」
            </p>
            {myItems.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <div className="empty-text">你还没有可交换的物品，先去发布一个吧！</div>
              </div>
            ) : (
              <>
                {myItems.map(mi => (
                  <div
                    key={mi.id}
                    style={{
                      padding: '14px 16px',
                      border: `2px solid ${selectedMyItem === mi.id ? '#667eea' : '#eee'}`,
                      borderRadius: 12,
                      marginBottom: 10,
                      cursor: 'pointer',
                      background: selectedMyItem === mi.id ? '#f8f9ff' : 'white',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setSelectedMyItem(mi.id)}
                  >
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{mi.title}</div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{mi.description}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowExchangeModal(false)}>取消</button>
                  <button className="btn btn-primary" style={{ flex: 1 }} disabled={!selectedMyItem || submitting} onClick={submitExchange}>
                    {submitting ? '发送中...' : '确认交换'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
