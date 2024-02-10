const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const User = require('./userSchema'); // Ensure the path is correct
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

chai.use(chaiHttp);
const expect = chai.expect;

// Setting up the express server for testing
const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

// Your authentication middleware. This should be modified to match your actual implementation.
const isLoggedIn = (req, res, next) => {
  // Simulate a user being logged in by attaching a username to the request
  req.username = 'existingUser';
  next();
};
app.use(isLoggedIn);

// Your routes (simplified for example purposes)
app.get('/headline/:username?', (req, res) => {
  const usernameToSearch = req.params.username || req.username;
  User.findOne({ username: usernameToSearch }, 'username headline', (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ username: user.username, headline: user.headline });
  });
});

app.put('/headline', (req, res) => {
  const { headline } = req.body;
  if (!headline) {
    return res.status(400).json({ error: 'Headline is required' });
  }
  User.findOneAndUpdate(
    { username: req.username },
    { $set: { headline: headline } },
    { new: true },
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ username: user.username, headline: user.headline });
    }
  );
});

// Begin test suite
describe('Profile Endpoints', () => {
  let userFindOneStub, userFindOneAndUpdateStub;

  before(() => {
    userFindOneStub = sinon.stub(User, 'findOne');
    userFindOneAndUpdateStub = sinon.stub(User, 'findOneAndUpdate');
  });

  after(() => {
    sinon.restore();
  });

  describe('GET /headline/:username?', () => {
    it('should get the headline of the logged-in user when username is not provided', (done) => {
      const expectedUser = {
        username: 'existingUser',
        headline: 'Existing User Headline'
      };

      userFindOneStub.yields(null, expectedUser); // Simulate successful DB operation

      chai.request(app)
        .get('/headline')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.deep.equal(expectedUser);
          done();
        });
    });

    it('should return a 404 if the user does not exist', (done) => {
      userFindOneStub.yields(null, null); // Simulate user not found in DB

      chai.request(app)
        .get('/headline/nonexistentuser')
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });

  describe('PUT /headline', () => {
    it('should update the headline of the logged-in user', (done) => {
      const newHeadline = 'New Headline';
      const expectedUser = {
        username: 'existingUser',
        headline: newHeadline
      };

      userFindOneAndUpdateStub.yields(null, expectedUser); // Simulate successful DB operation

      chai.request(app)
        .put('/headline')
        .send({ headline: newHeadline })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.headline).to.equal(newHeadline);
          done();
        });
    });

    it('should return a 400 if no headline is provided', (done) => {
      chai.request(app)
        .put('/headline')
        .send({})
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });
});

module.exports = app;
