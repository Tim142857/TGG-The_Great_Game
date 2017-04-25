/**
 * Game.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {
        id: {
            type: 'integer',
            primaryKey: true,
            autoIncrement: true
        },
        turnNb: {
            type: 'integer',
            required: true
        },
        map: {
            model: 'map',
            required: true
        },
        turnPlayer: {
            model: 'user',
            required: true
        }
    },

    players: {
        collection: 'user',
        via: 'game'
    }
};

