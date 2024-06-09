function isValidId(req, res, next) {
    if (req.params.id) {
        if (!validateId(req.params.id)) {
            return res.status(404).json({error: 'Resource definitely not found. Invalid ID.'});
        }
        console.log(`${req.params.id} is valid.`);
        return next()
    }
    console.log(`No id in url`);
    return next();
}

function validateId(id) {
    return /^[a-fA-F0-9]{24}$/.test(id)
}

module.exports = { isValidId, validateId };