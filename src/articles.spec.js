const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Article = require('./articleschema'); // Make sure this path is correct
const express = require('express');

chai.use(chaiHttp);
const expect = chai.expect;

const app = express();
app.use(express.json());

// Mock middleware to simulate a logged-in user
const isLoggedIn = (req, res, next) => {
  req.username = 'testuser';
  next();
};
app.use(isLoggedIn);

// Articles route implementation
app.get('/articles/:articleId?', isLoggedIn, async (req, res) => {
  const { articleId } = req.params;

  try {
    if (articleId && mongoose.Types.ObjectId.isValid(articleId)) {
      const article = await Article.findById(articleId);
      if (article) {
        return res.json({ articles: [article] });
      } else {
        return res.status(404).json({ message: 'Article not found' });
      }
    }

    const authorQuery = articleId ? { author: articleId } : { author: req.username };
    const articles = await Article.find(authorQuery);

    if (!articles.length) {
      return res.status(404).json({ message: 'No articles found for the provided ID or username' });
    }

    return res.json({ articles });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/article', isLoggedIn, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }
  try {
    const newArticle = new Article({ title, content, author: req.username });
    const savedArticle = await newArticle.save();
    return res.status(201).json(savedArticle);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Start the test suite
describe('Articles Endpoints', () => {
    let articleFindStub, articleFindByIdStub, articleSaveStub;
  
    beforeEach(() => {
      articleFindStub = sinon.stub(Article, 'find');
      articleFindByIdStub = sinon.stub(Article, 'findById');
      articleSaveStub = sinon.stub(Article.prototype, 'save');
    });
  
    afterEach(() => {
      sinon.restore();
    });
  


  describe('POST /article', () => {
    it('should create a new article for the logged-in user', (done) => {
      const newArticleData = {
        title: 'New Article',
        content: 'New content',
        author: 'testuser'
      };

      const savedArticle = { ...newArticleData, _id: new mongoose.Types.ObjectId() };

      articleSaveStub.resolves(savedArticle);

      chai.request(app)
        .post('/article')
        .send(newArticleData)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.title).to.equal(newArticleData.title);
          done();
        });
    });

    it('should return 400 if title or content is missing', (done) => {
      chai.request(app)
        .post('/article')
        .send({ content: 'New content' }) // Missing title
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });
  describe('GET /articles/:articleId?', () => {
    beforeEach(() => {
        // Check if stubs already exist and restore them if they do
        if (articleFindStub && articleFindByIdStub && articleSaveStub) {
          sinon.restore();
        }
    
        // Now, safely create new stubs
        articleFindStub = sinon.stub(Article, 'find');
        articleFindByIdStub = sinon.stub(Article, 'findById');
        articleSaveStub = sinon.stub(Article.prototype, 'save');
      });
    
      afterEach(() => {
        // Restore all stubs after each test
        sinon.restore();
      });

    it('should retrieve a specific article by ID', async () => {
        const mockArticleId = new mongoose.Types.ObjectId();
        const mockArticle = {
            _id: mockArticleId,
            title: 'Test Article',
            content: 'Test Content',
            author: 'testuser'
        };

        articleFindByIdStub.withArgs(mockArticleId).resolves(mockArticle);

        const res = await chai.request(app).get(`/articles/${mockArticleId}`);
        
       //
    });

    it('should retrieve articles by the logged-in user when no ID is provided', async () => {
        const mockArticles = [
            { _id: new mongoose.Types.ObjectId(), title: 'Article 1', content: 'Content 1', author: 'testuser' },
            { _id: new mongoose.Types.ObjectId(), title: 'Article 2', content: 'Content 2', author: 'testuser' }
        ];

        articleFindStub.withArgs({ author: 'testuser' }).resolves(mockArticles);

        const res = await chai.request(app).get('/articles');

        
    });

    it('should return 404 if no articles found for the provided ID or username', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        articleFindByIdStub.withArgs(nonExistentId).resolves(null);
        articleFindStub.withArgs({ author: nonExistentId.toString() }).resolves([]);

        const res = await chai.request(app).get(`/articles/${nonExistentId}`);

        expect(res).to.have.status(404);
    });

   

    it('should return 500 if an unexpected error occurs', async () => {
        const mockError = new Error('Unexpected error');
        articleFindByIdStub.throws(mockError);

        const res = await chai.request(app).get('/articles/unexpected-error');

        expect(res).to.have.status(500);
    });
});

  // Add more tests as needed
});
