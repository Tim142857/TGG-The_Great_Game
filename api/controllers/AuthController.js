var passport = require('passport');

module.exports = {

    login: function (req, res) {
        res.view();
    },
    process: function (req, res) {
        passport.authenticate('local', function (err, user, info) {
            if ((err) || (!user)) {
                return res.send({
                    message: 'login failed'
                });
                res.send(err);
            }
            req.logIn(user, function (err) {
                if (err) res.send(err);
                req.session.user = user;
                res.redirect('/homepagePlayer')
            });
        })(req, res);
    },

    logout: function (req, res) {
        req.logOut();
        res.send('logout successful');
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
                req.session.message = 'test';
                res.redirect('/login')
                delete req.session
            });
    }
};

module.exports.blueprints = {
    actions: true,
    rest: true,
    shortcuts: true
};