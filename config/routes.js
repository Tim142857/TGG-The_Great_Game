/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

    /***************************************************************************
     *                                                                          *
     * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
     * etc. depending on your default view engine) your home page.              *
     *                                                                          *
     * (Alternatively, remove this and add an `index.html` file in your         *
     * `assets` directory)                                                      *
     *                                                                          *
     ***************************************************************************/

    '/': {
        view: 'homepage',
        locals: {
            layout: 'layouts/layoutVisitor'
        }
    },
    '/homepagePlayer': {
        controller: 'UserController',
        action: 'homepagePlayer'
    },
    'GET /login': {
        controller: 'AuthController',
        action: 'login',
        locals: {
            layout: 'layouts/layoutVisitor'
        }
    },
    'POST /login': {
        controller: 'AuthController',
        action: 'process',
        locals: {
            layout: 'layouts/layoutVisitor'
        }
    },
    'GET /register': {
        controller: 'AuthController',
        action: 'register',
        locals: {
            layout: 'layouts/layoutVisitor'
        }
    },
    'POST /register': {
        controller: 'AuthController',
        action: 'processRegister',
        locals: {
            layout: 'layouts/layoutVisitor'
        }
    },
    'GET /logout': {
        controller: 'AuthController',
        action: 'logout',
        locals: {
            layout: 'layouts/layoutVisitor'
        }
    },
    '/profile': {
        controller: 'UserController',
        action: 'profile'
    },
    '/settings': {
        controller: 'UserController',
        action: 'settings'
    },
    '/ranking': {
        controller: 'UserController',
        action: 'ranking'
    },
    '/rules': {
        controller: 'UserController',
        action: 'rules'
    },
    '/play': {
        controller: 'UserController',
        action: "play"
    },
    '/game/:id': {
        controller: 'GameController',
        action: "startGame"
    },
    // '/test': {
    //     controller: 'MapController',
    //     action: 'createMap'
    // },
    '/chat': {
        controller: 'ChatController',
        action: 'startChat'
    },
    '/send-message': {
        controller: 'ChatController',
        action: 'sendMessage'
    },
    '/chat-authenticate': {
        controller: 'ChatController',
        action: 'ChatAuthenticate'
    },
    '/send-poke': {
        controller: 'ChatController',
        action: 'sendPoke'
    },
    '/send-song-answer': {
        controller: 'ChatController',
        action: 'sendSongAnswer'
    },
    '/confirm-track': {
        controller: 'ChatController',
        action: 'confirmTrack'
    },
    '/change-locale/:locale': {
        controller: 'UserController',
        action: 'changeLocale'
    },
    '/insertDefaultMap': {
        controller: 'AdminController',
        action: 'insertDefaultMap'
    },
    '/insertAmeliorations': {
        controller: 'AdminController',
        action: 'insertAmeliorations'
    },
    '/insertData': {
        view: 'insertData'
    },
    '/game-authenticate': {
        controller: 'UserController',
        action: 'gameAuthenticate'
    },
    '/move-units': {
        controller: 'GameController',
        action: 'moveUnits'
    },
    '/end-turn/:id': {
        controller: 'GameController',
        action: 'endTurn'
    },
    '/add-unit/:idCase': {
        controller: 'GameController',
        action: 'addUnit'
    },
    '/update-after-reinforcements': {
        controller: 'GameController',
        action: 'updateAfterReinforcements'
    }



    /***************************************************************************
     *                                                                          *
     * Custom routes here...                                                    *
     *                                                                          *
     * If a request to a URL doesn't match any of the custom routes above, it   *
     * is matched against Sails route blueprints. See `config/blueprints.js`    *
     * for configuration options and examples.                                  *
     *                                                                          *
     ***************************************************************************/

}
;
