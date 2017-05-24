/**
 * ModelBaseCase.js
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
        type: {
            type: 'string',
            required: true,
            enum: ['takable', 'water', 'rock', 'bridge']
        },
        horizontalBridge: {
            type: 'boolean'
        },
        amelioration: {
            model: 'amelioration',
            required: false
        },
        unitsMax: {
            type: 'integer',
            required: true,
            defaultsTo: 6
        }
    }
};


