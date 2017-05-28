/**
 * GameController
 *
 * @description :: Server-side logic for managing Games
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var GameController = {
    startGame: function (req, res) {
        if (typeof(req.session.cases) == 'undefined') {
            req.session.cases = [];
        }
        if (typeof(req.session.newUnits) == 'undefined') {
            req.session.newUnits = [];
        }
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
        Game.findOne(req.session.user.game).exec(function (err, game) {
            if (game.reinforcementsTime == true) {
                res.send({
                    success: false,
                    message: "Reinforcements Time!"
                });
            } else {

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
                                        } else {
                                            GameController.verifCoord(startCase, endCase, game, function (verifCoord, verifCoord2, verifCoord3, verifCoord4) {

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


                                                        //je mets les unites sauf une dans la case de depart
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

                                                            endCase = endCase[0];
                                                            if (endCase.amelioration != null) {
                                                                Amelioration.findOne(endCase.amelioration).exec(function (err, amelioration) {
                                                                    if (err)console.log(err);

                                                                    var newRessource = req.session.user.ressourceQt + amelioration.value;
                                                                    User.update(req.session.user.id, {ressourceQt: newRessource}).exec(function afterwards(err, user) {
                                                                        if (err)console.log(err);

                                                                        Case.update(endCase.id, {amelioration: null}).exec(function afterwards(err, updatedRecords) {
                                                                            if (err)console.log(err);


                                                                            req.session.user = user[0];
                                                                            sails.sockets.broadcast('room-game-' + game.id, 'update-ressource-case', {
                                                                                idCase: endCase.id,
                                                                                idPlayer: req.session.user.id,
                                                                                newRessource: req.session.user.ressourceQt
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            }
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

                                                                Unit.find({case: startCase.id}).exec(function (err, units) {
                                                                    if (err)console.log(err);

                                                                    Unit.destroy({case: endCase.id}).exec(function (err) {
                                                                        if (err)console.log(err);

                                                                        for (var i = 0; i < survivor; i++) {
                                                                            Unit.create({
                                                                                case: endCase.id,
                                                                            }).exec(function (err, unit) {
                                                                                if (err)console.log(err);
                                                                            })
                                                                        }

                                                                        Unit.destroy({case: startCase.id}).exec(function (err) {
                                                                            if (err)console.log(err);

                                                                            Unit.create({
                                                                                case: startCase.id,
                                                                            }).exec(function (err, unitStartCase) {
                                                                                if (err)console.log(err);


                                                                                //Check si victoire
                                                                                GameController.checkWin(req, function (win, idWinner) {
                                                                                    sails.sockets.broadcast('room-game-' + game.id, 'update-case', {
                                                                                        idCase: endCase.id,
                                                                                        idPlayer: req.session.user.id,
                                                                                        units: survivor
                                                                                    });
                                                                                    sails.sockets.broadcast('room-game-' + game.id, 'leave-case', {
                                                                                        idCase: startCase.id
                                                                                    });
                                                                                    if (win) {
                                                                                        User.findOne(idWinner).exec(function (err, user) {
                                                                                            if (err)console.log(err);

                                                                                            sails.sockets.broadcast('room-game-' + game.id, 'win', {
                                                                                                winner: user.name
                                                                                            });

                                                                                            //pansement pr probleme de la dernière unité qui ne se détruit pas au end game
                                                                                            Unit.destroy(unitStartCase.id).exec(function (err) {
                                                                                                if (err)console.log(err);
                                                                                            });
                                                                                            GameController.endGame(req, idWinner);
                                                                                        });
                                                                                    }
                                                                                });
                                                                            })
                                                                        })
                                                                    });

                                                                });
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
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            }
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

                    //Fin du tour du deuxieme joueur =>reinforcements time
                    if (req.session.user.id != game.firstPlayer) {
                        game.players.forEach(function (elm, index) {
                            User.findOne(elm.id).populate('cases').exec(function (err, player) {
                                if (err)console.log(err);

                                User.update(player.id, {reinforcementsLeft: player.cases.length}).exec(function afterwards(err, records) {
                                    if (err)console.log(err);

                                    var turnNb = game.turnNb++;
                                    Game.update(game.id, {
                                        reinforcementsTime: true,
                                        turnNb: turnNb
                                    }).exec(function afterwards(err, records) {
                                        if (err)console.log(err);

                                        sails.sockets.broadcast(elm.socket, 'end-turn', {
                                            nbReinforcements: player.cases.length
                                        });
                                    });
                                });
                            });
                        });
                    }
                    //fin du tour du premier joueur
                    else {
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
                strengthAtk += GameController.random(caseAtk.units[i].minAtkValue, caseAtk.units[i].maxAtkValue);
                if (i == caseAtk.units.length - 1) {

                    Case.findOne(idCaseDef).populate('units').populate('ownedBy').exec(function (err, caseDef) {
                        if (err)console.log(err);

                        var strengthDef = 0;
                        for (var j = 0; j < caseDef.units.length; j++) {
                            strengthDef += GameController.random(caseDef.units[j].minDefValue, caseDef.units[j].maxDefValue);
                            if (j == caseDef.units.length - 1) {
                                //Determination du gagnant
                                var idPlayerWinner;

                                //determination des survivants
                                if (strengthDef >= strengthAtk) {
                                    idPlayerWinner = caseDef.ownedBy.id;
                                    var pourcentagePertes = strengthAtk * 100 / strengthDef;
                                    var pertes = Math.round(pourcentagePertes * caseDef.units.length / 100);
                                    var survivor = caseDef.units.length - pertes;
                                } else {
                                    idPlayerWinner = caseAtk.ownedBy.id;
                                    var pourcentagePertes = strengthDef * 100 / strengthAtk;
                                    var pertes = Math.round(pourcentagePertes * caseAtk.units.length / 100);
                                    var survivor = caseAtk.units.length - pertes;
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
        User.findOne(req.session.user.id).populate('cases').exec(function (err, user) {
            if (user.cases.length == user.reinforcementsLeft) {
                req.session.newUnits = [];
            } else {
            }
        });

        req.session.user.socket = sails.sockets.getId(req);
        var idCase = req.param('idCase');
        Case.findOne(idCase).populate('units').exec(function (err, actualCase) {
            if (err)console.log(err);

            User.findOne(req.session.user.id).exec(function (err, user) {
                if (err)console.log(err);

                var unitsToCheck = req.session.newUnits.filter(function (elm) {
                    return elm.idCase == actualCase.id;
                })[0];
                var nbUnits = typeof(unitsToCheck) == 'undefined' ? 'undefined' : unitsToCheck.units;
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
                }
                else if (actualCase.units.length == actualCase.unitsMax) {
                    res.send({
                        success: false,
                        message: "Cette case contient déjà le nombre maximum d'unités"
                    });
                }
                else if (typeof(nbUnits) != 'undefined' && nbUnits + actualCase.units.length >= actualCase.unitsMax) {
                    res.send({
                        success: false,
                        message: "Cette case contient déjà le nombre maximum d'unités"
                    });
                } else {

                    //je stocke les unités à add en variable de sessions
                    //et a lorsque les 2 joueurs ont choisi, je les ajoute tous
                    var index = req.session.newUnits.length;
                    if (index == 0) {
                        req.session.newUnits.push({idCase: actualCase.id, units: 1});

                        var unitToAdd = 1;
                        sails.sockets.broadcast(req.session.user.socket, 'update-case', {
                            idCase: actualCase.id,
                            idPlayer: req.session.user.id,
                            units: actualCase.units.length + unitToAdd
                        });
                    } else {
                        var caseFound = false;
                        var length = req.session.newUnits.length;
                        for (var i = 0; i < length; i++) {
                            if (req.session.newUnits[i].idCase == actualCase.id) {
                                req.session.newUnits[i].units++;
                                caseFound = true;
                            }
                            if (i == (req.session.newUnits.length - 1)) {
                                if (!caseFound) {
                                    req.session.newUnits.push({idCase: actualCase.id, units: 1});
                                }
                            }
                        }

                        var unitsToAdd = req.session.newUnits.filter(function (elm) {
                            return elm.idCase == actualCase.id;
                        })[0].units;
                        sails.sockets.broadcast(req.session.user.socket, 'update-case', {
                            idCase: actualCase.id,
                            idPlayer: req.session.user.id,
                            units: actualCase.units.length + unitsToAdd
                        });
                    }


                    res.send({
                        success: true,
                        message: 'all is ok'
                    });

                    User.update(req.session.user.id, {reinforcementsLeft: user.reinforcementsLeft - 1}).exec(function afterwards(err, records) {
                        if (err)console.log(err);

                        Game.findOne(user.game).populate('players').exec(function (err, game) {
                            if (err)console.log(err);

                            var reinforcementsTimeEnd = true;
                            for (var i = 0; i < game.players.length; i++) {
                                if (game.players[i].reinforcementsLeft > 0) {
                                    reinforcementsTimeEnd = false;
                                }
                                if (i == game.players.length - 1 && reinforcementsTimeEnd) {
                                    sails.sockets.broadcast('room-game-' + game.id, 'reinforcements-set', {});

                                    Game.update(game.id, {
                                        turnPlayer: game.firstPlayer,
                                        reinforcementsTime: false
                                    }).exec(function afterwards(err, gameUpdated) {
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
                }
            });
        });
    },

    verifCoord: function (startCase, endCase, game, callback) {
        var deltaY = startCase.coordX - endCase.coordX;
        var deltaX = startCase.coordY - endCase.coordY;
        var verifCoord = (Math.abs(deltaX) == 1) && (Math.abs(deltaY) == 0);
        var verifCoord2 = (Math.abs(deltaX) == 0) && (Math.abs(deltaY) == 1);

        GameController.verifDelta(startCase, endCase, game, function (verifCoord3) {
            GameController.verifDelta2(startCase, endCase, game, function (verifCoord4) {
                callback(verifCoord, verifCoord2, verifCoord3, verifCoord4);
            });
        });

    },

    verifDelta: function (startCase, endCase, game, callback) {
        var deltaY = startCase.coordX - endCase.coordX;
        var deltaX = startCase.coordY - endCase.coordY;

        if (Math.abs(deltaX) == 2 && Math.abs(deltaY) == 0) {
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
                    if (caseToCheck.horizontalBridge == true) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                } else {
                    callback(false);
                }
            });
        } else {
            callback(false);
        }
    },

    verifDelta2: function (startCase, endCase, game, callback) {
        var deltaY = startCase.coordX - endCase.coordX;
        var deltaX = startCase.coordY - endCase.coordY;

        if (Math.abs(deltaX) == 0 && Math.abs(deltaY) == 2) {
            var numCaseToCheck;
            if (deltaY > 0) {
                numCaseToCheck = startCase.numCase - 10;
            } else {
                numCaseToCheck = startCase.numCase + 10;
            }
            Case.findOne({
                game: game.id,
                numCase: numCaseToCheck
            }).exec(function (err, caseToCheck) {
                if (err)console.log(err);


                if (typeof(caseToCheck) != 'undefined') {
                    if (caseToCheck.horizontalBridge == false) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                } else {
                    callback(false);
                }
            });
        } else {
            callback(false);
        }
    },

    checkWin: function (req, callback) {
        User.find({game: req.session.user.game}).populate('cases').exec(function (err, players) {
            var win = true;
            var onePlayerWithCases = false;
            var idWinner;

            for (var i = 0; i < players.length; i++) {
                if (!onePlayerWithCases && players[i].cases.length > 0) {
                    onePlayerWithCases = true;
                    idWinner = players[i].id;
                }
                else if (onePlayerWithCases && players[i].cases.length > 0) {
                    win = false;
                }
                if (i == (players.length - 1)) {
                    callback(win, idWinner);
                }
            }
        });
    },

    endGame: function (req, idWinner) {

        Case.destroy({game: req.session.user.game}).exec(function (err) {
            if (err)console.log(err);
        });

        Game.update(req.session.user.game, {winner: idWinner}).exec(function afterwards(err, gameUpdated) {
            if (err)console.log(err);

            Game.findOne(req.session.user.game).populate('players').exec(function (err, game) {
                if (err)console.log(err);

                var totalElo = 0;
                game.players.forEach(function (elm, index) {
                    totalElo += elm.elo;
                    var totalGames = elm.totalGames + 1;
                    var wins = elm.id == idWinner ? (elm.wins + 1) : elm.wins;
                    var eloBonus = elm.id == idWinner ? 30 : -30;
                    var elo = elm.elo + eloBonus;
                    User.update(elm.id, {
                        state: 'connected',
                        game: null,
                        socket: null,
                        colorCase: null,
                        reinforcementsLeft: null,
                        wins: wins,
                        totalGames: totalGames,
                        elo: elo
                    }).exec(function afterwards(err, user) {
                        if (err)console.log(err);
                    });
                });
            });
        });
    },

    //update cases and bonus after reinforcements time
    updateAfterReinforcements: function (req, res) {
        var unitsToCreate = [];
        var casesUpdated = [];
        var length = req.session.newUnits.length;
        for (var i = 0; i < length; i++) {
            casesUpdated.push(req.session.newUnits[i].idCase);
            for (var j = 0; j < req.session.newUnits[i].units; j++) {
                unitsToCreate.push({case: req.session.newUnits[i].idCase});
            }
            if (i == length - 1) {
                Unit.create(unitsToCreate).exec(function (err, units) {
                    if (err)console.log(err);

                    Case.find(casesUpdated).populate('ownedBy').populate('units').exec(function (err, cases) {
                        cases.forEach(function (elm, index) {
                            sails.sockets.broadcast('room-game-' + req.session.user.game, 'update-case', {
                                idCase: elm.id,
                                idPlayer: elm.ownedBy.id,
                                units: elm.units.length
                            });
                        });
                    });
                });
            }
            Game.findOne(req.session.user.game).exec(function (err, game) {
                if (err)console.log(err);

                req.session.cases = [];
                req.session.newUnits = [];
            });
        }

        GameController.updateBonus(req);
    },

    lvlUpAmelioration: function (req, res) {

        var idAmelioration = req.param('idAmelioration');

        Game.findOne(req.session.user.game).exec(function (err, game) {
            if (err)console.log(err);

            if (game.turnPlayer != req.session.user.id) {
                res.send({
                    success: false,
                    message: "Ce n'est pas à vous de jouer"
                });
            } else {
                BonusOwned.findOne({
                    player: req.session.user.id,
                    amelioration: idAmelioration
                }).exec(function (err, bonus) {
                    if (err)console.log(err);

                    if (typeof(bonus) != 'undefined') {
                        res.send({
                            success: false,
                            message: "Vous avez déjà lancé cette recherche"
                        });
                    } else {
                        Amelioration.findOne(idAmelioration).exec(function (err, amelioration) {
                            if (err)console.log(err);

                            if (amelioration.level > 1) {
                                BonusOwned.findOne({
                                    player: req.session.user.id,
                                    amelioration: amelioration.id - 1
                                }).exec(function (err, subBonus) {
                                    if (err)console.log(err);

                                    if (typeof(subBonus) == 'undefined') {
                                        res.send({
                                            success: false,
                                            message: "Vous devez rechercher d'abord le level inférieur"
                                        });
                                    } else {
                                        User.findOne(req.session.user.id).exec(function (err, user) {
                                            if (err)console.log(err);

                                            if (user.ressourceQt < amelioration.manaCost) {
                                                res.send({
                                                    success: false,
                                                    message: "Ressources insuffisantes"
                                                });
                                            } else {
                                                var isActive = amelioration.delayToUse == 0;
                                                BonusOwned.create({
                                                    startTurn: game.turnNb,
                                                    amelioration: idAmelioration,
                                                    player: req.session.user.id,
                                                    isActive: isActive
                                                }).exec(function (err, bonus) {
                                                    var progres = isActive ? 100 : 0;

                                                    sails.sockets.broadcast(user.socket, 'update-research', {
                                                        idAmelioration: idAmelioration,
                                                        progres: progres
                                                    });

                                                    var newRessource = user.ressourceQt - amelioration.manaCost;
                                                    User.update(req.session.user.id, {ressourceQt: newRessource}).exec(function afterwards(err, updatedRecords) {
                                                        if (err)console.log(err);

                                                        sails.sockets.broadcast('room-game-' + game.id, 'update-ressource-case', {
                                                            idPlayer: req.session.user.id,
                                                            idCase: null,
                                                            newRessource: updatedRecords[0].ressourceQt
                                                        });
                                                    })

                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                User.findOne(req.session.user.id).exec(function (err, user) {
                                    if (err)console.log(err);

                                    if (user.ressourceQt < amelioration.manaCost) {
                                        res.send({
                                            success: false,
                                            message: "Ressources insuffisantes"
                                        });
                                    } else {
                                        var isActive = amelioration.delayToUse == 0;
                                        BonusOwned.create({
                                            startTurn: game.turnNb,
                                            amelioration: idAmelioration,
                                            player: req.session.user.id,
                                            isActive: isActive
                                        }).exec(function (err, bonus) {
                                            var progres = isActive ? 100 : 0;

                                            sails.sockets.broadcast(user.socket, 'update-research', {
                                                idAmelioration: idAmelioration,
                                                progres: progres
                                            });

                                            var newRessource = user.ressourceQt - amelioration.manaCost;
                                            User.update(req.session.user.id, {ressourceQt: newRessource}).exec(function afterwards(err, updatedRecords) {
                                                if (err)console.log(err);

                                                sails.sockets.broadcast('room-game-' + game.id, 'update-ressource-case', {
                                                    idPlayer: req.session.user.id,
                                                    idCase: null,
                                                    newRessource: updatedRecords[0].ressourceQt
                                                });
                                            })

                                            GameController.updateUnitsAfterBonus(req, amelioration.id);
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    },

    updateBonus: function (req) {
        Game.findOne(req.session.user.game).exec(function (err, game) {
            if (err)console.log(err);

            BonusOwned.find({player: req.session.user.id}).populate('amelioration').exec(function (err, bonus) {
                if (err)console.log(err);

                bonus.forEach(function (elm, index) {
                    var pourcentage = elm.amelioration.delayToUse > 0 ? Math.floor((game.turnNb - elm.startTurn) / elm.amelioration.delayToUse * 100) : 100;

                    if (pourcentage > 100)pourcentage = 100;
                    sails.sockets.broadcast(req.session.user.socket, 'update-research', {
                        idAmelioration: elm.amelioration.id,
                        progres: pourcentage
                    });

                    if (game.turnNb - elm.startTurn == elm.amelioration.delayToUse) {
                        GameController.updateUnitsAfterBonus(req, elm.amelioration.id, null);
                    }

                });
            });
        });
    },

    updateUnitsAfterBonus: function (req, idAmelioration, callback) {
        var changeToDo = false;
        var querySet = '';
        var textToSend = '';
        User.findOne(req.session.user.id).exec(function (err, user) {
            if (err)console.log(err);

            Amelioration.findOne(idAmelioration).exec(function (err, amelioration) {
                if (err)console.log(err);

                Case.findOne({ownedBy: user.id}).populate('units').exec(function (err, actualCase) {
                    if (err)console.log(err);

                    if (typeof(actualCase) == 'undefined' || actualCase == null) {
                        console.log('problème pendant vchargment de case');
                    }

                    switch (amelioration.type) {
                        case 1:
                            changeToDo = true;
                            textToSend = "Changements sur vos unités:" + "\n";
                            textToSend += "Valeur atk: " + actualCase.units[0].minAtkValue + "/" + actualCase.units[0].maxAtkValue + " =>";
                            textToSend += (amelioration.value + actualCase.units[0].minAtkValue) + "/" + (amelioration.value + actualCase.units[0].maxAtkValue);
                            querySet = 'minAtkValue=' + (amelioration.value + actualCase.units[0].minAtkValue) + ', maxAtkValue=' + (amelioration.value + actualCase.units[0].maxAtkValue);
                            break;
                        case 2:
                            changeToDo = true;
                            textToSend = "Changements sur vos unités:" + "\n";
                            textToSend += "Valeur def: " + actualCase.units[0].minDefValue + "/" + actualCase.units[0].maxDefValue + " =>";
                            textToSend += (amelioration.value + actualCase.units[0].minDefValue) + "/" + (amelioration.value + actualCase.units[0].maxDefValue);
                            querySet = 'minDefValue=' + (amelioration.value + actualCase.units[0].minDefValue) + ', maxDefValue=' + (amelioration.value + actualCase.units[0].maxDefValue);
                            break;
                        case 3:
                            changeToDo = true;
                            textToSend = "Changements sur vos unités:" + "\n";
                            textToSend += "Valeur atk: " + actualCase.units[0].minAtkValue + "/" + actualCase.units[0].maxAtkValue + " =>";
                            textToSend += (amelioration.value + actualCase.units[0].minAtkValue) + "/" + (amelioration.value + actualCase.units[0].maxAtkValue);
                            textToSend += "\n";
                            textToSend += "Valeur def: " + actualCase.units[0].minDefValue + "/" + actualCase.units[0].maxDefValue + " =>";
                            textToSend += (amelioration.value + actualCase.units[0].minDefValue) + "/" + (amelioration.value + actualCase.units[0].maxDefValue);
                            querySet = 'minDefValue=' + (amelioration.value + actualCase.units[0].minDefValue) + ', maxDefValue=' + (amelioration.value + actualCase.units[0].maxDefValue) + ', minAtkValue=' + (amelioration.value + actualCase.units[0].minAtkValue) + ', maxAtkValue=' + (amelioration.value + actualCase.units[0].maxAtkValue);
                            break;
                        default:
                            break;
                    }
                    var query = "update unit u inner join `case` c on u.case=c.id set " + querySet + " where c.ownedBy=" + req.session.user.id;

                    if (changeToDo) {
                        Unit.query(query, null, function (err, rawResult) {
                            if (err) {
                                console.log(err);
                            }

                            sails.sockets.broadcast(user.socket, 'update-units', {
                                message: textToSend
                            });

                        });
                    }

                    if (typeof(callback) != 'undefined' && callback != null) {
                        callback();
                    }
                });
            });
        });
    }
};

module.exports = GameController;

