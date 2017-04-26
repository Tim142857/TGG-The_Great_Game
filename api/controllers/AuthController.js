var passport = require('passport');

module.exports = {

    login: function (req, res) {
        res.view();
    },
    process: function (req, res) {
        passport.authenticate('local', function (err, user, info) {
            if ((err) || (!user)) {
                req.addFlash('error', 'login fail');
                res.redirect('/login');
            } else {
                req.logIn(user, function (err) {
                    if (err) res.send(err);
                    req.session.user = user;
                    res.redirect('/homepagePlayer')
                });
            }
        })(req, res);
    },

    logout: function (req, res) {
        delete req.session.user;
        req.logOut();
        req.addFlash('info', 'logout successful');
        res.redirect('/');
    },

    register: function (req, res) {
        res.view();
    },

    processRegister: function (req, res) {
        var params = req.params.all();

        User.create(params)
            .exec(function (err, user) {
                if (err) {
                    res.send(err);
                    console.log(err);
                }
                req.addFlash('success', 'Registration successful, you can login now!');
                res.redirect('/login')
            });
    }
};

module.exports.blueprints = {
    actions: true,
    rest: true,
    shortcuts: true
};