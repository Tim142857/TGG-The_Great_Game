// ----------------------------------------------     CHAT    -----------------------------------------------------
$(document).ready(function () {
    io.socket.get('/chat-authenticate');

    $(function () {
        $(document).tooltip({
            content: function () {
                return $(this).prop('title');
            }
        });
    });

    io.socket.on('receive-message', function (data) {
        console.log('receive-message');
        switch (data.type) {
            case 'text':
                $('#chat-content').prepend(createMessage(data.content, data.username, data.date));
                break;
            case 'img':
                $('#chat-content').prepend(createImg(data.content, data.username, data.date));
                break;
            case 'youtubeVideo':
                $('#chat-content').prepend(createVideo(data.content, data.username, data.date));
                break;
            case 'song-request':
                $('#chat-content').prepend(createSongRequest(data.content, data.username, data.date));
                break;
        }
    });

    io.socket.on('new-user', function (data) {
        console.log('new user');
        var html = "<p style='font-weight: bolder'><span style='font-style:italic'>" + data.date.substr(11, 5) + "</span>";
        html += " - <span style='font-weight:bold'>" + data.username + "</span>" + " vient de se connecter";
        $('#chat-content').prepend(html);
    });

    function createMessage(message, username, date) {
        return generateMessage(username, message, date);
    }

    function createImg(img, username, date) {
        return generateMessage(username, "<br/><img class='col-xs-6 col-xs-offset-3 img-responsive' src='" + img + "'/>", date);
    }

    function createVideo(video, username, date) {
        return generateMessage(username, parserYoutubeVideo(video), date);
    }

    function createSongRequest(songRequest, username, date) {
        return generateMessage(username, "<br/><audio controls><source src=''" + songRequest + "'></source></audio>", date);
    }

    function parserYoutubeVideo(url) {
        var html = "<div style='text-align: center'><iframe width='560' height='200' src='https://www.youtube.com/embed/" + url.split("https://www.youtube.com/watch?v=")[1] + "?autoplay=1' frameborder='0' allowfullscreen autoplay></iframe></div>";
        return html;
    }


    $("form").on('submit', function (e) {
        e.preventDefault();
        var type = $(this).attr('data-type');
        var params = new Array();
        switch (type) {
            case 'message':
                params = {type: 'text', content: $('#input-message').val()};
                break;
            case 'img':
                params = {type: 'img', content: $('#input-img').val()};
                break;
            case 'video':
                params = {type: 'youtubeVideo', content: $('#input-video').val()};
                break;
            case 'song-request':
                params = {type: 'song-request', content: $('#input-request-song').val()};
                break;
        }
        io.socket.post('/send-message', params, function (resData, jwres) {
        });
        $('#input-message').val('');
        $('#input-img').val('');
        $('#input-video').val('');
    });

    function generateMessage(username, content, date) {
        var html = "<p><span style='font-style:italic'>" + date.substr(11, 5) + "</span>";
        html += " - <span style='font-weight:bold' class='username'>" + username + "</span>" + " : ";
        html += content;
        html += "</p>";
        return html;
    };

    $(document).on("click", ".username", function (e) {
        e.preventDefault();
        var target = $(this).text();
        console.log('btn clique');
        io.socket.post('/send-poke', {target: target}, function (resData, jwres) {
        });
    });

    io.socket.on('receive_poke', function (data) {
        alert(data.sender + ' vous a envoyé un poke!');
    });

});
