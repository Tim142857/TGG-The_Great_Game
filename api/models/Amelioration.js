/**
 * Amelioration.js
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
        delayToUse: {
            type: 'integer',
            required: true
        },
        manaCost: {
            type: 'integer',
            required: true
        },
        type: {
            type: 'string',
            enum: ['bonusOff', 'bonusDef', 'bonus', 'bonusMana', 'bonusReinforcements'],
            required: true
        },
        value: {
            type: 'integer',
            required: true
        }
    }
};

