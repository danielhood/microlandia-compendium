import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Observation } from './models/Observation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/microlandia';

// CORS (explicitly handle preflight for common headers/methods)
app.use(cors({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Build dynamic filter from query params
function buildFilter(query) {
  const f = {};
  const addLike = (key, val) => {
    if (val) f[key] = { $regex: String(val), $options: 'i' };
  };
  addLike('researcherName', query.researcherName);
  addLike('commonName', query.commonName);
  addLike('scientificName', query.scientificName);
  addLike('habitat', query.habitat);
  if (query.q) {
    f.$or = [
      { fieldNotes: { $regex: String(query.q), $options: 'i' } },
      { commonName: { $regex: String(query.q), $options: 'i' } },
      { scientificName: { $regex: String(query.q), $options: 'i' } }
    ];
  }
  return f;
}

// CRUD routes
app.get('/api/observations', async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const items = await Observation.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch observations' });
  }
});

app.post('/api/observations', async (req, res) => {
  try {
    const body = req.body || {};
    const required = ['researcherName', 'commonName', 'scientificName', 'habitat'];
    for (const k of required) {
      if (!body[k] || String(body[k]).trim() === '') return res.status(400).json({ error: `${k} is required` });
    }
    const created = await Observation.create({
      researcherName: body.researcherName,
      commonName: body.commonName,
      scientificName: body.scientificName,
      habitat: body.habitat,
      fieldNotes: body.fieldNotes || ''
    });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create observation' });
  }
});

app.get('/api/observations/:id', async (req, res) => {
  try {
    const item = await Observation.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Invalid id' });
  }
});

app.put('/api/observations/:id', async (req, res) => {
  try {
    const updated = await Observation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Update failed' });
  }
});

app.delete('/api/observations/:id', async (req, res) => {
  try {
    const deleted = await Observation.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Delete failed' });
  }
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || undefined });
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`API listening on :${PORT}`));
  } catch (err) {
    console.error('Failed to start API', err);
    process.exit(1);
  }
}

start();
