// src/following.js

const express = require('express');
const router = express.Router();
//const Article = require('./articleschema'); // Update with the actual path to Article model
const auth = require('./auth'); // Update with the actual path to your auth module
let sessionUser = auth.sessionUser;
let cookieKey = "sid";
const User = require('./userSchema'); 

// Middleware that is specific to this router
function isLoggedIn(req, res, next) {
    let sid = req.cookies[cookieKey];
    if (!sid || !sessionUser[sid]) {
        return res.status(401).send('You are not logged in');
    }
    req.username = sessionUser[sid];
    next();
}

router.post('/following/:username', isLoggedIn, async (req, res) => {
    const usernameToFollow = req.params.username;
    const loggedInUsername = req.username; // Assuming this is set by isLoggedIn middleware
  
    try {
        // Find the logged-in user by username
        const loggedInUser = await User.findOne({ username: loggedInUsername });
        if (!loggedInUser) {
            return res.status(401).json({ error: "Logged-in user not found." });
        }
        
        // Prevent users from following themselves
        if (loggedInUsername === usernameToFollow) {
            return res.status(400).json({ error: "You cannot follow yourself." });
        }
        
        // Find the user to follow by username
        const userToFollow = await User.findOne({ username: usernameToFollow });
        if (!userToFollow) {
            return res.status(404).json({ error: "User to follow not found." });
        }
    
        // Use $addToSet to avoid adding the same user multiple times
        await User.findByIdAndUpdate(loggedInUser._id, {
            $addToSet: { following: userToFollow._id }
        });
    
        // Optionally, return the updated user document
        const updatedUser = await User.findById(loggedInUser._id).populate('following');
        
        res.status(200).json({
            message: `You are now following ${usernameToFollow}`,
            following: updatedUser.following.map(user => user.username) // Assuming you want to return a list of usernames
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/following/:username?', isLoggedIn, async (req, res) => {
    const usernameToSearch = req.params.username || req.username;

    try {
        const user = await User.findOne({ username: usernameToSearch }).populate('following');
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        const following = user.following.map(u => u.username); // Assuming 'following' is an array of User references
        res.status(200).json({ username: user.username, following });
    } catch (error) {
        console.error('Error fetching following list:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

// PUT endpoint to add a user to the logged-in user's following list
router.put('/following/:username', isLoggedIn, async (req, res) => {
    const usernameToFollow = req.params.username;
    const loggedInUsername = req.username;

    if (loggedInUsername === usernameToFollow) {
        return res.status(400).json({ error: "You cannot follow yourself." });
    }

    try {
        const userToFollow = await User.findOne({ username: usernameToFollow });
        if (!userToFollow) {
            return res.status(404).json({ error: 'User to follow not found' });
        }

        const loggedInUser = await User.findOne({ username: loggedInUsername });
        if (loggedInUser.following.includes(userToFollow._id)) {
            return res.status(400).json({ error: 'Already following this user' });
        }

        loggedInUser.following.push(userToFollow._id);
        await loggedInUser.save();

        res.status(200).json({ message: `You are now following ${usernameToFollow}` });
    } catch (error) {
        console.error('Error adding to following:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

// Assuming 'User' is your user model and it has a 'following' field that is an array of references to other users.

router.delete('/following/:username', isLoggedIn, async (req, res) => {
    const loggedInUsername = req.username; // The username of the logged-in user, extracted from the middleware
    const targetUsername = req.params.username; // The username of the user to unfollow, extracted from the URL parameter

    try {
        // Find the logged-in user
        const loggedInUser = await User.findOne({ username: loggedInUsername });
        if (!loggedInUser) {
            return res.status(404).json({ error: "Logged-in user not found." });
        }

        // Find the target user to unfollow
        const targetUser = await User.findOne({ username: targetUsername });
        if (!targetUser) {
            return res.status(404).json({ error: "User to unfollow not found." });
        }

        // Remove the target user from the logged-in user's following array
        loggedInUser.following = loggedInUser.following.filter(user => user.toString() !== targetUser._id.toString());
        
        // Save the updated user
        await loggedInUser.save();

        res.status(200).json({ message: `You are no longer following ${targetUsername}.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Export the router
module.exports = router;
