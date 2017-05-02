/**
 * ChatController
 *
 * @description :: Server-side logic for managing Chats
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    startChat: function (req, res) {

        sails.sockets.blast('new-user', {
            username: req.session.user.name,
            date: new Date()
        });
        var myQuery = ChatMessage.find();
        myQuery.sort('CreatedAt DESC');
        myQuery.limit(4);
        myQuery.populate('user').exec(function callBack(err, results) {
            res.view('chat');
            setTimeout(function () {
                User.findOne({name: req.session.user.name}).exec(function (err, user) {
                    for (var i = 3; i >= 0; i--) {
                        sails.sockets.broadcast(user.socketChat, 'receive-message', {
                            content: results[i].content,
                            type: results[i].type,
                            date: results[i].date,
                            username: results[i].user.name
                        });
                    }
                });
            }, 1500);
        });

    },
    sendMessage: function (req, res) {
        var content = req.param('content');
        var type = req.param('type');
        var user = req.session.user;
        var date = new Date();

        if (type == 'song-request') {
            console.log('song request');
            var link = encodeURI("https://api.deezer.com/search/track/?q=" + content + '&output=xml');
            var request = require('request');
            request(link, function (error, response, body) {
                var parseString = require('xml2js').parseString;
                var xml = body;
                parseString(xml, function (err, result) {
                    content = result.root.data[0].track[0].preview;
                });
            });

        }

        ChatMessage.create({type: type, content: content, user: user.id}).exec(function (err, chatMessage) {
        });
        console.log(content);
        sails.sockets.blast('receive-message', {
            content: content,
            type: type,
            date: date,
            username: req.session.user.name
        });
    },

    authenticate: function (req, res) {

        var newSocket = sails.sockets.getId(req);
        User.update(req.session.user.id, {socketChat: newSocket}).exec(function afterwards(err, updated) {
            if (err) {
                console.log(err);
            }
        });
    },

    sendPoke: function (req, res) {
        var target = req.param('target');
        var sender = req.session.user.name;
        User.findOne({name: target}).exec(function (err, user) {
            sails.sockets.broadcast(user.socketChat, 'receive_poke', {sender: sender});
        });

    }
};

