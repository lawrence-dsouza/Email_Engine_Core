require('dotenv').config();

const express = require('express');
const http = require('http');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

// Sockets
const socketHandler = require('./socket/socketHandler');

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

// Server
const startServer = require('./bin/www');
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

// Routes
app.get('/', (req, res) => res.render('index'));
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Initialize Socket
socketHandler.initSockets(server);

// Start Server
startServer(server, process.env.NODE_PORT);

// Uncaught/Unhandled Exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
