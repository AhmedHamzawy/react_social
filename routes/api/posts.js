const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');


// @route  POST api/posts
// @desc   Create a post
// @access Private
router.post('/', [ auth, [
    check('text', 'Text Is Required').not().isEmpty()
] ] ,
async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id,
        });        

        const post = await newPost.save();

        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

// @route  GET api/posts
// @desc   Get all posts
// @access Private
router.get('/', auth, async (req,res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  GET api/posts/:id
// @desc   Get post by id
// @access Private
router.get('/:id', auth, async (req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        res.json(post);
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            return res.status(404).json({ msg: 'Post Not Found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route  DELETE api/posts/:id
// @desc   Delete A Post
// @access Private
router.delete('/:id', auth, async (req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        // Check On User
        if(post.user.toString() != req.user.id){
            return res.status(401).json({ msg: 'User Not Authorized' })
        }

        await post.remove();

        res.json({ msg: 'Post Removed' });
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            return res.status(404).json({ msg: 'Post Not Found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route  PUT api/posts/like/:id
// @desc   Like A Post
// @access Private
router.put('/like/:id', auth, async(req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check if the post has already been liked by the user
        if(post.likes.filter(like => like.user.toString() == req.user.id).length > 0){
            return res.status(400).json({ msg: 'Post Already Liked' });
        }

        post.likes.unshift({ user: req.user.id });

        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  PUT api/posts/unlike/:id
// @desc   Unlike A Post
// @access Private
router.put('/unlike/:id', auth, async(req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check if the post has already been liked by the user
        if(post.likes.filter(like => like.user.toString() == req.user.id).length === 0){
            return res.status(400).json({ msg: 'Post Has Not Yet Been Liked' });
        }

        // Get Remove Index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);

        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  POST api/posts/comment/:id
// @desc   Comment On A Post
// @access Private
router.post('/comment/:id', [ auth, [
    check('text', 'Text Is Required').not().isEmpty()
] ] ,
async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id,
        };        

        post.comments.unshift(newComment);

        await post.save();

        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

// @route  DELETE api/posts/comment/:id/:comment_id
// @desc   Delete Comment
// @access Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Pull Out Comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // Make Sure Comment Exists
        if(!comment){
            return res.status(404).json({ msg: 'Comment Does Not Exist' });
        }

        // Check User 
        if(comment.user.toString() !== req.user.id){
            return res.status(401).json({ msg: 'User Not Authorized' });
        }

        // Get Remove Index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);

        post.comments.splice(removeIndex, 1);
 
        await post.save();
 
        res.json(post.comments);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;