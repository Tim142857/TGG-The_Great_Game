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
        //check si un joueur en attente
        UserController.searchPendingPlayer(function (id) {
            res.view('play', {id: id});
        });
        //sinon mise en attente
        //création de la game
        //renvoi vers la vue
    },

    searchPendingPlayer: function (callback) {
        User.findOne({state: 'pending'}).exec(function (err, record) {
            var id = null;
            if (record == 'undefined' || typeof(record) == 'undefined') {
                id = -1;
            } else {
                id = record.id;
            }
            callback(id);
        });
    }
};
module.exports = UserController;
