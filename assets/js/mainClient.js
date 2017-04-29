$(document).ready(function () {

    $('#btn-play').on('click', function (e) {
        e.preventDefault();
        io.socket.get('/play');
    });

    io.socket.on('redirect', function (destination) {
        console.log('redirect');
        window.location.href = destination;
    });

    io.socket.on('pending', function (destination) {
        $("h1").append("<p>En attente d'un adversaire</p>");
    });


    // ----------------------------------------------     CHAT    -----------------------------------------------------
    $('#form-message').on('submit', function (e) {
        e.preventDefault();
        console.log('form submit');
        sendMessage();
    });

    $('#form-img').on('submit', function (e) {
        e.preventDefault();
        sendImg();
    });

    $('#form-video').on('submit', function (e) {
        e.preventDefault();
        sendVideo();
    });

    io.socket.on('receive-message', function (data) {
        console.log('receive');
        $('#chat-content').prepend(createMessage(data.message, data.username));
        console.log($('#chat-content').height());
    });

    io.socket.on('receive-img', function (data) {
        console.log('receive img');
        console.log(createImg(data.img, data.username));
        $('#chat-content').prepend(createImg(data.img, data.username));
    });

    io.socket.on('receive-video', function (data) {
        console.log('receive video');
        // console.log(createVideo(data.video, data.username));
        console.log('1:' + data.video);
        $('#chat-content').prepend(createVideo(data.video, data.username));
    });

    io.socket.on('new-user', function (data) {
        var messageNewUser = "<p style='font-weight: bolder'><span style='font-style:italic'>" + getTime() + "</span>" + " - <span style='font-weight:bold'>" + data.username + "</span>" + " vient de se connecter";
        $('#chat-content').prepend(messageNewUser);
    });

    function createMessage(message, username) {
        return "<p><span style='font-style:italic'>" + getTime() + "</span>" + " - <span style='font-weight:bold'>" + username + "</span>" + " : " + message + "</p>";
    }

    function createImg(img, username) {
        console.log(img);
        return "<p><span style='font-style:italic'>" + getTime() + "</span>" + " - <span style='font-weight:bold'>" + username + "</span>" + " : <br/>" + "<img class='col-xs-12 img-responsive center-block' src='" + img + "'/>" + "</p>";
    }

    function createVideo(video, username) {
        return parserYoutubeVideo(video);
    }


    function addZero(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }

    function getTime() {
        var d = new Date();
        var x = document.getElementById("demo");
        var h = addZero(d.getHours());
        var m = addZero(d.getMinutes());
        var s = addZero(d.getSeconds());
        return h + ":" + m + ":" + s;
    }

    function sendMessage() {
        var message = $('#input-message').val();
        var img = $('#input-img').val();
        io.socket.post('/send-message', {message: message}, function (resData, jwres) {
        });
        $('#input-message').val('');
    }

    function sendImg() {
        var img = $('#input-img').val();
        console.log('send img');
        console.log(img);
        io.socket.post('/send-img', {img: img}, function (resData, jwres) {
        });
        $('#input-img').val('');
    }

    function sendVideo() {
        var video = $('#input-video').val();
        console.log('send video');
        console.log(video);
        io.socket.post('/send-video', {video: video}, function (resData, jwres) {
        });
        $('#input-video').val('');
    }

    function parserYoutubeVideo(url) {
        // console.log(url);
        // console.log(url.split("https://www.youtube.com/watch?v=")[1]);
        var html = "<iframe width='560' height='315' src='https://www.youtube.com/embed/" + url.split("https://www.youtube.com/watch?v=")[1] + "' frameborder='0' allowfullscreen></iframe>";
        return html;
    }

});