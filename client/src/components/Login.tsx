import { useState } from 'react';
import { User } from '../types';
import { api } from '../api';

interface Props {
  onLogin: (user: User, token: string) => void;
  showToast: (msg: string, type?: string) => void;
}

export default function Login({ onLogin, showToast }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || (isRegister && !nickname)) {
      showToast('请填写完整信息', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = isRegister
        ? await api.register(username, password, nickname)
        : await api.login(username, password);
      onLogin(data.user, data.token);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card card-narrow">
      <h2 style={{ textAlign: 'center', marginBottom: 8, fontSize: 24 }}>
        {isRegister ? '注册账号' : '欢迎回来'}
      </h2>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: 28, fontSize: 14 }}>
        {isRegister ? '创建账号开始交换闲置物品' : '登录后即可发布和交换物品'}
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">用户名</label>
          <input
            className="form-input"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="请输入用户名"
          />
        </div>
        {isRegister && (
          <div className="form-group">
            <label className="form-label">昵称</label>
            <input
              className="form-input"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="请输入昵称"
            />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">密码</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="请输入密码"
          />
        </div>
        <button className="btn btn-primary btn-block" disabled={loading} type="submit">
          {loading ? '请稍候...' : isRegister ? '注册' : '登录'}
        </button>
      </form>
      <div className="auth-toggle">
        {isRegister ? '已有账号？' : '没有账号？'}
        <span onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? '去登录' : '去注册'}
        </span>
      </div>
    </div>
  );
}
