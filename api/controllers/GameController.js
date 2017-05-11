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

                Case.find({game: map.game}).populate('units').exec(function (err, cases) {

                    //Set 1 case/per player with 3 units on each
                    // for (var i = 0; i < game.players.length; i++) {
                    //     var indexCase1 = 0;
                    //     do {
                    //         indexCase1 = Math.floor((Math.random() * cases.length) + 1);
                    //     } while (cases[indexCase1].type != 'takable' || cases[indexCase1].ownedBy != null)
                    //     cases[indexCase1].add()
                    // }

                    Case.update(cases).exec(function (err, cases) {
                        if (err)console.log(err);
                        cases.sort(function (a, b) {
                            return a.numCase - b.numCase;
                        });
                        res.view('game', {game: game, map: map, cases: cases})
                    });
                });
            })

        });
    }
};

