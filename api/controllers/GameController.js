/**
 * GameController
 *
 * @description :: Server-side logic for managing Games
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
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
        var startCase = req.param('startCase');
        var endCase = req.param('endCase');

        Case.findOne({game: req.session.user.game, id: startCase}).populate('ownedBy').exec(function (err, startCase) {
            if (err)console.log(err);

            //Si la case de depart n'existe pas
            if (typeof(startCase) == 'undefined') {
                res.send({success: false, message: 'probleme de coordonnees de depart'});
            }
            else if (startCase.type != 'takable' || startCase.ownedBy.id != req.session.user.id) {
                res.send({success: false, message: 'la case de depart ne vous appartient pas'});
            }
            else {
                Case.findOne({
                    game: req.session.user.game,
                    id: endCase
                }).populate('ownedBy').exec(function (err, endCase) {
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
                                console.log('player adverse non trouvé');
                            } else {

                                //check des coord des cases
                                var verifCoord = (Math.abs(startCase.coordX - endCase.coordX) == 1) && (Math.abs(startCase.coordY - endCase.coordY) == 0);
                                var verifCoord2 = (Math.abs(startCase.coordX - endCase.coordX) == 0) && (Math.abs(startCase.coordY - endCase.coordY) == 1);
                                if (!verifCoord && !verifCoord2) {
                                    res.send({
                                        success: false,
                                        message: 'deplacement impossible'
                                    });
                                } else {

                                    //Si la case darrivee est neutre
                                    if (typeof(endCase.ownedBy) == 'undefined') {
                                        //Recuperation des unites de la case de dpart
                                        var unitsToSave = [];


                                        //Partie de code à vérifier---------------------------------------------------------------------


                                        //je mets les unites sauf une dans la nouvelle case
                                        Unit.find({case: startCase}).exec(function (err, units) {
                                            if (err)console.log(err);
                                            for (var i = 1; i < units.length; i++) { //i=1 car on laisse une unite sur la case
                                                units[i].case(endCase);
                                                unitsToSave.push(units[i]);
                                            }
                                        });
                                        Unit.update(unitsToSave).exec(function (err, units) {
                                            if (err)console.log(err);
                                        });
                                        //mise a jour du ownedby de la case darrivee
                                        Case.update(endCase, {ownedBy: req.session.user.id}).exec(function (err, endCase) {
                                            if (err)console.log(err);
                                        });

                                        //Fin Partie de code à vérifier---------------------------------------------------------------------


                                        res.send({
                                            success: true,
                                            survivor: unitsToSave.length,
                                            idEndCase: endCase.id
                                        });

                                    } else {
                                        //combat entre unites
                                    }
                                }
                            }
                        });
                    }
                });
            }
        });

    }
};

