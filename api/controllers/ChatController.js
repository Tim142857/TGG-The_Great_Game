/**
 * ChatController
 *
 * @description :: Server-side logic for managing Chats
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  startChat: function (req, res) {
    sails.sockets.blast('new-user', {
      username: req.session.user.name
    });
    res.view('chat', {'myJs': '/client-js/client-chat.js'});
  },
  sendMessage: function (req, res) {
    sails.sockets.blast('receive-message', {
      message: req.param('message'),
      img: req.param('img'),
      username: req.session.user.name
    });
  },
  sendImg: function (req, res) {
    sails.sockets.blast('receive-img', {
      img: req.param('img'),
      username: req.session.user.name
    });
  },
  sendVideo: function (req, res) {
    sails.sockets.blast('receive-video', {
      video: req.param('video'),
      username: req.session.user.name
    });
  }
};

