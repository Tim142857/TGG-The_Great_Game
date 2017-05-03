/**
 * ChatController
 *
 * @description :: Server-side logic for managing Chats
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var ChatController = {
    startChat: function (req, res) {
        sails.sockets.blast('new-user', {
            username: req.session.user.name,
            date: new Date()
        });
        var myQuery = ChatMessage.find();
        myQuery.sort('CreatedAt DESC');
        myQuery.limit(4);
        myQuery.where({display: true});
        myQuery.populate('user').exec(function callBack(err, results) {
            results.reverse();
            res.view('chat');
            if (results.length > 0) {
                setTimeout(function () {
                    User.findOne({name: req.session.user.name}).exec(function (err, user) {
                        for (var i = 0; i < results.length; i++) {
                            if (i <= results.length) {
                                sails.sockets.broadcast(user.socketChat, 'receive-message', {
                                    content: results[i].content,
                                    type: results[i].type,
                                    date: results[i].date,
                                    username: results[i].user.name,
                                    chatMessageId: results[i].id
                                });
                            }
                        }
                    });
                }, 1500);
            }
        });
    },
    sendMessage: function (req, res) {
        var content = req.param('content');
        var type = req.param('type');
        var user = req.session.user;
        var date = new Date();
        // console.log('user actuel:' + req.session.user.name);

        if (type == 'song-request') {
            var link = encodeURI("https://api.deezer.com/search/track/?q=" + content + '&output=xml');
            var request = require('request');
            request(link, function (error, response, body) {
                var parseString = require('xml2js').parseString;
                var xml = body;
                parseString(xml, function (err, result) {

                    if (result.root.total != '0') {
                        var tracks = result.root.data[0].track;
                        var resultsToSend = [];
                        Object.keys(tracks).forEach(function (elm, index) {
                            // console.log(tracks[index]);
                            resultsToSend.push({title: tracks[index].title, artist: tracks[index].artist[0].name});
                        });
                        // console.log(resultsToSend);
                        var song = result.root.data[0].track[0];
                        sails.sockets.broadcast(req.session.user.socketChat, 'choose-track', {
                            tracks: resultsToSend,
                            search: content
                        });

                        content = song.preview;

                        // ChatMessage.create({
                        //     type: type,
                        //     content: content,
                        //     user: user.id
                        // }).exec(function (err, chatMessage) {
                        //     if (err) {
                        //         console.log(err);
                        //     }
                        //     Song.create({
                        //         title: song.title,
                        //         artist: song.artist[0].name,
                        //         chatMessage: chatMessage
                        //     }).exec(function (err, song) {
                        //         if (err) {
                        //             console.log(err);
                        //         }
                        //         sails.sockets.blast('receive-message', {
                        //             content: content,
                        //             type: type,
                        //             date: date,
                        //             username: req.session.user.name,
                        //             chatMessageId: chatMessage.id
                        //         });
                        //     });
                        // });
                    } else {
                        console.log('pas de resultats');
                        console.log(req.session.user.socketChat);
                        sails.sockets.broadcast(req.session.user.socketChat, 'error-message', {
                            message: 'Pas de résultats :/'
                        });
                    }
                });
            });

        } else {
            // console.log('not song request');
            ChatMessage.create({type: type, content: content, user: user.id}).exec(function (err, chatMessage) {
                if (err) {
                    console.log(err);
                }
            });
            sails.sockets.blast('receive-message', {
                content: content,
                type: type,
                date: date,
                username: req.session.user.name
            });
        }
    },

    authenticate: function (req, res) {

        var newSocket = sails.sockets.getId(req);
        req.session.user.socketChat = newSocket;
        User.update(req.session.user.id, {socketChat: newSocket}).exec(function afterwards(err, updated) {
            if (err) {
                console.log(err);
            }
            sails.sockets.join(newSocket, 'general-chat');
            sails.io.sockets.in('general-chat').clients(function (index, clients) {
                User.find({socketChat: clients}).exec(function (err, users) {
                    res.send(users);
                });
            });
        });

    },
    confirmTrack: function (req, res) {
        var search = req.param('search');
        var index = req.param('numTrack');
        var date = new Date();

        var link = encodeURI("https://api.deezer.com/search/track/?q=" + search + '&output=xml');
        var request = require('request');
        request(link, function (error, response, body) {
            var parseString = require('xml2js').parseString;
            var xml = body;
            parseString(xml, function (err, result) {
                // console.log('index:' + index);

                if (result.root.total != '0') {
                    var title = result.root.data[0].track[index].title;
                    var artist = result.root.data[0].track[index].artist[0].name;
                    var content = result.root.data[0].track[index].preview[0];
                    // console.log(song);
                    var type = 'song-request';


                    ChatMessage.create({
                        type: type,
                        content: content,
                        user: req.session.user.id
                    }).exec(function (err, chatMessage) {
                        if (err) {
                            console.log(err);
                        }
                        Song.create({
                            title: title,
                            artist: artist,
                            chatMessage: chatMessage
                        }).exec(function (err, song) {
                            if (err) {
                                console.log(err);
                            }
                            sails.sockets.blast('receive-message', {
                                content: content,
                                type: type,
                                date: date,
                                username: req.session.user.name,
                                chatMessageId: chatMessage.id
                            });
                        });
                    });
                } else {
                    console.log('pas de resultats');
                    console.log(req.session.user.socketChat);
                    sails.sockets.broadcast(req.session.user.socketChat, 'error-message', {
                        message: 'Pas de résultats :/'
                    });
                }
            });
        });
    },

    sendPoke: function (req, res) {
        var target = req.param('target');
        var sender = req.session.user.name;
        User.findOne({name: target}).exec(function (err, user) {
            sails.sockets.broadcast(user.socketChat, 'receive_poke', {sender: sender});
        });

    },
    sendSongAnswer: function sendSongAnswer(req, res) {

        var answer = req.param('answer');
        var chatMassageId = req.param('chatMessageId');
    },
    levenshtein: function levenshtein(a, b) {
        if (a.length == 0) return b.length;
        if (b.length == 0) return a.length;

        var matrix = [];

        // increment along the first column of each row
        var i;
        for (i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // increment each column in the first row
        var j;
        for (j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (i = 1; i <= b.length; i++) {
            for (j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1)); // deletion
                }
            }
        }

        return matrix[b.length][a.length];
    }
};

module.exports = ChatController;

