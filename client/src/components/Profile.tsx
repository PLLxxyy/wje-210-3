import { useState, useEffect } from 'react';
import { User, Item, Exchange, CATEGORY_ICONS } from '../types';
import { api } from '../api';

interface Props {
  user: User;
  setUser: (u: User) => void;
  onViewItem: (id: number) => void;
  onPublish: () => void;
  showToast: (msg: string, type?: string) => void;
}

type TabKey = 'items' | 'received' | 'sent' | 'history';

export default function Profile({ user, setUser, onViewItem, onPublish, showToast }: Props) {
  const [tab, setTab] = useState<TabKey>('items');
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [received, setReceived] = useState<Exchange[]>([]);
  const [sent, setSent] = useState<Exchange[]>([]);
  const [history, setHistory] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratingModal, setRatingModal] = useState<Exchange | null>(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editNickname, setEditNickname] = useState(user.nickname);
  const [editBio, setEditBio] = useState(user.bio);

  const fetchTab = async (t: TabKey) => {
    setLoading(true);
    try {
      switch (t) {
        case 'items': setMyItems(await api.getMyItems()); break;
        case 'received': setReceived(await api.getReceivedExchanges()); break;
        case 'sent': setSent(await api.getSentExchanges()); break;
        case 'history': setHistory(await api.getExchangeHistory()); break;
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTab(tab); }, [tab]);

  const handleAction = async (id: number, status: string) => {
    try {
      await api.updateExchangeStatus(id, status);
      showToast(status === 'accepted' ? '已接受' : '已拒绝');
      fetchTab('received');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRate = async () => {
    if (!ratingModal) return;
    try {
      await api.rateExchange(ratingModal.id, ratingScore, ratingComment);
      showToast('评价成功');
      setRatingModal(null);
      setRatingScore(5);
      setRatingComment('');
      fetchTab('history');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('确定删除这件物品吗？')) return;
    try {
      await api.deleteItem(id);
      showToast('已删除');
      fetchTab('items');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updated = await api.updateMe({ nickname: editNickname, bio: editBio });
      setUser({ ...user, ...updated });
      setEditMode(false);
      showToast('资料已更新');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const statusLabels: Record<string, { text: string; cls: string }> = {
    pending: { text: '等待中', cls: 'status-pending' },
    accepted: { text: '已接受', cls: 'status-accepted' },
    rejected: { text: '已拒绝', cls: 'status-rejected' },
  };

  return (
    <div>
      <div className="profile-header">
        <div className="profile-avatar">{user.nickname[0]}</div>
        <div className="profile-info" style={{ flex: 1 }}>
          {editMode ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input className="form-input" style={{ width: 140 }} value={editNickname} onChange={e => setEditNickname(e.target.value)} placeholder="昵称" />
              <input className="form-input" style={{ width: 240 }} value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="个人简介" />
              <button className="btn btn-primary btn-sm" onClick={handleSaveProfile}>保存</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(false)}>取消</button>
            </div>
          ) : (
            <>
              <h2>{user.nickname} <span style={{ fontSize: 14, color: '#aaa', fontWeight: 400 }}>@{user.username}</span></h2>
              <p>{user.bio || '这个人很懒，什么都没写'}</p>
            </>
          )}
        </div>
        {!editMode && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setEditMode(true); setEditNickname(user.nickname); setEditBio(user.bio); }}>
            编辑资料
          </button>
        )}
        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-value">{myItems.length}</div>
            <div className="stat-label">发布</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        {([
          ['items', '我的发布'],
          ['received', '收到的请求'],
          ['sent', '发出的请求'],
          ['history', '交换记录'],
        ] as [TabKey, string][]).map(([key, label]) => (
          <div
            key={key}
            className={`tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-text">加载中...</div></div>
      ) : (
        <>
          {tab === 'items' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <button className="btn btn-primary" onClick={onPublish}>+ 发布新物品</button>
              </div>
              {myItems.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📦</div><div className="empty-text">还没有发布物品</div></div>
              ) : (
                <div className="items-grid">
                  {myItems.map(item => (
                    <div key={item.id} className="item-card">
                      <div className="item-card-body" onClick={() => onViewItem(item.id)}>
                        <div className="item-card-title">{CATEGORY_ICONS[item.category]} {item.title}</div>
                        <div className="item-card-desc">{item.description}</div>
                        <div className="item-card-meta">
                          <span style={{ color: item.status === 'available' ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                            {item.status === 'available' ? '可交换' : '已交换'}
                          </span>
                          <span>{new Date(item.created_at).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                      {item.status === 'available' && (
                        <div style={{ padding: '0 16px 12px' }}>
                          <button className="btn btn-danger btn-sm btn-block" onClick={() => handleDeleteItem(item.id)}>删除</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'received' && (
            <>
              {received.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📬</div><div className="empty-text">暂无收到的交换请求</div></div>
              ) : (
                received.map(ex => (
                  <div key={ex.id} className="exchange-card">
                    <div className="exchange-header">
                      <div className="exchange-person">来自 {ex.requester_name} 的请求</div>
                      <span className={`exchange-status ${statusLabels[ex.status]?.cls}`}>
                        {statusLabels[ex.status]?.text}
                      </span>
                    </div>
                    <div className="exchange-items">
                      <div className="exchange-item">
                        <div className="item-name">{ex.offered_title}</div>
                        <div className="item-category">TA 的物品</div>
                      </div>
                      <div className="exchange-arrow">⇄</div>
                      <div className="exchange-item">
                        <div className="item-name">{ex.requested_title}</div>
                        <div className="item-category">你的物品</div>
                      </div>
                    </div>
                    {ex.status === 'pending' && (
                      <div className="exchange-actions">
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(ex.id, 'rejected')}>拒绝</button>
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(ex.id, 'accepted')}>接受</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'sent' && (
            <>
              {sent.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📤</div><div className="empty-text">暂无发出的交换请求</div></div>
              ) : (
                sent.map(ex => (
                  <div key={ex.id} className="exchange-card">
                    <div className="exchange-header">
                      <div className="exchange-person">向 {ex.owner_name} 发起</div>
                      <span className={`exchange-status ${statusLabels[ex.status]?.cls}`}>
                        {statusLabels[ex.status]?.text}
                      </span>
                    </div>
                    <div className="exchange-items">
                      <div className="exchange-item">
                        <div className="item-name">{ex.offered_title}</div>
                        <div className="item-category">你的物品</div>
                      </div>
                      <div className="exchange-arrow">⇄</div>
                      <div className="exchange-item">
                        <div className="item-name">{ex.requested_title}</div>
                        <div className="item-category">对方的物品</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'history' && (
            <>
              {history.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">暂无交换记录</div></div>
              ) : (
                history.map(ex => (
                  <div key={ex.id} className="exchange-card">
                    <div className="exchange-header">
                      <div className="exchange-person">与 {ex.partner_name} 的交换</div>
                      <span className="exchange-status status-accepted">已完成</span>
                    </div>
                    <div className="exchange-items">
                      <div className="exchange-item">
                        <div className="item-name">{ex.offered_title}</div>
                        <div className="item-category">
                          {ex.my_rating ? `我的评分: ${'★'.repeat(ex.my_rating)}${'☆'.repeat(5 - ex.my_rating)}` : '待评价'}
                        </div>
                      </div>
                      <div className="exchange-arrow">⇄</div>
                      <div className="exchange-item">
                        <div className="item-name">{ex.requested_title}</div>
                        <div className="item-category">
                          {ex.received_rating ? `对方评分: ${'★'.repeat(ex.received_rating)}${'☆'.repeat(5 - ex.received_rating)}` : '等待评价'}
                        </div>
                      </div>
                    </div>
                    {!ex.my_rating && (
                      <div className="exchange-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => setRatingModal(ex)}>评价对方</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </>
      )}

      {ratingModal && (
        <div className="modal-overlay" onClick={() => setRatingModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>评价交换</h3>
            <p style={{ color: '#888', marginBottom: 20, fontSize: 14 }}>
              请对这次交换体验进行评分
            </p>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div className="rating-stars" style={{ justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <span
                    key={s}
                    className={`star ${s <= ratingScore ? 'filled' : ''}`}
                    onClick={() => setRatingScore(s)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 8, color: '#888', fontSize: 14 }}>
                {ratingScore} 星
              </div>
            </div>
            <div className="form-group">
              <textarea
                className="form-textarea"
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
                placeholder="写点评价吧（选填）"
                rows={3}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRatingModal(null)}>取消</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleRate}>提交评价</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
