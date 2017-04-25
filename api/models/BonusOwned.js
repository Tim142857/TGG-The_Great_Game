/**
 * BonusOwned.js
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
        isActive: {
            type: 'boolean',
            required: true
        },
        startTurn: {
            type: 'integer',
            required: true
        },
        player: {
            model: 'user',
            required: true
        },
        amelioration: {
            model: 'amelioration',
            required: true
        }
    }
};

