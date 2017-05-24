module.exports = function (req, res, next) {
    // User is allowed, proceed to the next policy,
    // or if this is the last policy, the controller
    var game = req.param('id');
    User.findOne(req.session.user.id).exec(function (err, user) {
        if (err)console.log(err);

        if (user.game == game) {
            return next();
        } else {
            return res.forbidden('You are not permitted to perform this action.', {layout: 'layouts:layoutVisitor'});
        }
    });
    // if (req.session.user.role == 'admin') {
    //     return next();
    // }
    //
    // // User is not allowed
    // // (default res.forbidden() behavior can be overridden in `config/403.js`)
    // return res.forbidden('You are not permitted to perform this action.', {layout: 'layouts:layoutVisitor'});
};