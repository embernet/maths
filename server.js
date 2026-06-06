import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app  = express();
const PORT = process.env.PORT || 4070;

// Serve the Astro build output
app.use(express.static(path.join(__dirname, 'dist')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'maths', time: new Date().toISOString() });
});

// Fallback: all other routes → index.html (Astro static site)
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`maths portal listening on http://localhost:${PORT}`);
});
