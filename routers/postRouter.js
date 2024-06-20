const express = require('express');
const router = express.Router();
const users = require('../models/userModel');
const posts = require('../models/postModel');


router.get('/post/:username', async (req, res) => {
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

        res.render('post', { user : user, postdata : formattedPosts });

    } catch (err) {
        res.status(500).send(err.message);
    }
});


router.post('/post/:username', async (req, res) => {
    try {
        const { title, content} = req.body;
        const user_name= req.params.username ;

        const user = await users.findOne({name: user_name});
        if (!user) {
            return res.status(404).send('user not found');
        }

        const post = new posts({
            user: user,
            title:title,
            content:content
        });

        await post.save();

        // res.status(201).json(post);
        res.redirect(`/api/post/${user.name}`);

    } catch (err) {
        res.status(500).send(err.message);
    }
});


router.post('/like/:postId', async (req, res) => {
    try {
        const post = await posts.findById(req.params.postId);
        if (!post) {
            return res.status(404).send('Post not found');
        }

        post.likes += 1;
        await post.save();

        res.status(200).json({ likes: post.likes });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


router.post('/dislike/:postId', async (req, res) => {
    try {
        const post = await posts.findById(req.params.postId);
        if (!post) {
            return res.status(404).send('Post not found');
        }

        post.dislikes += 1;
        await post.save();

        res.status(200).json({ dislikes: post.dislikes });
    } catch (err) {
        res.status(500).send(err.message);
    }
});





module.exports = router;
