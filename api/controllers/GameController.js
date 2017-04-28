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
            res.view('game', {game: game})
        });
    }
};

