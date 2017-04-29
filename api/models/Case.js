/**
 * Case.js
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
        game: {
            model: 'game',
            required: true
        },
        ownedBy: {
            model: 'user',
            required: false
        },
        numCase: {
            type: 'integer',
            required: true
        },
        coordX: {
            type: 'integer',
            required: true
        },
        coordY: {
            type: 'integer',
            required: true,
        },
        isTakable: {
            type: 'boolean',
            required: true
        },
        amelioration: {
            model: 'amelioration',
            required: false
        },
        units: {
            collection: 'unit',
            via: 'case'
        }
    }
};

