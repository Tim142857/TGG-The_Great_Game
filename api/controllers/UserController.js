/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var UserController = {
    homepagePlayer: function (req, res) {
        User.findOne(req.session.user.id).exec(function (err, user) {
            if (err)console.log(err);

            req.session.user = user;
            res.view('homepagePlayer');
        });
    },

    profile: function (req, res) {
        res.view('profile');
    },

    settings: function (req, res) {
        res.view('settings');
    },

    ranking: function (req, res) {
        res.view('ranking');
    },

    rules: function (req, res) {
        res.view('rules');
    },

    play: function (req, res) {
        var oldSocket = req.session.user.socket;
        var newSocket = sails.sockets.getId(req);
        if (!req.isSocket) {
            console.log('bad request');
        } else {
            //Check if the player is alrdy waiting somewhere
            if (oldSocket != null) {
                var destination = '/logout';
                sails.sockets.broadcast(oldSocket, 'redirect', destination);
            }
            //update id socket in base
            User.update(req.session.user.id, {socket: newSocket}).exec(function afterwards(err, updated) {
                sails.sockets.broadcast(newSocket, 'pending');

                // check if a player is waiting for a game
                UserController.searchPendingPlayer(req.session.user.id, function (record) {
                        //if a player available found
                        if (record != null) {
                            //change status of the 2 players in in-game
                            User.update(req.session.user.id, {
                                state: 'in-game',
                                colorCase: 'red',
                                ressourceQt: 0
                            }).exec(function afterwards(err, updated) {
                                if (err)console.log(err);
                                User.update(record.id, {
                                    state: 'in-game',
                                    colorCase: 'grey',
                                    ressourceQt: 0
                                }).exec(function afterwards(err, updated) {
                                    if (err)console.log(err);

                                    Game.create({
                                        turnPlayer: req.session.user.id,
                                        firstPlayer: req.session.user.id
                                    }).exec(function (err, game) {
                                        if (err)console.log(err);
                                        //Create clone of a map. Default idBaseMap=1 => 'default map'
                                        //Second parameter id of the game just created
                                        sails.controllers.map.cloneMap(1, game.id, function (err) {
                                            if (err)console.log(err);
                                        });
                                        User.update({id: req.session.user.id, game: game.id}).exec(function (err, user) {
                                            req.session.user = user;
                                        });

                                        game.players.add(req.session.user.id);
                                        game.players.add(record.id);
                                        Map.findOne({game: game.id}).exec(function (err, map) {
                                            game.map = map;
                                            if (err)console.log(err);
                                            game.save(function (err) {
                                                if (err) {
                                                    return res.serverError(err);
                                                }
                                                Game.findOne({id: game.id}).populate('players').exec(function (err, game) {
                                                    if (err) {
                                                        return res.serverError(err);
                                                    }
                                                    //Start of the game
                                                    var destination = '/game/' + game.id;
                                                    sails.sockets.broadcast([newSocket, record.socket], 'redirect', destination);
                                                });

                                            });
                                        });

                                    });
                                });
                            });
                        }

                        //if no player found
                        else {
                            User.update(req.session.user.id, {state: 'pending'}).exec(function afterwards(err, updated) {
                                res.view('play', {id: null});
                            });
                        }

                    }
                );
            });

        }
        //sinon mise en attente
        //création de la game
        //renvoi vers la vue
    },

    searchPendingPlayer: function (id, callback) {
        User.find({state: 'pending'}).exec(function (err, records) {
            var record;
            records.forEach(function (elm) {
                if (elm.id != id) {
                    record = elm;
                    return false;
                }
            });
            if (record == 'undefined' || typeof(record) == 'undefined') {
                record = null;
            }
            callback(record);
        });
    },

    changeLocale: function (req, res) {
        User.update(req.session.user.id, {lang: req.params.locale}).exec(function (err, user) {
            if (err)console.log(err);
            res.redirect('/settings');
            req.session.user = user;
        });
    },

    gameAuthenticate: function (req, res) {
        var newSocket = sails.sockets.getId(req);
        req.session.user.socket = newSocket;
        User.update(req.session.user.id, {socket: newSocket}).exec(function afterwards(err, users) {
            req.session.user = users[0];
            if (err) {
                console.log(err);
                res.send({success: false, error: err, message: 'Authentification échouée, rechargez la page svp'});
            }
            Game.findOne(req.session.user.game).populate('players').exec(function (err, game) {
                if (err)console.log(err);
                var roomName = 'room-game-' + game.id;
                sails.sockets.join(newSocket, roomName, function (err) {
                    if (err)console.log(err);
                });
            });
        });
    },
};
module.exports = UserController;
