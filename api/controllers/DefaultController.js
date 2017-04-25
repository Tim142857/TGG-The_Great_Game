/**
 * DefaultController
 *
 * @description :: Server-side logic for managing Application
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    homepage: function (req, res) {
        res.view('homepage');
    }
};

