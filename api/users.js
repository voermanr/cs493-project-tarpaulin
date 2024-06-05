const {hash} = require("bcrypt");
const {isAuthenticated, generateAuthToken} = require("../lib/authenicator");
const {isAdmin} = require("../lib/authorizer");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const router = require("express").Router();

exports.router = router;

function isCreatingAdmin(req, res, next) {
    if (req.body.role === 'admin') {
        return isAuthenticated(req, res, (err) => {
            if (err) return next(err);
            return isAdmin(req, res, next);
        });
    }
    next();
}

router.post('/login', async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        res.status(400).json({
            error: 'Email and password is required to login, silly.'
        });
    } else {
        try {
            const authenticationRequester = await User.findOne({
                email: email,
            })

            if (!authenticationRequester) {
                res.status(401).json({error: 'Invalid username or password. Authorities have been notified.'});
            } else {
                const authenticatedUser = await bcrypt.compare(password, authenticationRequester.passwordHash);

                if (authenticatedUser) {
                    const token = await generateAuthToken(authenticationRequester.email);
                    res.status(200).json({
                        token: token
                    })
                }
            }
        } catch (err) { next(err); }
    }
})

router.post('/', isCreatingAdmin, async (req, res, next) => {
    try {
        if (req.body.password) {
            const hashedReqBody = {
                name: req.body.name,
                email: req.body.email,
                passwordHash: await hash(req.body.password, 10),
                role: req.body.role,
            }
            const user = await new User(hashedReqBody);
            await user.save();
            res.status(201).json({
                id: user._id,
            });
        } else {
            res.status(400).json({
                error: 'User validation failed: password: Path `password` is required'
            })
        }
    } catch (err) {
        res.status(400).json({
            error: err.message
        })
    }
})