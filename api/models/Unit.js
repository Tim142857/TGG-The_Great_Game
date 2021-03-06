/**
 * Unit.js
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
        minAtkValue: {
            type: 'integer',
            required: true,
            defaultsTo: 1
        },
        maxAtkValue: {
            type: 'integer',
            required: true,
            defaultsTo: 6
        },
        minDefValue: {
            type: 'integer',
            required: true,
            defaultsTo: 1
        },
        maxDefValue: {
            type: 'integer',
            required: true,
            defaultsTo: 6
        },
        case: {
            model: 'case',
            required: false
        }
    }
};

