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
        map: {
            model: 'map',
            required: true
        },
        ownedBy: {
            model: 'user',
            required: false
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
        }
    },
    units: {
        collection: 'unit',
        via: 'case'
    }
};

