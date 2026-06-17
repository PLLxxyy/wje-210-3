import { useState, useEffect, useCallback } from 'react';
import { User } from './types';
import { api } from './api';
import Login from './components/Login';
import ItemList from './components/ItemList';
import ItemDetail from './components/ItemDetail';
import PublishItem from './components/PublishItem';
import Profile from './components/Profile';

type Page =
  | { name: 'home' }
  | { name: 'login' }
  | { name: 'detail'; itemId: number }
  | { name: 'publish' }
  | { name: 'profile' };

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>({ name: 'home' });
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = useCallback((msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe().then(u => setUser(u)).catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, []);

  const handleLogin = (u: User, token: string) => {
    localStorage.setItem('token', token);
    setUser(u);
    setPage({ name: 'home' });
    showToast('登录成功');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPage({ name: 'home' });
    showToast('已退出登录');
  };

  const navigate = (p: Page) => setPage(p);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo" onClick={() => navigate({ name: 'home' })}>
          🔄 互换闲置
        </div>
        <div className="navbar-nav">
          {user ? (
            <>
              <button className="nav-btn" onClick={() => navigate({ name: 'home' })}>首页</button>
              <button className="nav-btn" onClick={() => navigate({ name: 'publish' })}>发布闲置</button>
              <button className="nav-btn" onClick={() => navigate({ name: 'profile' })}>个人中心</button>
              <div className="nav-user">
                <div className="nav-avatar">{user.nickname[0]}</div>
                <span className="nav-nickname">{user.nickname}</span>
                <button className="nav-btn" onClick={handleLogout}>退出</button>
              </div>
            </>
          ) : (
            <button className="nav-btn primary" onClick={() => navigate({ name: 'login' })}>登录 / 注册</button>
          )}
        </div>
      </nav>

      <div className="container">
        {page.name === 'home' && (
          <ItemList
            user={user}
            onViewItem={(id) => navigate({ name: 'detail', itemId: id })}
            onNeedLogin={() => navigate({ name: 'login' })}
            showToast={showToast}
          />
        )}
        {page.name === 'login' && (
          <Login onLogin={handleLogin} showToast={showToast} />
        )}
        {page.name === 'detail' && (
          <ItemDetail
            itemId={page.itemId}
            user={user}
            onBack={() => navigate({ name: 'home' })}
            onNeedLogin={() => navigate({ name: 'login' })}
            showToast={showToast}
          />
        )}
        {page.name === 'publish' && user && (
          <PublishItem
            onBack={() => navigate({ name: 'profile' })}
            showToast={showToast}
          />
        )}
        {page.name === 'profile' && user && (
          <Profile
            user={user}
            setUser={setUser}
            onViewItem={(id) => navigate({ name: 'detail', itemId: id })}
            onPublish={() => navigate({ name: 'publish' })}
            showToast={showToast}
          />
        )}
      </div>

      <div className="footer">互换闲置 - 让闲置物品找到新主人</div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}
    </>
  );
}
