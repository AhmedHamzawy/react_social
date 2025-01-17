const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');

// @route  POST api/profile/me
// @desc   Get Current Users Profile
// @access Private
router.get('/me', auth, async(req,res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if(!profile){
            return res.status(400).json({ "message" : "there's no profile for this user" });
        }

        res.json(profile);

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  POST api/profile
// @desc   Create Or Update A User Profile
// @access Private
router.post('/', [auth, [
    check('handle', 'Handle Is Required').not().isEmpty(),
    check('status', 'Status Is Required').not().isEmpty(),
    check('skills', 'Skills Is Requied').not().isEmpty()
]] , 
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        handle,
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;


    // Build Profile Object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(handle) profileFields.handle = handle;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Build Social Object
    profileFields.social = {}
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(linkedin) profileFields.social.linkedin = linkedin;
    if(instagram) profileFields.social.instagram = instagram;



    try {
        let profile = await Profile.findOne({ user: req.user.id });

        if(profile){
            // Update
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });

            return res.json(profile);
        }

        // Create
        profile = new Profile(profileFields);

        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

// @route  GET api/profile
// @desc   Get All Profiles
// @access Public
router.get('/', async(req,res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name','avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route  GET api/profile/user/:user_id
// @desc   Get Profile By User Id
// @access Public
router.get('/user/:user_id', async(req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name','avatar']);
        if(!profile){
            return res.status(400).json({ msg: 'Profile Not Found' });
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({ msg: 'Profile Not Found' });
        }
        res.status(500).send('Server Error');
    }
})

// @route  DELETE api/profile
// @desc   Delete Profile, user & posts
// @access Private
router.delete('/', auth, async(req,res) => {
    try {
        // Remove Users Posts
        await Post.deleteMany({ user: req.user.id });
        // Remove Profile
        await Profile.findOneAndRemove({ user: req.user.id });
        // Remove User
        await User.findOneAndRemove({ _id: req.user.id });
        res.json({ msg: 'User Deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  PUT api/experience
// @desc   Add Profile Experience
// @access Private
router.put('/experience', [auth, [
    check('title', 'Title Is Required').not().isEmpty(),
    check('company', 'Company Is Required').not().isEmpty(),
    check('from', 'From Date Is Required').not().isEmpty(),
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.experience.unshift(newExp);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

// @route  DELETE api/experience/:exp_id
// @desc   Delete Experience From Profile
// @access Private
router.delete('/experience/:exp_id', auth, async(req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // Get Remove Index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');        
    }
});

// @route  PUT api/education
// @desc   Add Profile Education
// @access Private
router.put('/education', [auth, [
    check('school', 'School Is Required').not().isEmpty(),
    check('degree', 'Degree Is Required').not().isEmpty(),
    check('fieldOfStudy', 'Field Of Study Is Required').not().isEmpty(),
    check('from', 'From Date Is Required').not().isEmpty(),
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        school,
        degree,
        fieldOfStudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldOfStudy,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.education.unshift(newEdu);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

// @route  DELETE api/education/:edu_id
// @desc   Delete Education From Profile
// @access Private
router.delete('/education/:edu_id', auth, async(req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // Get Remove Index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');        
    }
});

// @route  GET api/profile/github/:username
// @desc   Get user repos from Github
// @access Public
router.get('/github/:username', (req,res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' } 
        };

        request(options, (error, response, body) => {
            if(error) console.error(error);

            if(response.statusCode !== 200){
                return res.status(404).json({ msg: 'No Github Profile Found' });
            }

            res.json(JSON.parse(body));
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');   
    }
});


module.exports = router;