/**
 * Song.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {

        title: {
            type: 'string',
            required: true
        },
        artist: {
            type: 'string',
            required: true
        },
        chatMessage: {
            model: 'ChatMessage',
            required: true
        },
        titleFound: {
            type: 'boolean',
            required: true,
            defaultsTo: false
        },
        artistFound: {
            type: 'boolean',
            required: true,
            defaultsTo: false
        }
    }
};

