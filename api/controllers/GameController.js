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

            Map.findOne({game: game.id}).populate('cases').exec(function (err, map) {
                if (err)console.log(err);

                Case.find({game: map.game}).populate('units').populate('ownedBy').exec(function (err, cases) {
                    if (err)console.log(err);

                    cases.sort(function (a, b) {
                        return a.numCase - b.numCase;
                    });
                    res.view('game', {game: game, map: map, cases: cases});
                });
            })

        });
    }
};

