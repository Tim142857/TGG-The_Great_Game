/**
 * ChatMessage.js
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
        user: {
            model: 'user',
            required: true
        },
        content: {
            type: 'string',
            required: true,
            maxLength: 500
        },
        date: {
            type: 'datetime',
            defaultsTo: function () {
                return new Date();
            }
        },
        type: {
            type: 'string',
            enum: ['text', 'video', 'img', 'song-request']
        },
        display: {
            type: 'boolean',
            required: true,
            defaultsTo: true
        }

    }
};

