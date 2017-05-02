var bcrypt = require('bcrypt');

module.exports = {

    attributes: {
        name: {
            type: 'string',
            required: true,
            unique: true
        },
        email: {
            type: 'string',
            required: true,
            unique: true
        },
        password: {
            type: 'string',
            required: true
        },

        resourceQt: {
            type: 'integer',
            required: false,
            defaulsTo: 0
        },

        elo: {
            type: 'integer',
            required: true,
            defaultsTo: 1000
        },
        wins: {
            type: 'integer',
            required: true,
            defaultsTo: 0
        },
        totalGames: {
            type: 'integer',
            required: true,
            defaultsTo: 0
        },
        state: {
            type: 'string',
            required: true,
            enum: ['connected', 'disconnected', 'in-game', 'pending'],
            defaultsTo: 'disconnected'
        },
        socket: {
            type: 'string'
        },
        socketChat: {
            type: 'string'
        },
        game: {
            model: 'game',
            required: false
        },
        // override default toJSON
        toJSON: function () {
            var obj = this.toObject();
            delete obj.password;
            return obj;
        }
    },

    beforeCreate: function (user, cb) {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) {
                    console.log(err);
                    cb(err);
                } else {
                    user.password = hash;
                    console.log(hash);
                    cb(null, user);
                }
            });
        });
    }

};