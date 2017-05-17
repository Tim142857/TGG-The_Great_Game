/**
 * GameController
 *
 * @description :: Server-side logic for managing Games
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var GameController = {
    startGame: function (req, res) {
        Game.findOne({
            id: req.params.id
        }).populate('players').exec(function (err, game) {
            if (err)console.log(err);

            User.findOne({id: req.session.user.id}).exec(function (err, user) {
                if (err)console.log(err);
                req.session.user = user;

                Map.findOne({game: game.id}).populate('cases').exec(function (err, map) {
                    if (err)console.log(err);

                    Case.find({game: map.game}).populate('units').populate('ownedBy').populate('amelioration').exec(function (err, cases) {
                        if (err)console.log(err);

                        cases.sort(function (a, b) {
                            return a.numCase - b.numCase;
                        });

                        TypeAmelioration.find().populate('ameliorations').exec(function (err, types) {
                            if (err)console.log(err);

                            BonusOwned.find({player: req.session.user.id}).populate('amelioration').exec(function (err, bonus) {
                                if (err)console.log(err);
                                // console.log('bonus');
                                // console.log(bonus);

                                res.view('game', {
                                    game: game,
                                    map: map,
                                    cases: cases,
                                    types: types,
                                    bonus: bonus
                                });
                            });
                        });
                    });
                });
            });
        });
    },

    moveUnits: function (req, res) {
        req.session.user.socket = sails.sockets.getId(req);
        var startCase = req.param('startCase');
        var endCase = req.param('endCase');

        Case.findOne({
            game: req.session.user.game,
            id: startCase
        }).populate('ownedBy').populate('units').exec(function (err, startCase) {
            if (err)console.log(err);

            Game.findOne(req.session.user.game).exec(function (err, game) {
                if (err)console.log(err);
                if (game.turnPlayer != req.session.user.id) {
                    res.send({
                        success: false,
                        message: "Ce n'est pas à vous de jouer"
                    });
                }
                else if (startCase.units.length <= 1) {
                    res.send({
                        success: false,
                        message: "Vous ne pouvez attaquer qu'avec une case contenant au moins 2 unités"
                    });
                }
                else if (typeof(startCase) == 'undefined') {
                    res.send({success: false, message: 'probleme de coordonnees de depart'});
                }
                else if (startCase.type != 'takable' || startCase.ownedBy.id != req.session.user.id) {
                    res.send({success: false, message: 'la case de depart ne vous appartient pas'});
                }
                else {
                    Case.findOne({
                        game: req.session.user.game,
                        id: endCase
                    }).populate('ownedBy').populate('units').exec(function (err, endCase) {
                        if (err)console.log(err);

                        //Si la case d'arrivee n'existe pas
                        if (typeof(endCase) == 'undefined') {
                            res.send({success: false, message: 'la case darrivee nexiste pas'});
                        }
                        else if (endCase.type != 'takable') {
                            res.send({success: false, message: 'la case darrivee est inacessible'});
                        }
                        else if (typeof(endCase.ownedBy) != 'undefined' && endCase.ownedBy.id == req.session.user.id) {
                            res.send({success: false, message: 'vous ne pouvez pas vous attaquer vous meme'});
                        }
                        else {
                            //recuperation du player adverse
                            Game.findOne(req.session.user.game).populate('players').exec(function (err, game) {
                                if (err)console.log(err);

                                var ennemyPlayer = null;
                                for (var i = 0; i < game.players.length; i++) {
                                    if (game.players[i].id != req.session.user.id) {
                                        ennemyPlayer = game.players[i];
                                    }
                                }
                                if (ennemyPlayer == null) {
                                    // console.log('player adverse non trouvé');
                                } else {
                                    GameController.verifCoord(startCase, endCase, game, function (verifCoord, verifCoord2, verifCoord3, verifCoord4) {
                                        console.log('----------------');
                                        console.log(verifCoord);
                                        console.log(verifCoord2);
                                        console.log(verifCoord3);
                                        console.log(verifCoord4);
                                        if (!verifCoord && !verifCoord2 && !verifCoord3 && !verifCoord4) {
                                            res.send({
                                                success: false,
                                                message: 'deplacement impossible'
                                            });
                                        } else {

                                            //Si la case darrivee est neutre
                                            if (typeof(endCase.ownedBy) == 'undefined') {
                                                //Recuperation des unites de la case de depart
                                                var unitsToSave = [];

                                                var survivor = startCase.units.length - 1;


                                                //Partie de code à vérifier---------------------------------------------------------------------


                                                //je mets les unites sauf une dans la nouvelle case
                                                Unit.find({case: startCase.id}).exec(function (err, units) {
                                                    if (err)console.log(err);

                                                    for (var i = 1; i < units.length; i++) { //i=1 car on laisse une unite sur la case
                                                        units[i].case = endCase.id;
                                                        unitsToSave.push(units[i]);
                                                        if (i == (units.length - 1)) {
                                                            unitsToSave.forEach(function (elm, index) {
                                                                Unit.update(elm.id, {case: endCase.id}).exec(function afterwards(err, updated) {
                                                                    if (err)console.log(err);
                                                                });
                                                            });
                                                        }
                                                    }
                                                });

                                                //mise a jour du ownedby de la case darrivee
                                                Case.update(endCase.id, {ownedBy: req.session.user.id}).exec(function afterwards(err, endCase) {
                                                    if (err)console.log(err);
                                                });

                                                //Fin Partie de code à vérifier---------------------------------------------------------------------
                                                sails.sockets.broadcast('room-game-' + game.id, 'update-case', {
                                                    idCase: endCase.id,
                                                    idPlayer: req.session.user.id,
                                                    units: survivor
                                                });
                                                sails.sockets.broadcast('room-game-' + game.id, 'leave-case', {
                                                    idCase: startCase.id
                                                });
                                            } else {
                                                GameController.strengthCalcul(startCase.id, endCase.id, function (idPlayerwinner, survivor) {

                                                    //si lattaquant a gagné, changement de ownedby de endCase
                                                    if (idPlayerwinner == req.session.user.id) {
                                                        Case.update(endCase.id, {ownedBy: idPlayerwinner}).exec(function afterwards(err, endCase) {

                                                        });
                                                        //----------------

                                                        Unit.find({case: startCase.id}).exec(function (err, units) {
                                                            if (err)console.log(err);

                                                            Unit.destroy({case: endCase.id}).exec(function (err) {
                                                                if (err)console.log(err);

                                                                for (var i = 0; i < survivor; i++) {
                                                                    Unit.create({
                                                                        case: endCase.id,
                                                                        minValue: 1,
                                                                        maxvalue: 6
                                                                    }).exec(function (err, unit) {
                                                                        if (err)console.log(err);
                                                                    })
                                                                }

                                                                Unit.destroy({case: startCase.id}).exec(function (err) {
                                                                    if (err)console.log(err);

                                                                    Unit.create({
                                                                        case: startCase.id,
                                                                        minValue: 1,
                                                                        maxvalue: 6
                                                                    }).exec(function (err, unit) {
                                                                        if (err)console.log(err);
                                                                    })
                                                                })
                                                            });

                                                        });

                                                        sails.sockets.broadcast('room-game-' + game.id, 'update-case', {
                                                            idCase: endCase.id,
                                                            idPlayer: req.session.user.id,
                                                            units: survivor
                                                        });
                                                        sails.sockets.broadcast('room-game-' + game.id, 'leave-case', {
                                                            idCase: startCase.id
                                                        });

                                                        //---------------------
                                                    }
                                                    //si le defenseur a gagné
                                                    else {
                                                        Unit.find({case: startCase.id}).exec(function (err, units) {
                                                            if (err)console.log(err);

                                                            //vidage de la case de depart
                                                            for (var i = 1; i < units.length; i++) { //i=1 car on laisse une unite sur la case
                                                                Unit.destroy({id: units[i].id}).exec(function (err) {
                                                                    if (err)console.log(err);
                                                                });
                                                            }
                                                        });

                                                        Unit.find({case: endCase.id}).exec(function (err, units) {
                                                            if (err)console.log(err);

                                                            for (var i = 0; i < (units.length - survivor); i++) {
                                                                Unit.destroy(units[i].id).exec(function (err) {
                                                                    if (err)console.log(err);
                                                                });
                                                            }

                                                        });

                                                        sails.sockets.broadcast('room-game-' + game.id, 'update-case', {
                                                            idCase: endCase.id,
                                                            idPlayer: endCase.ownedBy.id,
                                                            units: survivor
                                                        });
                                                        sails.sockets.broadcast('room-game-' + game.id, 'leave-case', {
                                                            idCase: startCase.id
                                                        });
                                                    }

                                                });
                                            }
                                        }
                                    });
                                    //check des coord des cases
                                    // var deltaY = startCase.coordX - endCase.coordX;
                                    // var deltaX = startCase.coordY - endCase.coordY;
                                    // var verifCoord = (Math.abs(deltaX) == 1) && (Math.abs(deltaY) == 0);
                                    // var verifCoord2 = (Math.abs(deltaX) == 0) && (Math.abs(deltaY) == 1);
                                    // var verifCoord3 = false;
                                    // var verifCoord4 = false;
                                    // if (Math.abs(deltaX) == 2 && Math.abs(deltaY) == 0) {
                                    //     var numCaseToCheck;
                                    //     if (deltaX > 0) {
                                    //         numCaseToCheck = startCase.numCase - 1;
                                    //     } else {
                                    //         numCaseToCheck = startCase.numCase + 1;
                                    //     }
                                    //     Case.findOne({
                                    //         game: game.id,
                                    //         numCase: numCaseToCheck
                                    //     }).exec(function (err, caseToCheck) {
                                    //         if (err)console.log(err);
                                    //
                                    //         if (typeof(caseToCheck) != 'undefined') {
                                    //             if (caseToCheck.horizontalBridge == true) {
                                    //                 verifCoord3 = true;
                                    //             }
                                    //         }
                                    //     });
                                    // }
                                    //
                                    // if (Math.abs(deltaX) == 0 && Math.abs(deltaY) == 2) {
                                    //     var numCaseToCheck;
                                    //     if (deltaY > 0) {
                                    //         numCaseToCheck = startCase.numCase + 10;
                                    //     } else {
                                    //         numCaseToCheck = startCase.numCase - 10;
                                    //     }
                                    //     Case.findOne({
                                    //         game: game.id,
                                    //         numCase: numCaseToCheck
                                    //     }).exec(function (err, caseToCheck) {
                                    //         if (err)console.log(err);
                                    //
                                    //         if (typeof(caseToCheck) != 'undefined') {
                                    //             if (caseToCheck.horizontalBridge == false) {
                                    //                 verifCoord3 = true;
                                    //             }
                                    //         }
                                    //     });
                                    // }

                                    // if (!verifCoord && !verifCoord2) {
                                    //     res.send({
                                    //         success: false,
                                    //         message: 'deplacement impossible'
                                    //     });
                                    // } else {
                                    //
                                    //     //Si la case darrivee est neutre
                                    //     if (typeof(endCase.ownedBy) == 'undefined') {
                                    //         //Recuperation des unites de la case de depart
                                    //         var unitsToSave = [];
                                    //
                                    //         var survivor = startCase.units.length - 1;
                                    //
                                    //
                                    //         //Partie de code à vérifier---------------------------------------------------------------------
                                    //
                                    //
                                    //         //je mets les unites sauf une dans la nouvelle case
                                    //         Unit.find({case: startCase.id}).exec(function (err, units) {
                                    //             if (err)console.log(err);
                                    //
                                    //             for (var i = 1; i < units.length; i++) { //i=1 car on laisse une unite sur la case
                                    //                 units[i].case = endCase.id;
                                    //                 unitsToSave.push(units[i]);
                                    //                 if (i == (units.length - 1)) {
                                    //                     unitsToSave.forEach(function (elm, index) {
                                    //                         Unit.update(elm.id, {case: endCase.id}).exec(function afterwards(err, updated) {
                                    //                             if (err)console.log(err);
                                    //                         });
                                    //                     });
                                    //                 }
                                    //             }
                                    //         });
                                    //
                                    //         //mise a jour du ownedby de la case darrivee
                                    //         Case.update(endCase.id, {ownedBy: req.session.user.id}).exec(function afterwards(err, endCase) {
                                    //             if (err)console.log(err);
                                    //         });
                                    //
                                    //         //Fin Partie de code à vérifier---------------------------------------------------------------------
                                    //         sails.sockets.broadcast('room-game-' + game.id, 'update-case', {
                                    //             idCase: endCase.id,
                                    //             idPlayer: req.session.user.id,
                                    //             units: survivor
                                    //         });
                                    //         sails.sockets.broadcast('room-game-' + game.id, 'leave-case', {
                                    //             idCase: startCase.id
                                    //         });
                                    //     } else {
                                    //         GameController.strengthCalcul(startCase.id, endCase.id, function (idPlayerwinner, survivor) {
                                    //
                                    //             //si lattaquant a gagné, changement de ownedby de endCase
                                    //             if (idPlayerwinner == req.session.user.id) {
                                    //                 Case.update(endCase.id, {ownedBy: idPlayerwinner}).exec(function afterwards(err, endCase) {
                                    //
                                    //                 });
                                    //                 //----------------
                                    //
                                    //                 Unit.find({case: startCase.id}).exec(function (err, units) {
                                    //                     if (err)console.log(err);
                                    //
                                    //                     Unit.destroy({case: endCase.id}).exec(function (err) {
                                    //                         if (err)console.log(err);
                                    //
                                    //                         for (var i = 0; i < survivor; i++) {
                                    //                             Unit.create({
                                    //                                 case: endCase.id,
                                    //                                 minValue: 1,
                                    //                                 maxvalue: 6
                                    //                             }).exec(function (err, unit) {
                                    //                                 if (err)console.log(err);
                                    //                             })
                                    //                         }
                                    //
                                    //                         Unit.destroy({case: startCase.id}).exec(function (err) {
                                    //                             if (err)console.log(err);
                                    //
                                    //                             Unit.create({
                                    //                                 case: startCase.id,
                                    //                                 minValue: 1,
                                    //                                 maxvalue: 6
                                    //                             }).exec(function (err, unit) {
                                    //                                 if (err)console.log(err);
                                    //                             })
                                    //                         })
                                    //                     });
                                    //
                                    //                 });
                                    //
                                    //                 sails.sockets.broadcast('room-game-' + game.id, 'update-case', {
                                    //                     idCase: endCase.id,
                                    //                     idPlayer: req.session.user.id,
                                    //                     units: survivor
                                    //                 });
                                    //                 sails.sockets.broadcast('room-game-' + game.id, 'leave-case', {
                                    //                     idCase: startCase.id
                                    //                 });
                                    //
                                    //                 //---------------------
                                    //             }
                                    //             //si le defenseur a gagné
                                    //             else {
                                    //                 Unit.find({case: startCase.id}).exec(function (err, units) {
                                    //                     if (err)console.log(err);
                                    //
                                    //                     //vidage de la case de depart
                                    //                     for (var i = 1; i < units.length; i++) { //i=1 car on laisse une unite sur la case
                                    //                         Unit.destroy({id: units[i].id}).exec(function (err) {
                                    //                             if (err)console.log(err);
                                    //                         });
                                    //                     }
                                    //                 });
                                    //
                                    //                 Unit.find({case: endCase.id}).exec(function (err, units) {
                                    //                     if (err)console.log(err);
                                    //
                                    //                     for (var i = 0; i < (units.length - survivor); i++) {
                                    //                         Unit.destroy(units[i].id).exec(function (err) {
                                    //                             if (err)console.log(err);
                                    //                         });
                                    //                     }
                                    //
                                    //                 });
                                    //
                                    //                 sails.sockets.broadcast('room-game-' + game.id, 'update-case', {
                                    //                     idCase: endCase.id,
                                    //                     idPlayer: endCase.ownedBy.id,
                                    //                     units: survivor
                                    //                 });
                                    //                 sails.sockets.broadcast('room-game-' + game.id, 'leave-case', {
                                    //                     idCase: startCase.id
                                    //                 });
                                    //             }
                                    //
                                    //         });
                                    //     }
                                    // }
                                }
                            });
                        }
                    });
                }
            });
        });
    },

    endTurn: function (req, res) {
        req.session.user.socket = sails.sockets.getId(req);
        var idPlayer = req.param('id');
        if (idPlayer != req.session.user.id) {
            res.send({
                success: false,
                message: "Ce n'est pas à vous de jouer"
            });
        } else {
            Game.findOne(req.session.user.game).populate('players').exec(function (err, game) {
                if (err)console.log(err);

                if (game.turnPlayer != req.session.user.id) {
                    res.send({
                        success: false,
                        message: "Ce n'est pas à vous de jouer"
                    });
                } else {

                    if (req.session.user.id != game.firstPlayer) {
                        game.players.forEach(function (elm, index) {
                            User.findOne(elm.id).populate('cases').exec(function (err, player) {
                                if (err)console.log(err);

                                User.update(player.id, {reinforcementsLeft: player.cases.length}).exec(function afterwards(err, records) {
                                    if (err)console.log(err);

                                    Game.update(game.id, {reinforcementsTime: true}).exec(function afterwards(err, records) {
                                        if (err)console.log(err);

                                        sails.sockets.broadcast(elm.socket, 'end-turn', {
                                            nbReinforcements: player.cases.length
                                        });
                                    });
                                });
                            });
                        });
                    } else {
                        game.players.forEach(function (elm, index) {
                            if (elm.id != req.session.user.id) {
                                Game.update(game.id, {turnPlayer: elm.id}).exec(function afterwards(err, gameUpdated) {
                                    if (err)console.log(err);

                                    var roomName = 'room-game-' + game.id;
                                    sails.sockets.broadcast(roomName, 'turn-player-change', {
                                        idPlayer: elm.id,
                                        namePlayer: elm.name
                                    });
                                });
                            }
                        });
                    }
                }
            });
        }

    },

    strengthCalcul: function (idCaseAtk, idCaseDef, callback) {
        Case.findOne(idCaseAtk).populate('units').populate('ownedBy').exec(function (err, caseAtk) {
            if (err)console.log(err);

            var strengthAtk = 0;
            for (var i = 1; i < caseAtk.units.length; i++) {
                strengthAtk += GameController.random(caseAtk.units[i].minValue, caseAtk.units[i].maxValue);
                if (i == caseAtk.units.length - 1) {
                    // console.log('length: ' + caseAtk.units.length);
                    // console.log(caseAtk.units);
                    // console.log('attaque - units:' + (caseAtk.units.length - 1) + ' / force:' + strengthAtk);

                    Case.findOne(idCaseDef).populate('units').populate('ownedBy').exec(function (err, caseDef) {
                        if (err)console.log(err);

                        var strengthDef = 0;
                        for (var j = 0; j < caseDef.units.length; j++) {
                            strengthDef += GameController.random(caseDef.units[j].minValue, caseDef.units[j].maxValue);
                            if (j == caseDef.units.length - 1) {
                                // console.log('defense - units:' + caseDef.units.length + ' / force:' + strengthDef);
                                //Determination du gagnant
                                var idPlayerWinner;

                                //determination des survivants
                                if (strengthDef >= strengthAtk) {
                                    idPlayerWinner = caseDef.ownedBy.id;
                                    var pourcentagePertes = strengthAtk * 100 / strengthDef;
                                    var pertes = Math.round(pourcentagePertes * caseDef.units.length / 100);
                                    var survivor = caseDef.units.length - pertes;
                                    // console.log('def a gagné! survivants:' + survivor);
                                } else {
                                    idPlayerWinner = caseAtk.ownedBy.id;
                                    var pourcentagePertes = strengthDef * 100 / strengthAtk;
                                    var pertes = Math.round(pourcentagePertes * caseAtk.units.length / 100);
                                    var survivor = caseAtk.units.length - pertes;
                                    console.log('atk a gagné! survivants:' + survivor);
                                }
                                if (survivor < 1)survivor = 1;


                                callback(idPlayerWinner, survivor);
                            }
                        }
                    });
                }
            }
        });
    },

    random: function (min, max) {
        return Math.floor((Math.random() * max) + min);
    },

    addUnit: function (req, res) {
        req.session.user.socket = sails.sockets.getId(req);
        var idCase = req.param('idCase');
        Case.findOne(idCase).populate('units').exec(function (err, actualCase) {
            if (err)console.log(err);

            User.findOne(req.session.user.id).exec(function (err, user) {
                if (err)console.log(err);

                if (user.reinforcementsLeft == 0) {
                    res.send({
                        success: false,
                        message: 'Vous avez deja placé tous vos renforts'
                    });
                }
                else if (req.session.user.id != actualCase.ownedBy) {
                    res.send({
                        success: false,
                        message: 'Cette case ne vous appartient pas'
                    });
                } else if (actualCase.units.length == actualCase.unitMax) {
                    res.send({
                        success: false,
                        message: "Cette case contient déjà le nombre maximum d'unités"
                    });
                } else {
                    Unit.create({case: actualCase.id}).exec(function (err, unit) {
                        if (err)console.log(err);

                        User.update(req.session.user.id, {reinforcementsLeft: user.reinforcementsLeft - 1}).exec(function afterwards(err, records) {
                            if (err)console.log(err);

                            Game.findOne(user.game).populate('players').exec(function (err, game) {
                                if (err)console.log(err);


                                sails.sockets.broadcast(req.session.user.socket, 'update-case', {
                                    idCase: actualCase.id,
                                    idPlayer: req.session.user.id,
                                    units: actualCase.units.length + 1
                                });

                                res.send({
                                    success: true,
                                    message: 'all is ok'
                                });

                                var reinforcementsTimeEnd = true;
                                for (var i = 0; i < game.players.length; i++) {
                                    if (game.players[i].reinforcementsLeft > 0) {
                                        reinforcementsTimeEnd = false;
                                    }
                                    if (i == game.players.length - 1 && reinforcementsTimeEnd) {
                                        Game.update(game.id, {turnPlayer: game.firstPlayer}).exec(function afterwards(err, gameUpdated) {
                                            if (err)console.log(err);

                                            User.findOne(game.firstPlayer).exec(function (err, user) {
                                                if (err)console.log(err);
                                                var roomName = 'room-game-' + game.id;
                                                sails.sockets.broadcast(roomName, 'turn-player-change', {
                                                    idPlayer: user.id,
                                                    namePlayer: user.name
                                                });
                                                sails.sockets.broadcast(roomName, 'reinforcementsTime-ended', {});
                                            });
                                        });
                                    }
                                }
                            });

                        });
                    });
                }
            });
        });
    },

    verifCoord: function (startCase, endCase, game, callback) {
        var deltaY = startCase.coordX - endCase.coordX;
        var deltaX = startCase.coordY - endCase.coordY;
        var verifCoord = (Math.abs(deltaX) == 1) && (Math.abs(deltaY) == 0);
        var verifCoord2 = (Math.abs(deltaX) == 0) && (Math.abs(deltaY) == 1);
        var verifCoord3 = false;
        var verifCoord4 = false;
        if (Math.abs(deltaX) == 2 && Math.abs(deltaY) == 0) {
            console.log('ici');
            var numCaseToCheck;
            if (deltaX > 0) {
                numCaseToCheck = startCase.numCase - 1;
            } else {
                numCaseToCheck = startCase.numCase + 1;
            }
            Case.findOne({
                game: game.id,
                numCase: numCaseToCheck
            }).exec(function (err, caseToCheck) {
                if (err)console.log(err);

                if (typeof(caseToCheck) != 'undefined') {
                    console.log(caseToCheck);
                    if (caseToCheck.horizontalBridge == true) {
                        verifCoord3 = true;
                    }
                    console.log(verifCoord3);
                }
            });
        }

        //Pb d'asynchrone. Passe dans le callback avt de finir les 2 conditions
        //peut etre découper les 2 ifs en 2 conditions
        if (Math.abs(deltaX) == 0 && Math.abs(deltaY) == 2) {
            console.log('ici2');
            var numCaseToCheck;
            if (deltaY > 0) {
                numCaseToCheck = startCase.numCase + 10;
            } else {
                numCaseToCheck = startCase.numCase - 10;
            }
            Case.findOne({
                game: game.id,
                numCase: numCaseToCheck
            }).exec(function (err, caseToCheck) {
                if (err)console.log(err);

                if (typeof(caseToCheck) != 'undefined') {
                    console.log(caseToCheck);
                    if (caseToCheck.horizontalBridge == false) {
                        verifCoord4 = true;
                    }
                    console.log(verifCoord4);
                }
            });
        }


        callback(verifCoord, verifCoord2, verifCoord3, verifCoord4);
    }

};

module.exports = GameController;

