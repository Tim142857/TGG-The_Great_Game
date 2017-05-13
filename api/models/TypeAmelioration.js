/**
 * TypeAmelioration.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {

        name: {
            type: 'string',
            enum: ['bonusOff', 'bonusDef', 'bonus', 'bonusReinforcements', 'bonusProd', 'bonusRessource'],
            required: true
        },
        description: {
            type: 'string',
            required: true
        },
        ameliorations: {
            collection: 'amelioration',
            via: 'type'
        }
    }
};

