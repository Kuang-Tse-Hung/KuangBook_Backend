const chai = require('chai');
const sinon = require('sinon');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const User = require('./userSchema');
const authRouter = require('./auth');
const express = require('express');
const cookieParser = require('cookie-parser');

const expect = chai.expect;
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRouter);

// Mock session store
global.sessionUser = {};
const cookieKey = "sid";

describe('Auth Endpoint', function() {
    let userSaveStub, bcryptHashStub, bcryptCompareStub, userFindOneStub;

    before(() => {
        userSaveStub = sinon.stub(User.prototype, 'save').resolves();
        bcryptHashStub = sinon.stub(bcrypt, 'hash').resolves('hashedPassword');
        bcryptCompareStub = sinon.stub(bcrypt, 'compare').resolves(true);
        userFindOneStub = sinon.stub(User, 'findOne').resolves(new User({
            _id: '123',
            username: 'testuser',
            hash: 'hashedPassword',
        }));
    });

    after(() => {
        // Restore the stubs
        sinon.restore();

        userSaveStub.restore();
        bcryptHashStub.restore();
    });

    it('should register a new user', function(done) {
        const newUser = {
            username: 'testuser',
            password: 'password',
            email: 'test@example.com',
            dob: '1990-01-01',
            zipcode: '12345',
            phone: '123-456-7890'
        };

        // Setup stub to simulate successful save
        userSaveStub.resolves(newUser);

        // Setup stub to simulate successful hashing
        bcryptHashStub.callsFake((pw, saltRounds, callback) => {
            callback(null, 'hashedPassword');
        });

        supertest(app)
            .post('/auth/register')
            .send(newUser)
            .expect(200)
            .end((err, res) => {
                expect(res.body.username).to.equal(newUser.username);
                expect(res.body.result).to.equal('success');
                done(err);
            });
    });
    
    

    it('should login a user', function(done) {
        const userCredentials = {
            username: 'testuser',
            password: 'password'
        };
        this.timeout(5000);
        supertest(app)
            .post('/auth/login')
            .send(userCredentials)
            .expect(200)
            .end((err, res) => {
                expect(res.body.username).to.equal(userCredentials.username);
                expect(res.body.result).to.equal('success');
                expect(res.headers['set-cookie']).to.exist;
                
            });
            done();
    });

    it('should logout current user', function(done) {
        this.timeout(5000);
        // Simulate a user session by setting a cookie
        const agent = supertest.agent(app);
        agent.post('/auth/login')
            .send({ username: 'testuser', password: 'password' })
            .expect(200)
            .end((err, res) => {
                // Now, test the logout functionality
                agent.put('/auth/logout')
                    .expect(200)
                    .end((logoutErr, logoutRes) => {
                        expect(logoutRes.text).to.include('OK, sessionid removed');
                        done(logoutErr);
                    });
            });
            done();
    });
    // Add more tests to handle different scenarios, like missing fields, user already exists etc.
});


