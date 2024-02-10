// src/articles.js

const express = require('express');
const router = express.Router();
const Article = require('./articleschema'); // Update with the actual path to Article model
const auth = require('./auth'); // Update with the actual path to your auth module
const mongoose = require('mongoose'); 
let sessionUser = auth.sessionUser;
let cookieKey = "sid";

// Middleware to check if the user is logged in
function isLoggedIn(req, res, next) {
  let sid = req.cookies[cookieKey];
  if (!sid || !sessionUser[sid]) {
      return res.status(401).send('You are not logged in');
  }
  req.username = sessionUser[sid];
  next();
}

// Route to get a list of articles or a specific article for the logged in user
router.get('/articles/:articleId?', isLoggedIn, async (req, res) => {
  const { articleId } = req.params;

  try {
    // Attempt to retrieve a specific article by its ID if the ID is valid
    if (articleId && mongoose.Types.ObjectId.isValid(articleId)) {
      const article = await Article.findById(articleId);
      if (article) {
        return res.json({ articles: [article] });
      }
    }

    // If no article is found, or if the articleId is not a valid ObjectId,
    // attempt to retrieve articles by a user with a username matching 'articleId'
    const authorQuery = articleId ? { author: articleId } : { author: req.username };
    const articles = await Article.find(authorQuery);
    
    if (!articles.length && articleId) {
      // If no articles found and articleId was provided, it could be an invalid articleId or a username with no articles
      return res.status(404).json({ message: 'No articles found for the provided ID or username' });
    }

    return res.json({ articles: articles });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      // If the error is due to an invalid ObjectId format, assume 'articleId' is a username
      const articlesByUsername = await Article.find({ author: articleId });
      if (articlesByUsername.length) {
        return res.json({ articles: articlesByUsername });
      }
      return res.status(404).json({ message: 'Article not found' });
    }
    res.status(500).json({ error: error.message });
  }
});


// Route to update an article for the logged in user
router.put('/articles/:id', isLoggedIn, async (req, res) => {
  try {
    const articleId = req.params.id;
    const username = req.username;
    const article = await Article.findOneAndUpdate(
      { _id: articleId, author: username }, 
      req.body, 
      { new: true }
    );

    if (!article) {
      return res.status(404).send('Article not found or you do not have permission');
    }

    res.json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to create a new article for the logged in user
router.post('/article', isLoggedIn, async (req, res) => {
  const { title, content, comments } = req.body; // Destructure the title, content, and comments from the request body

  if (!title) {
    return res.status(400).json({ error: 'Article title is required.' });
  }

  if (!content) {
    return res.status(400).json({ error: 'Article content is required.' });
  }

  // Optional: Validate comments if necessary
  // For example, you could check if each comment has a user and content, etc.

  try {
    const username = req.username; // Username should be set by isLoggedIn middleware
    const newArticleData = { title, content, comments, author: username }; // Use destructured title, content, and include comments
    const newArticle = new Article(newArticleData);
    const savedArticle = await newArticle.save();
    res.status(201).json(savedArticle);
  } catch (error) {
    console.error('Error saving article:', error);
    res.status(500).json({ error: error.message }); // Send a 500 status code for server errors
  }
});




module.exports = router;
