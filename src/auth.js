const express = require('express');
const md5 = require('md5');
const router = express.Router();
// In auth.js
const User = require('./userSchema');  // adjust the path accordingly
const bcrypt = require('bcrypt');
const saltRounds = 10; // or another number you choose
function generateHash(password) {
    return bcrypt.hashSync(password, saltRounds);
}

let sessionUser = {};
let cookieKey = "sid";
// Dummy user data
let dummyUsers = [
    new User({
        username: 'user1',
        hash: generateHash('password1'),
        email: 'user1@example.com',
        dob: new Date('1990-01-01'),
        zipcode: '10001',
        phone: '111-222-3333',
        avatar: 'http://example.com/avatar1.jpg', // Example URL for avatar image
        headline: 'Here is user1’s headline.'
    }),
    new User({
        username: 'user2',
        hash: generateHash('password2'),
        email: 'user2@example.com',
        dob: new Date('1991-02-02'),
        zipcode: '20002',
        phone: '222-333-4444',
        avatar: 'http://example.com/avatar2.jpg', // Example URL for avatar image
        headline: 'User2 loves coding!'
    }),
    new User({
        username: 'kuang',
        hash: generateHash('kh123'),
        email: 'kuang@example.com',
        dob: new Date('1992-03-03'),
        zipcode: '30003',
        phone: '333-444-5555',
        avatar: 'http://example.com/avatar3.jpg', // Example URL for avatar image
        headline: 'Kuang is a frontend enthusiast.'
    })
];
// auth.js

function isLoggedIn(req, res, next) {
    let sid = req.cookies[cookieKey];
    if (!sid || !sessionUser[sid]) {
        return res.status(401).send('You are not logged in');
    }
    req.username = sessionUser[sid];
    next();
}
/*
function login(req, res) {
    let username = req.body.username;
    let password = req.body.password;

    if (!username || !password) {
        return res.sendStatus(400);
    }

    let user = userObjs[username];

    if (!user) {
        return res.sendStatus(401);
    }

    let hash = md5(user.salt + password);

    if (hash === user.hash) {
        let sid = md5(new Date().getTime() + user.username);
        sessionUser[sid] = username;
        res.cookie(cookieKey, sid, { maxAge: 3600 * 1000, httpOnly: true });
        res.send({ username: username, result: 'success' });
    } else {
        res.sendStatus(401);
    }
}
*/

function login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.sendStatus(400);
    }

    User.findOne({ username: username }).then(user => {
        if (!user) {
            return res.sendStatus(401); // User not found
        }

        // Compare password with hashed password in the database
        bcrypt.compare(password, user.hash, (err, isMatch) => {
            if (err) {
                console.error('Error comparing password:', err);
                return res.sendStatus(500);
            }

            if (isMatch) {
                const sid = md5(new Date().getTime() + user.username); // Or better yet, use a more secure session handling method
                sessionUser[sid] = username;
                res.cookie(cookieKey, sid, { maxAge: 3600 * 1000, httpOnly: true });
                res.send({ username: username, result: 'success' });
            } else {
                res.sendStatus(401); // Incorrect password
            }
        });
    }).catch(err => {
        console.error('Error during login:', err);
        return res.sendStatus(500); // Internal Server Error
    });
}




function register(req, res) {
    const { username, password, email, dob, zipcode, phone, avatar, headline } = req.body;

    // Basic validation
    if (!username || !password || !email || !dob || !zipcode || !phone) {
        return res.status(400).send('Missing required fields');
    }

    // Generate a hash for the password
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.sendStatus(500); // Internal Server Error
        }

        // Create a new user object with the hashed password
        const newUser = new User({
            username,
            hash, // store the hash, no need to store the salt separately
            email,
            dob: new Date(dob),
            zipcode,
            phone,
            avatar, // Optional field
            headline // Optional field
        });

        // Save the new user to the database
        newUser.save()
            .then(user => {
                // You may want to exclude sensitive information here
                res.send({ username: username, result: 'success' });
            })
            .catch(err => {
                if (err.code === 11000) {
                    // Duplicate key error, a user with this username or email already exists
                    return res.status(409).send('Username or email already exists');
                }
                console.error('Error saving user:', err);
                res.status(500).send('Internal Server Error: ' + err.message); // Internal Server Error
            });
    });
}



function logout(req, res) {
    if (req.cookies[cookieKey]) {
        delete sessionUser[req.cookies[cookieKey]];
        res.cookie(cookieKey, "", { maxAge: -1 });
        res.send('OK, sessionid removed');
    } else {
        res.sendStatus(401);
    }
}

function changePassword(req, res) {
    const { oldPassword, newPassword } = req.body;
    const username = req.username; // from isLoggedIn middleware

    User.findOne({ username: username }).then(user => {
        if (!user) {
            return res.sendStatus(404); // User not found
        }

        // Compare oldPassword with hashed password in the database
        bcrypt.compare(oldPassword, user.hash, (err, isMatch) => {
            if (err) {
                console.error('Error comparing password:', err);
                return res.sendStatus(500); // Internal Server Error
            }

            if (isMatch) {
                // Generate a new hash for the new password
                bcrypt.hash(newPassword, saltRounds, (err, newHash) => {
                    if (err) {
                        console.error('Error hashing new password:', err);
                        return res.sendStatus(500); // Internal Server Error
                    }

                    // Update user's password in the database
                    user.hash = newHash;
                    user.save()
                        .then(() => res.send({ username, result: 'success' }))
                        .catch(saveErr => {
                            console.error('Error saving new password:', saveErr);
                            res.sendStatus(500); // Internal Server Error
                        });
                });
            } else {
                res.sendStatus(401); // Incorrect password
            }
        });
    }).catch(err => {
        console.error('Error during password change:', err);
        return res.sendStatus(500); // Internal Server Error
    });
}


// Routing
router.post('/login', login);
router.post('/register', register);
router.put('/logout', isLoggedIn, logout); // Use isLoggedIn middleware only for logout
router.put('/password', isLoggedIn, changePassword); // Use isLoggedIn middleware only for password change
router.get('/', (req, res) => {
    res.send('Auth route is working. Please use /login or /register.');
  });
  
module.exports = router;
module.exports.sessionUser = sessionUser;
