import { useState } from 'react';
import { CATEGORIES } from '../types';
import { api } from '../api';

interface Props {
  onBack: () => void;
  showToast: (msg: string, type?: string) => void;
}

export default function PublishItem({ onBack, showToast }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [expectedItem, setExpectedItem] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !expectedItem) {
      showToast('请填写完整信息', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.createItem({ title, description, category, expected_item: expectedItem, photo_desc: photoDesc });
      showToast('发布成功！');
      onBack();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const categories = CATEGORIES.filter(c => c !== '全部');

  return (
    <div>
      <div className="back-btn" onClick={onBack}>&larr; 返回个人中心</div>
      <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 24, fontSize: 22 }}>发布闲置物品</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">物品名称</label>
            <input
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="给你的闲置起个名字"
            />
          </div>
          <div className="form-group">
            <label className="form-label">物品描述</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="详细描述物品的状况、使用时间等"
              rows={4}
            />
          </div>
          <div className="form-group">
            <label className="form-label">物品类别</label>
            <select
              className="form-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">请选择类别</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">期望交换的物品</label>
            <input
              className="form-input"
              value={expectedItem}
              onChange={e => setExpectedItem(e.target.value)}
              placeholder="你希望用什么来交换？"
            />
          </div>
          <div className="form-group">
            <label className="form-label">照片描述（选填）</label>
            <textarea
              className="form-textarea"
              value={photoDesc}
              onChange={e => setPhotoDesc(e.target.value)}
              placeholder="描述物品的外观、颜色、成色等"
              rows={3}
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? '发布中...' : '发布物品'}
          </button>
        </form>
      </div>
    </div>
  );
}
