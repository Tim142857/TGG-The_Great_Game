/**
 * Map.js
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
        baseMap: {
            model: 'baseMap',
            required: true
        },
        game: {
            model: 'game',
            required: true
        },
        cases: {
            collection: 'case',
            via: 'map'
        }
    }
};

