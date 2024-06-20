const express = require('express');
const router = express.Router();
const users = require('../models/userModel');
const posts = require('../models/postModel');



router.get('/friends/:username', async (req, res) => {
    try {
        const user_name= req.params.username;

        const user = await users.findOne({ name: user_name });
        if(!user)
        return res.status(400).json({msg:"user not found"}) ;
       
        // const myPosts = await posts.find({ user: user });

        // const formattedPosts = [];

        // for (let post of myPosts) {
        //     const likesCount = post.likes.length;
        //     const commentsCount = post.comments.length;

        //     formattedPosts.push({
        //         _id: post._id,
        //         title: post.title,
        //         content: post.content,
        //         likes: likesCount,
        //         comments: commentsCount
        //     });
        // }

        res.render('friends', {user});

    } catch (err) {
        res.status(500).send(err.message);
    }
});


router.get('/details/:username', async (req, res) => {
    try {
        const user_name= req.params.username;

        const user = await users.findOne({ name: user_name });
        if(!user)
        return res.status(400).json({msg:"user not found"}) ;
       
        const myPosts = await posts.find({ user: user });

        const formattedPosts = [];

        for (let post of myPosts) {
            const likesCount = post.likes.length;
            const commentsCount = post.comments.length;

            formattedPosts.push({
                _id: post._id,
                title: post.title,
                content: post.content,
                likes: likesCount,
                comments: commentsCount
            });
        }

        res.render('details', { user : user, postdata : formattedPosts,currentUser: req.user });

    } catch (err) {
        res.status(500).send(err.message);
    }
});



router.post('/follow/:userId', async (req, res) => {
    try {
        const userIdToFollow = req.params.userId;
        const currentUserId = req.user._id; // Assume req.user contains the authenticated user's info
        
        // Find the user to follow
        const userToFollow = await users.findById(userIdToFollow);
        if (!userToFollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already following
        if (userToFollow.followers.includes(currentUserId)) {
            return res.status(400).json({ message: 'You are already following this user' });
        }

        // Add the current user to the followers array of the user to follow
        userToFollow.followers.push(currentUserId);
        await userToFollow.save();

        // Add the user to follow to the following array of the current user
        const currentUser = await users.findById(currentUserId);
        currentUser.following.push(userIdToFollow);
        await currentUser.save();

        res.status(200).json({ message: 'Successfully followed the user' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




// router.post('/post/:username', async (req, res) => {
//     try {
//         const { title, content} = req.body;
//         const user_name= req.params.username ;

//         const user = await users.findOne({name: user_name});
//         if (!user) {
//             return res.status(404).send('user not found');
//         }

//         const post = new posts({
//             user: user,
//             title:title,
//             content:content
//         });

//         await post.save();

//         // res.status(201).json(post);
//         res.redirect(`/api/post/${user.name}`);

//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });



module.exports = router;
