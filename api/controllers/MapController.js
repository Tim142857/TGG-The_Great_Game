/**
 * MapController
 *
 * @description :: Server-side logic for managing Maps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    createMap: function (req, res) {
        var idGame = 1;
        var height = 10;
        var width = 10;
        var numCase = 1;
        for (var x = 0; x < height; x++) {
            for (var y = 0; y < width; y++) {
                var params = [];
                params.game = idGame;
                params.numCase = numCase;
                params.coordX = x;
                params.coordY = y;
                params.isTakable = true;

                numCase++;

                Case.create(params).exec(function (err, pet) {
                });
            }
        }
    }
};

