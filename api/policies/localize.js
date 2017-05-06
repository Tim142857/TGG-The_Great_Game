module.exports = function (req, res, next) {
    console.log('ici');
    if (typeof(req.session.user) == 'undefined') {
        req.locale = req.param('lang');
    } else {
        req.locale = req.session.user.lang;
    }
    console.log(req.locale);
    next();

};