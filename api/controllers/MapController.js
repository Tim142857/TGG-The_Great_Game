/**
 * MapController
 *
 * @description :: Server-side logic for managing Maps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var MapController = {

    cloneMap: function (idBaseMap, idGame) {
        MapController.generateNewCases(idBaseMap, idGame, function (casesToInsert) {

            //Insertion de toutes les cases
            Case.create(casesToInsert).exec(function (err, records) {
                if (err)console.log(err);

                records.sort(function (a, b) {
                    return a.numCase - b.numCase;
                });

                //Recuperation des players de la game
                Game.findOne({id: records[1].game}).populate('players').exec(function (err, game) {
                    if (err)console.log(err);

                    //Set 1 case/per player with 3 units on each
                    for (var i = 0; i < game.players.length; i++) {
                        var indexCase1 = 0;
                        do {
                            indexCase1 = Math.floor((Math.random() * (records.length - 1)));
                            if (typeof(records[indexCase1]) == 'undefined') {
                                console.log('pb index sur:' + indexCase1);
                            }
                            // console.log(indexCase1);
                            // console.log(typeof(records[indexCase1].amelioration));
                        } while (records[indexCase1].type != 'takable' || records[indexCase1].ownedBy != null || records[indexCase1].amelioration != null)
                        records[indexCase1].ownedBy = game.players[i];
                        records[indexCase1].save(function (err) {
                            if (err)console.log(err);
                        });
                        var unitstoCreate = [{case: records[indexCase1].id}, {case: records[indexCase1].id}, {case: records[indexCase1].id}, {case: records[indexCase1].id}];
                        Unit.create(unitstoCreate).exec(function (err, units) {
                            if (err)console.log(err);
                        });
                    }
                });
            });

        });

    },

    generateNewCases: function (idBaseMap, idGame, callback) {
        Map.create({baseMap: idBaseMap, game: idGame}).exec(function (err, map) {
            if (err)console.log(err);

            Game.update(idGame, {map: map.id}).exec(function (err, game) {
                if (err)console.log(err);
            });

            BaseCase.find({baseMap: map.baseMap}).exec(function (err, baseCases) {
                if (err)console.log(err);
                var casesToInsert = [];
                for (var i = 0; i < baseCases.length; i++) {
                    var newCase = baseCases[i];
                    var caseToInsert = {
                        game: idGame,
                        map: map.id,
                        numCase: newCase.numCase,
                        coordX: newCase.coordX,
                        coordY: newCase.coordY,
                        type: newCase.type,
                        horizontalBridge: newCase.horizontalBridge,
                        amelioration: newCase.amelioration
                    }
                    casesToInsert.push(caseToInsert);
                }
                callback(casesToInsert);
            });
        });

    }

};

module.exports = MapController;