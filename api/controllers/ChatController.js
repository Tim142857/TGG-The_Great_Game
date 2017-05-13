/**
 * ChatController
 *
 * @description :: Server-side logic for managing Chats
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var ChatController = {
    startChat: function (req, res) {
        sails.sockets.blast('new-user', {
            user: req.session.user,
            message: req.__('just log in'),
            date: new Date()
        });
        var myQuery = ChatMessage.find();
        myQuery.sort('date DESC');
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
                                if (results[i].type == 'video' && results[i].content.indexOf('youtube') === -1 && results[i].content.indexOf('dailymotion') === -1 && results[i].content.indexOf('vimeo') === -1) {
                                    console.log('ici');
                                    ChatMessage.update({id: results[i].id}, {display: false}).exec(function afterwards(err, updated) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        // console.log(updated);
                                    });
                                } else {
                                    sails.sockets.broadcast(user.socketChat, 'receive-message', {
                                        content: results[i].content,
                                        type: results[i].type,
                                        date: results[i].date,
                                        username: results[i].user.name,
                                        chatMessageId: results[i].id
                                    });
                                }
                            }
                        }
                    });
                }, 1500);
            }
        });
    },

    sendMessage: function (req, res) {
        var content = req.param('content').trim();
        if (content.length > 254) {
            content = content.substr(0, 254);
        }
        console.log(content);
        var type = req.param('type');
        var user = req.session.user;
        var date = new Date();

        content = ChatController.filterInput(content);
        if (content == '' || content === null) {
            sails.sockets.broadcast(req.session.user.socketChat, 'error-message', {
                message: 'Pas bien!'
            });
            return false;
        }

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
                            var title = ChatController.removeBracket(tracks[index].title);
                            resultsToSend.push({title: title, artist: tracks[index].artist[0].name});
                        });
                        var song = result.root.data[0].track[0];
                        sails.sockets.broadcast(req.session.user.socketChat, 'choose-track', {
                            tracks: resultsToSend,
                            search: content
                        });

                        content = song.preview;

                    } else {
                        sails.sockets.broadcast(req.session.user.socketChat, 'error-message', {
                            message: req.__('No results')
                        });
                    }
                });
            });

        } else if (type == 'word-request') {
            var fs = require("fs");
            fs.readFileSync('./lexique.txt').toString().split('\n').forEach(function (line, index) {
                if (line.trim().toUpperCase() == content.trim().toUpperCase()) {
                    throw '';
                }

            });

        } else {
            if (type == 'video') {
                if (content.indexOf('youtube') !== -1 && content.indexOf('dailymotion') !== -1 && content.indexOf('vimeo') !== -1) {
                    sails.sockets.broadcast(req.session.user.socketChat, 'error-message', {
                        message: 'Type de vidéo non pris en charge'
                    });
                }
            }
            ChatMessage.create({type: type, content: content, user: user.id}).exec(function (err, chatMessage) {
                if (err) {
                    console.log(err);
                }
                console.log('----------------------------------');
                console.log(chatMessage.date);
                sails.sockets.blast('receive-message', {
                    content: content,
                    type: type,
                    date: chatMessage.date,
                    username: req.session.user.name
                });
            });

        }

    },

    ChatAuthenticate: function (req, res) {

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

                if (result.root.total != '0') {
                    var title = ChatController.removeBracket(result.root.data[0].track[index].title);
                    var artist = result.root.data[0].track[index].artist[0].name;
                    var content = result.root.data[0].track[index].preview[0];
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
                            res.send({message: req.__("valid proposition, u win 1 point")});
                            User.findOne(req.session.user.id).exec(function (err, user) {
                                if (err)console.log(err);
                                var newScore = user.chatScore + 1;
                                User.update(req.session.user.id, {chatScore: newScore}).exec(function afterwards(err, updated) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    sails.sockets.blast('update-user', {
                                        username: req.session.user.name,
                                        score: updated[0].chatScore
                                    });
                                });
                                sails.sockets.blast('receive-message', {
                                    content: content,
                                    type: type,
                                    date: date,
                                    username: req.session.user.name,
                                    chatMessageId: chatMessage.id
                                });
                            });
                        });
                    });
                } else {
                    sails.sockets.broadcast(req.session.user.socketChat, 'error-message', {
                        message: req.__('no results')
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
        var chatMessageId = req.param('chatMessageId');
        Song.findOne({chatMessage: chatMessageId}).exec(function (err, song) {
            ChatMessage.findOne(chatMessageId).exec(function (err, chatMessage) {
                    if (chatMessage.user == req.session.user.id) {
                        res.send({message: req.__("you can't answer on your own proposition")});
                    } else {
                        if (song.titleFound && song.artistFound) {
                            res.send({message: req.__('answers are already given')});

                            ChatMessage.update(song.chatMessage, {display: false}).exec(function (err, chatMessage) {
                                if (err)console.log(err);
                            });
                        } else {
                            var scoreTitle = ChatController.levenshtein(answer.toUpperCase(), song.title.toUpperCase());
                            var scoreArtist = ChatController.levenshtein(answer.toUpperCase(), song.artist.toUpperCase());
                            var titleStillNotFound = true;
                            var artistStillNotFound = true;
                            if (!song.titleFound) {
                                if (scoreTitle <= 2) {
                                    res.send({message: req.__('congratulations, you found the title'), response: 'title'});
                                    //----------------------------------------------------------
                                    User.findOne(req.session.user.id).exec(function (err, user) {
                                        if (err)console.log(err);
                                        var newScore = user.chatScore + 2;
                                        User.update(req.session.user.id, {chatScore: newScore}).exec(function afterwards(err, updated) {
                                            if (err) {
                                                console.log(err);
                                            }
                                            sails.sockets.blast('update-user', {
                                                username: req.session.user.name,
                                                score: updated[0].chatScore
                                            });
                                        });
                                    });
                                    //-------------------------------------------------------------
                                    sails.sockets.blast('answer-found', {
                                        chatMessageId: song.chatMessage,
                                        response: 'title',
                                        user: req.session.user.name,
                                        responseContent: song.title
                                    });
                                    titleStillNotFound = false;
                                    Song.update(song.id, {titleFound: true}).exec(function afterwards(err, updated) {
                                        if (err)console.log(err);
                                        Song.findOne(song.id).exec(function (err, song) {
                                            if (song.titleFound && song.artistFound) {
                                                console.log('ici');
                                                sails.sockets.blast('answers-found', {
                                                    chatMessageId: song.chatMessage
                                                });
                                                ChatMessage.update(song.chatMessage, {display: false}).exec(function (err, chatMessage) {
                                                    if (err)console.log(err);
                                                });
                                            }
                                        });
                                    });
                                }
                            }
                            if (!song.artistFound && titleStillNotFound) {
                                if (scoreArtist <= 2) {
                                    artistStillNotFound = false;
                                    res.send({
                                        message: req.__('congratulations, you found the artist'),
                                        response: 'artist'
                                    });
                                    //----------------------------------------------------------
                                    User.findOne(req.session.user.id).exec(function (err, user) {
                                        if (err)console.log(err);
                                        var newScore = user.chatScore + 2;
                                        User.update(req.session.user.id, {chatScore: newScore}).exec(function afterwards(err, updated) {
                                            if (err) {
                                                console.log(err);
                                            }
                                            sails.sockets.blast('update-user', {
                                                username: req.session.user.name,
                                                score: updated[0].chatScore
                                            });
                                        });
                                    });
                                    //-------------------------------------------------------------
                                    sails.sockets.blast('answer-found', {
                                        chatMessageId: song.chatMessage,
                                        response: 'artist',
                                        user: req.session.user.name,
                                        responseContent: song.artist
                                    });
                                    Song.update(song.id, {artistFound: true}).exec(function afterwards(err, updated) {
                                        if (err)console.log(err);
                                        Song.findOne(song.id).exec(function (err, song) {
                                            if (song.titleFound && song.artistFound) {
                                                sails.sockets.blast('answers-found', {
                                                    chatMessageId: song.chatMessage
                                                });

                                                ChatMessage.update(song.chatMessage, {display: false}).exec(function (err, chatMessage) {
                                                    if (err)console.log(err);
                                                });
                                            }
                                        });
                                    });
                                }
                            }
                            if (artistStillNotFound && titleStillNotFound) {
                                res.send({message: req.__('wrong answer')});
                            }

                        }
                    }
                }
            );

        });
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

        var length = (b.length + a.length) / 2;
        var result = matrix[b.length][a.length] / length * 10;
        console.log(a);
        console.log(b);
        console.log(result);
        console.log('----------------------');
        return result;
    },

    removeBracket: function removeBracket(string) {
        return string[0].split("(")[0].split(',')[0];
    },

    filterInput: function filterInput(str) {
        var regex = /[^a-z 0-9?!.,()%^&*_+-:;=/]/gi;
        if (str.search(regex) > -1) {
            str = str.replace(regex, "");
        }
        return str;
    }

};

module.exports = ChatController;

