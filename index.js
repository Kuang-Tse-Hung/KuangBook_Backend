// server.js

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const userSchema = require('./src/userSchema');
const authRoutes = require('./src/auth'); // I've changed 'auth' to 'authRoutes' for clarity
const profileRoutes = require('./src/profile'); // Renamed 'profile' to 'profileRoutes'
const followingRoutes = require('./src/following'); // Import the following router
const articlesRoutes = require('./src/articles'); 

const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(cookieParser());

// Connect to MongoDB
const connectionString = process.env.MONGODB_URI || 'mongodb+srv://kh123:kh123@cluster0.elumieb.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(connectionString, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
}).then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

const User = require('./src/userSchema');


// Define routes
app.get('/', (req, res) => res.send('Welcome to the API'));
app.use('/auth', authRoutes); // Use auth routes
app.use('/profile', profileRoutes); // Use profile routes
app.get('/auth', (req, res) => {
  res.send('Auth route is working. Please use /auth/login or /auth/register.');
});
app.get('/profile', (req, res) => {
  res.send('Profile route is working');
});
app.use('/following', followingRoutes);
app.get('/following', (req, res) => {
  res.send('following route is working');
});
app.use('/articles', articlesRoutes);
app.get('/articles', (req, res) => {
  res.send('articles route is working');
});
// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
