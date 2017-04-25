var bcrypt = require('bcrypt');

module.exports = {

    attributes: {
        name: {
            type: 'string',
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
            required: false
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