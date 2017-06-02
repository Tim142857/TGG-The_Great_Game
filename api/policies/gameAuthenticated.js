module.exports = function (req, res, next) {
    // User is allowed, proceed to the next policy,
    // or if this is the last policy, the controller
    var game = req.param('id');
    if (game == null || typeof(game) == 'undefined' || req.session.user == null || typeof(req.session.user) == 'undefined') {
        return res.forbidden('You are not permitted to perform this action.', {layout: 'layouts:layoutVisitor'});
    }
    User.findOne(req.session.user.id).exec(function (err, user) {
        if (err)console.log(err);

        if (user.game == game) {
            return next();
        } else {
            return res.forbidden('You are not permitted to perform this action.', {layout: 'layouts:layoutVisitor'});
        }
    });
};