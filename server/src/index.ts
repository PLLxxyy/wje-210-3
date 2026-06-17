import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import itemRoutes from './routes/items';
import exchangeRoutes from './routes/exchanges';

const app = express();
const PORT = Number(process.env.PORT) || 3210;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/exchanges', exchangeRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
