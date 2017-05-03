// ----------------------------------------------     CHAT    -----------------------------------------------------
$(document).ready(function () {
    var nbActions = 1;

    io.socket.get('/chat-authenticate', null, function (users) {
        var html = '';
        users.forEach(function (elm, index) {
            html += "<p>" + elm.name + "</p>";
        });
        $('#list-users').text('');
        $('#list-users').append(html);

    });

    $(function () {
        $(document).tooltip({
            content: function () {
                return $(this).prop('title');
            }
        });
    });

    io.socket.on('receive-message', function (data) {
        // console.log('receive-message');
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
                console.log('song:');
                console.log(data.content);
                $('#chat-content').prepend(createSongRequest(data.content, data.username, data.date, data.chatMessageId));
                break;
        }
    });

    io.socket.on('new-user', function (data) {
        // console.log('new user');
        var html = "<p style='font-weight: bolder'><span style='font-style:italic'>" + data.date.substr(11, 5) + "</span>";
        html += " - <span style='font-weight:bold'>" + data.username + "</span>" + " vient de se connecter";
        $('#chat-content').prepend(html);
    });

    function createMessage(message, username, date) {
        return generateMessage(username, message, date);
    }

    function createImg(img, username, date) {
        return generateMessage(username, "<br/><div style='text-align: center'><img class='img-responsive' style='display:inline-block' src='" + img + "'></img></div>", date);
    }

    function createVideo(video, username, date) {
        return generateMessage(username, parserYoutubeVideo(video), date);
    }

    function createSongRequest(songRequest, username, date, chatMessageId) {
        var html = "<br/><div style='text-align: center'>";
        html += "<br/><audio class='center-block' controls><source src='";
        html += songRequest;
        html += "'></source></audio>";
        html += "<form id='form-song-answer' data-chatMessageId='" + chatMessageId + "' data-type='song-answer' style='margin-top:15px'>";
        html += '<div class="form-group col-xs-offset-4 col-xs-4">';
        html += '<input type="text" class="form-control" id="input-song-answer" placeholder="Votre réponse...">';
        html += '</div>';
        html += "<div class='col-xs-4' style='height:50px'></div>";
        html += "</div>";
        return generateMessage(username, html, date);
    }

    function parserYoutubeVideo(url) {
        var html = "<div style='text-align: center'><iframe width='560' height='200' src='https://www.youtube.com/embed/" + url.split("https://www.youtube.com/watch?v=")[1] + "?autoplay=1' frameborder='0' allowfullscreen autoplay></iframe></div>";
        return html;
    }


    $(document).on('submit', 'form', function (e) {
        e.preventDefault();
        if (nbActions > 5) {
            nbActions += 15;
            alert("Plus vous essayerez, plus vous devrez attendre...");
        } else if (nbActions > 2) {
            nbActions += 3;
            alert("le spam n'est pas autorisé, veuillez patienter quelques secondes");
        }
        else {
            nbActions++;
            var type = $(this).attr('data-type');
            var params = new Array();
            console.log('type:' + type);
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
                    params = {type: 'song-request', content: $('#input-song-request').val()};
                    $('#input-song-request').val('');
                    break;
                case 'song-answer':
                    console.log('ici');
                    var answer = $('input-song-answer').val();
                    var chatMessageId = $(this).attr('data-chatmessageid');
                    io.socket.post('/send-song-answer', {
                        answer: answer,
                        chatMessageId: chatMessageId
                    }, function (resData, jwres) {
                        if (resData.error == true) {
                            if (confirm(resData.message)) document.location = resData.redirect;
                        }
                    });
                    break;
            }
            if (type != 'song-answer') {
                io.socket.post('/send-message', params, function (resData, jwres) {
                    if (resData.error == true) {
                        if (confirm(resData.message)) document.location = resData.redirect;
                    }
                });
                $('#input-message').val('');
                $('#input-img').val('');
                $('#input-video').val('');
            }
        }

    });

    function generateMessage(username, content, date) {
        var html = "<div><span style='font-style:italic'>" + date.substr(11, 5) + "</span>";
        html += " - <span style='font-weight:bold' class='username'>" + username + "</span>" + " : ";
        html += content;
        html += "</div><br/>";
        // console.log(html);
        return html;
    };

    $(document).on("click", ".username", function (e) {
        e.preventDefault();
        var target = $(this).text();
        // console.log('btn clique');
        io.socket.post('/send-poke', {target: target}, function (resData, jwres) {
        });
    });

    io.socket.on('receive_poke', function (data) {
        alert(data.sender + ' vous a envoyé un poke!');
    });

    setInterval(function () {
        nbActions--;
    }, 2000);

    io.socket.on('error-message', function (data) {
        alert(data.message);
    });

    io.socket.on('choose-track', function (data) {
        var select = "<select class='form-control' id='select-choice-track' data-search='" + data.search + "'>";
        data.tracks.forEach(function (elm, index) {
            select += '<option value="' + index + '">' + elm.title + " / " + elm.artist + "</option>";
        });
        select += "</select>";
        $('#choice-tracks').append(select);
        $('#modal-tracks-choice').modal();
    })

    $('#btn-choice-track').on('click', function () {
        var numTrack = $('#select-choice-track').val();
        console.log(numTrack);
        var search = $('#choice-tracks').find("select").attr('data-search');
        console.log('search:' + search);
        io.socket.post('/confirm-track', {numTrack: numTrack, search: search}, function (resData, jwres) {
            if (resData.error == true) {
                if (confirm(resData.message)) document.location = resData.redirect;
            }
        });
        $('#modal-tracks-choice').modal('hide');
        $('#choice-tracks').empty();
    })

});
