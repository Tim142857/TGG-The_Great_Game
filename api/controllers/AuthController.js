var passport = require('passport');

module.exports = {

    login: function (req, res) {
        res.view();
    },
    process: function (req, res) {
        passport.authenticate('local', function (err, user, info) {
            if ((err) || (!user)) {
                req.addFlash('error', req.__('login fail'));
                res.redirect('/login');
            } else {
                req.logIn(user, function (err) {
                    if (err) res.send(err);
                    req.session.user = user;
                    //check if user wasnt alrdy logged somewhere
                    // console.log(req.session);
                    if (user.session != null) {
                        console.log('alrdy logged');
                        console.log(user.session.sid);
                    }
                    User.update(user.id, {
                        state: 'connected',
                        session: req.session.sid
                    }).exec(function afterwards(err, updated) {
                    });
                    //check si une game en cours
                    if (typeof(user.game) == 'number') {
                        res.redirect('/game/' + user.game);
                    } else {
                        res.redirect('/homepagePlayer');
                    }

                });
            }
        })(req, res);
    },

    logout: function (req, res) {
        // console.log('logout');
        if (req.session.user.id != null) {
            User.update(req.session.user.id, {state: 'disconnected'}).exec(function afterwards(err, updated) {
            });
            delete req.session.user;
        }
        req.logOut();
        req.addFlash('info', req.__('logout successful'));
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
                    // res.send(err);
                    // console.log(err);
                    req.addFlash('error', err);
                    res.redirect('/login')
                } else {
                    req.addFlash('success', req.__('registration successful, you can login now!'));
                    res.redirect('/login');
                }
            });
    }
};

module.exports.blueprints = {
    actions: true,
    rest: true,
    shortcuts: true
};