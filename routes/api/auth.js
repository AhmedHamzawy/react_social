const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route  POST api/auth
// @desc   Authentication
// @access Private
router.get('/', auth, async(req,res) => {
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }   
});

// @route  POST api/auth
// @desc   Authenticate User & Get Token
// @access Public
router.post('/',
[
    check('email', 'Please Include A Valid Email').isEmail(),
    check(
        'password',
        'Password Is Required'
    ).exists()
],
async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try{

        let user = await User.findOne({ email });

        if(!user){
            res.status(400).json({ errors : [{ msg: 'Invalid Credentials' }] })
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if(!isMatch){
            res.status(400).json({ errors : [{ msg: 'Invalid Credentials' }] })
        }


        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 3600 }, 
        (err, token) => { if(err) throw err; res.json({ token }) });

        

    } catch(err){

        console.error(err.message);
        res.status(500).send('Server Error');

    }

  
});


module.exports = router;