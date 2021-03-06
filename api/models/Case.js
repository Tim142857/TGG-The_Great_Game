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
        game: {
            model: 'game',
            required: true
        },
        ownedBy: {
            model: 'user',
            required: false,
            defaultsTo: null
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
            required: false,
            defaultsTo: null
        },
        unitsMax: {
            type: 'integer',
            required: true,
            defaultsTo: 6
        },
        units: {
            collection: 'unit',
            via: 'case'
        }
    },
    afterDestroy: function (destroyedRecords, cb) {
        // Destroy any child whose teacher has an ID of one of the
        // deleted teacher models
        destroyedRecords.forEach(function (elm, index) {
            Unit.destroy({case: elm.id}).exec(function (err) {
                if (err)console.log(err);
            })
        });
    }
};

