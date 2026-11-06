const express = require('express'), crypto = require('crypto'), path = require('path');
const app = express();
app.use(express.json(), express.static('public'));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// In-memory "database" (resets on restart)
const hash = p => crypto.createHash('sha256').update(p).digest('hex');
const users = [{ name: 'Admin', email: 'admin@event.com', password: hash('admin123'), role: 'admin' }];
const events = [
  { id: 1, name: 'Tech Fest', date: '2026-12-10', participants: [] },
  { id: 2, name: 'Hackathon', date: '2026-12-20', participants: [] },
];
const sessions = {};

const auth = (req, res, next) => {
  const u = sessions[req.headers.authorization];
  if (!u) return res.status(401).json({ error: 'Login required' });
  req.user = u; next();
};
const admin = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admins only' });

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Invalid email address' });
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  users.push({ name, email, password: hash(password), role: 'student' });
  res.json({ message: 'Registration successful' });
});

app.post('/api/login', (req, res) => {
  const u = users.find(x => x.email === req.body.email && x.password === hash(req.body.password || ''));
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });
  const token = crypto.randomBytes(16).toString('hex');
  sessions[token] = u;
  res.json({ token, user: { name: u.name, role: u.role } });
});

app.get('/api/events', (req, res) => res.json(events.map(({ id, name, date }) => ({ id, name, date }))));

app.post('/api/events/:id/register', auth, (req, res) => {
  const e = events.find(x => x.id == req.params.id);
  if (!e) return res.status(404).json({ error: 'Event not found' });
  if (e.participants.find(p => p.email === req.user.email)) return res.status(409).json({ error: 'Already registered for this event' });
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  e.participants.push({ name: req.user.name, email: req.user.email, code });
  res.json({ event: e.name, code });
});

app.get('/api/my', auth, (req, res) => res.json(
  events.filter(e => e.participants.some(p => p.email === req.user.email))
        .map(e => ({ name: e.name, date: e.date, code: e.participants.find(p => p.email === req.user.email).code }))));

app.get('/api/admin/events', auth, admin, (req, res) => res.json(events));

app.post('/api/events', auth, admin, (req, res) => {
  if (!req.body.name || !req.body.date) return res.status(400).json({ error: 'Name and date required' });
  events.push({ id: events.length + 1, name: req.body.name, date: req.body.date, participants: [] });
  res.json({ message: 'Event added' });
});

app.listen(process.env.PORT || 3000, () => console.log('Running on http://localhost:3000'));
