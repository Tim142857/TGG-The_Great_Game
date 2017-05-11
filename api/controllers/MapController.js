/**
 * MapController
 *
 * @description :: Server-side logic for managing Maps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var MapController = {

    cloneMap: function (idBaseMap, idGame) {
        MapController.generateNewCases(idBaseMap, idGame, function (casesToInsert) {
            // console.log(casesToInsert);
            Case.create(casesToInsert).exec(function (err, records) {
                if (err)console.log(err);
            });
        });
    },

    generateNewCases: function (idBaseMap, idGame, callback) {
        Map.create({baseMap: idBaseMap, game: idGame}).exec(function (err, map) {
            if (err)console.log(err);
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