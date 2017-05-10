/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var UserController = {
    homepagePlayer: function (req, res) {
        res.view('homepagePlayer');
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
                // console.log('deja co');
                var destination = '/logout';
                sails.sockets.broadcast(oldSocket, 'redirect', destination);
            }
            //update id socket in base
            User.update(req.session.user.id, {socket: newSocket}).exec(function afterwards(err, updated) {
                sails.sockets.broadcast(newSocket, 'pending');

                // check if a player is waiting for a game
                console.log('id user actuel:' + req.session.user.id);
                UserController.searchPendingPlayer(req.session.user.id, function (record) {
                        //if a player available found
                        if (record != null) {
                            //change status of the 2 players in in-game
                            User.update(req.session.user.id, {state: 'in-game'}).exec(function afterwards(err, updated) {
                                User.update(record.id, {state: 'in-game'}).exec(function afterwards(err, updated) {

                                    Game.create().exec(function (err, game) {
                                        if (err)console.log(err);
                                        //Create clone of a map. Default idBaseMap=1 => 'default map'
                                        //Second parameter id of the game just created
                                        sails.controllers.map.cloneMap(1, game.id, function (err) {
                                            if (err)console.log(err);
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
            // console.log('id actuel:' + id);
            // console.log(records);
            records.forEach(function (elm) {
                if (elm.id != id) {
                    record = elm;
                    return false;
                }
            });
            // console.log(record);
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
    }
};
module.exports = UserController;
