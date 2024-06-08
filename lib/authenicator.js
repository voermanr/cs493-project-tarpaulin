const jwt = require('jsonwebtoken');
const User = require('../models/user');

async function isAuthenticated(req, res, next) {
    const authHeader = req.get('Authorization') || '';
    const headerParts = authHeader.split(' ');

    const token = headerParts[0] === "Bearer" && headerParts[1] !== null ? headerParts[1]: null;

    //console.log("token", token);

    if (token === null) {
        res.status(401).json({error: 'No token provided'});
    }
    else {
        try {
            req.email = await jwt.verify(token, process.env.JWT_SECRET).sub;

            //console.log("req.user:", req.user);
            if (!req.user) {
                req.user = await User.findOne({email: req.email});
            }
            if (req.user) {
                next();
            } else {
                res.status(401).json({ error: 'Invalid token'});
            }
        } catch (err) {
            console.error(err);
            res.status(401).json({error: "Invalid token"});
        }
    }
}

function generateAuthToken (email) {
    return  jwt.sign({
        sub: email
    }, process.env.JWT_SECRET)
}

module.exports = { isAuthenticated, generateAuthToken }