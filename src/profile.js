// profile.js

const express = require('express');
const router = express.Router();
const User = require('./userSchema');
const auth = require('./auth'); 
const Profile = require('./auth');
let sessionUser = auth.sessionUser;
let cookieKey = "sid";

const profiles = {
    // ... assuming profiles is an object where the keys are usernames and the values are profile info
    'johndoe': {
        username: 'johndoe',
        headline: 'Loving life!',
        email: 'johndoe@example.com',
        dob: new Date('1990-01-01').getTime(),
        zipcode: '12345',
        phone: '123-456-7890',
        avatar: 'http://example.com/avatar/johndoe.jpg'
    }
};
// Middleware to check if the user is logged in
function isLoggedIn(req, res, next) {
  let sid = req.cookies[cookieKey];
  if (!sid || !sessionUser[sid]) {
      return res.status(401).send('You are not logged in');
  }
  req.username = sessionUser[sid];
  next();
}

// A helper function to get or update profile information based on username
const updateUserProfile = (username, updateObject, res) => {
  User.findOneAndUpdate({ username: username }, updateObject, { new: true })
    .then(user => {
      if (!user) {
        return res.status(404).send('User not found');
      }
      res.status(200).send({ username: user.username, ...updateObject });
    })
    .catch(err => {
      console.error('Error updating user profile:', err);
      res.status(500).send('Internal Server Error');
    });
};

router.get('/headline/:username?', isLoggedIn, (req, res) => {
    // Use the username from the URL parameter if it exists, otherwise use the logged-in user's username
    const usernameToSearch = req.params.username || req.username;
  
    User.findOne({ username: usernameToSearch }, 'username headline')
        .then(user => {
            if (!user) {
                return res.status(404).send({ error: 'Cannot find the user' }); // Send specific error message
            }
            res.status(200).send({ username: user.username, headline: user.headline });
        })
        .catch(err => {
            console.error('Error fetching headline:', err);
            res.status(500).send({ error: 'Internal Server Error' });
        });
  });
  

router.put('/headline', isLoggedIn, (req, res) => {
  const username = req.username;
  const { headline } = req.body;
  
  if (!headline) {
    return res.status(400).send('Please intput headline');
  }

  User.findOneAndUpdate({ username: username }, { headline: headline }, { new: true })
      .then(user => {
          if (!user) {
              return res.status(404).send('User not found');
          }
          res.status(200).send({ username: user.username, headline: user.headline });
      })
      .catch(err => {
          console.error('Error updating headline:', err);
          res.status(500).send('Internal Server Error');
      });
});


// Email routes
router.get('/email/:username?', isLoggedIn, (req, res) => {
    // Use the username from the URL parameter if it exists, otherwise use the logged-in user's username
    const usernameToSearch = req.params.username || req.username;
  
    User.findOne({ username: usernameToSearch }, 'username email')
        .then(user => {
            if (!user) {
                return res.status(404).send({ error: 'User not found' }); // Send specific error message
            }
            res.status(200).send({ username: user.username, email: user.email });
        })
        .catch(err => {
            console.error('Error fetching email:', err);
            res.status(500).send({ error: 'Internal Server Error' });
        });
  });

router.put('/email', isLoggedIn, (req, res) => {
  const username = req.username; // Authenticated username from isLoggedIn middleware
  const { email } = req.body;
  User.findOneAndUpdate({ username: username }, { email: email }, { new: true })
      .then(user => {
          if (!user) {
              return res.status(404).send('User not found');
          }
          res.status(200).send({ username: user.username, email: user.email });
      })
      .catch(err => {
          console.error('Error updating email:', err);
          res.status(500).send('Internal Server Error');
      });
});


// Date of Birth routes
router.get('/dob/:username?', isLoggedIn, (req, res) => {
    const usernameToSearch = req.params.username || req.username;
    User.findOne({ username: usernameToSearch }, 'username dob')
        .then(user => {
            if (!user) {
                return res.status(404).send({ error: 'User not found' });
            }
            res.status(200).send({ username: user.username, dob: user.dob });
        })
        .catch(err => {
            console.error('Error fetching dob:', err);
            res.status(500).send({ error: 'Internal Server Error' });
        });
});


// Zipcode routes
router.get('/zipcode/:username?', isLoggedIn, (req, res) => {
    const usernameToSearch = req.params.username || req.username;
    User.findOne({ username: usernameToSearch }, 'username zipcode')
        .then(user => {
            if (!user) {
                return res.status(404).send({ error: 'User not found' });
            }
            res.status(200).send({ username: user.username, zipcode: user.zipcode });
        })
        .catch(err => {
            console.error('Error fetching zipcode:', err);
            res.status(500).send({ error: 'Internal Server Error' });
        });
  });

router.put('/zipcode', isLoggedIn, (req, res) => {
  const username = req.username;
  const { zipcode } = req.body;
  User.findOneAndUpdate({ username: username }, { zipcode: zipcode }, { new: true })
      .then(user => {
          if (!user) {
              return res.status(404).send('User not found');
          }
          res.status(200).send({ username: user.username, zipcode: user.zipcode });
      })
      .catch(err => {
          console.error('Error updating zipcode:', err);
          res.status(500).send('Internal Server Error');
      });
});

// Phone routes
router.get('/phone/:username?', isLoggedIn, (req, res) => {
    const usernameToSearch = req.params.username || req.username;
    User.findOne({ username: usernameToSearch }, 'username phone')
        .then(user => {
            if (!user) {
                return res.status(404).send({ error: 'User not found' });
            }
            res.status(200).send({ username: user.username, phone: user.phone });
        })
        .catch(err => {
            console.error('Error fetching phone:', err);
            res.status(500).send({ error: 'Internal Server Error' });
        });
  });

router.put('/phone', isLoggedIn, (req, res) => {
  const username = req.username;
  const { phone } = req.body;
  User.findOneAndUpdate({ username: username }, { phone: phone }, { new: true })
      .then(user => {
          if (!user) {
              return res.status(404).send('User not found');
          }
          res.status(200).send({ username: user.username, phone: user.phone });
      })
      .catch(err => {
          console.error('Error updating phone:', err);
          res.status(500).send('Internal Server Error');
      });
});

// Avatar routes
router.get('/avatar/:username?', isLoggedIn, (req, res) => {
    const usernameToSearch = req.params.username || req.username;
    User.findOne({ username: usernameToSearch }, 'username avatar')
        .then(user => {
            if (!user) {
                return res.status(404).send({ error: 'User not found' });
            }
            res.status(200).send({ username: user.username, avatar: user.avatar });
        })
        .catch(err => {
            console.error('Error fetching avatar:', err);
            res.status(500).send({ error: 'Internal Server Error' });
        });
});

router.put('/avatar', isLoggedIn, (req, res) => {
  const username = req.username;
  const { avatar } = req.body;
  User.findOneAndUpdate({ username: username }, { avatar: avatar }, { new: true })
      .then(user => {
          if (!user) {
              return res.status(404).send('User not found');
          }
          res.status(200).send({ username: user.username, avatar: user.avatar });
      })
      .catch(err => {
          console.error('Error updating avatar:', err);
          res.status(500).send('Internal Server Error');
      });
});


module.exports = router;
