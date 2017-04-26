/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    homepagePlayer: function (req, res) {
        console.log('user:' + req.session.user);
        res.view('homepagePlayer');
    }
};

