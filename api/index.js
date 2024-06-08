const router = module.exports = require('express').Router();

router.use('/courses', require('./courses').router);
router.use('/users', require('./users').router);
router.use('/assignments', require('./assignments').router);
