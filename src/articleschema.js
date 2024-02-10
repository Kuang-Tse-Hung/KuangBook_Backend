const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
  user: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  time: {
    type: Date,
    default: Date.now
  }
  // You can add more fields to the comment if needed
});

const articleSchema = new Schema({
  author: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  comments: [commentSchema] // Array of comments
  // You can add more fields to the article if needed
}, { timestamps: true });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
