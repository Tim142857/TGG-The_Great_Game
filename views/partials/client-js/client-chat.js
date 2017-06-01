// ----------------------------------------------     CHAT    -----------------------------------------------------
$(document).ready(function () {
    var nbActions = 1;

    io.socket.get('/chat-authenticate', null, function (users) {
        var html = '';
        users.forEach(function (elm, index) {
            html += "<p><span  class='username-list'>" + elm.name + "</span> (<span class='score'>" + elm.chatScore + "</span> pts)</p>";
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
        switch (data.type) {
            case 'text':
                $('#chat-content').prepend(createMessage(data.content, data.username, data.date));
                break;
            case 'img':
                $('#chat-content').prepend(createImg(data.content, data.username, data.date));
                break;
            case 'video':
                $('#chat-content').prepend(createVideo(data.content, data.username, data.date));
                break;
            case 'song-request':
                $('#chat-content').prepend(createSongRequest(data.content, data.username, data.date, data.chatMessageId));
                break;
        }
    });

    io.socket.on('new-user', function (data) {
        var html = "<p style='font-weight: bolder'><span style='font-style:italic'>" + data.date.substr(11, 5) + "</span>";
        html += " - <span style='font-weight:bold'>" + data.user.name + "</span> " + data.message;
        $('#chat-content').prepend(html);

        var alrdyThere = false;
        $(".username-list").each(function (index, elm) {
            if ($(elm).text() == data.user.name) {
                $(elm).next('span').text(data.user.chatScore);
                alrdyThere = true;
                return false;
            }
        });
        if (!alrdyThere) {
            var html2 = "<p><span class='username-list'>" + data.user.name + "</span> (<span class='score'>" + data.user.chatScore + "</span> pts)</p>";
            $('#list-users').append(html2);
        }
    });

    function createMessage(message, username, date) {
        return generateMessage(username, message, date);
    }

    function createImg(img, username, date) {
        return generateMessage(username, "<br/><div style='text-align: center'><img class='img-responsive' style='display:inline-block' src='" + img + "'></img></div>", date);
    }

    function createVideo(video, username, date) {
        return generateMessage(username, parservideo(video), date);
    }

    function createSongRequest(songRequest, username, date, chatMessageId) {
        var html = "<br/><div style='text-align: center'>";
        html += "<br/><audio class='center-block' controls><source src='";
        html += songRequest;
        html += "'></source></audio>";
        html += "<form class='form-song-answer' data-chatMessageId='" + chatMessageId + "' data-type='song-answer' style='margin-top:15px'>";
        html += '<div class="form-group col-xs-offset-4 col-xs-4">';
        html += '<input type="text" class="form-control" id="input-song-answer" placeholder="Votre réponse...">';
        html += '</div>';
        html += "<div class='col-xs-1' style='padding:0;'><div class='icon-blind-test icon-artist'><img class='img-responsive' src='/images/icone-micro.png'></div>";
        html += "<div class='icon-blind-test icon-title'><img class='img-responsive' src='/images/icone-musique.png'></img></div></div>";
        html += "<div class='col-xs-3' style='height:50px'></div>";
        html += "</div><br/>";
        return generateMessage(username, html, date);
    }

    function parservideo(url) {

        //-------------------
        var type = '';
        if (url.indexOf('youtube') !== -1) {
            type = 'youtube';
        }
        if (url.indexOf('dailymotion') !== -1) {
            type = 'dailymotion';
        }
        if (url.indexOf('vimeo') !== -1) {
            type = 'vimeo';
        }
        switch (type) {
            case 'youtube':
                var html = "<div style='text-align: center'><iframe width='660' height='340' src='https://www.youtube.com/embed/" + url.split("https://www.youtube.com/watch?v=")[1].split("&")[0] + "' frameborder='0' allowfullscreen autoplay></iframe></div>";
                break;
            case 'dailymotion':
                var html = "<div style='text-align: center'><iframe frameborder='0' width='660' height='340' src='http://www.dailymotion.com/embed/video/" + url.split("http://www.dailymotion.com/video/")[1] + "' allowfullscreen></iframe><br /></div>";
                break;
            case 'vimeo':
                var html = "<div style='text-align: center'><iframe src='https://player.vimeo.com/video/" + url.split("https://vimeo.com/")[1] + "' width='660' height='340' frameborder='0' webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>";
                break;
            default:
                // var url = "https://fr.pornhub.com/view_video.php?viewkey=1448723509";
                var regexBase = /(\w*:\/\/\w*.\w*.\w{2,3})\//gi;
                //get base url
                var base = regexBase.exec(url)[0];

                //get video id
                var regex = /\w*:\/\/\w*.\w*.\w{2,3}(?:\/\w*)?[\/]([0-9]*)(?:[(\/)(&)]\w*)?|[?]\w*=([0-9]*)/gi;

                /*
                 ca ne marche pas si ?param= apres un / du genre http://ww.def.com/ed?param1=value1
                 */
                var match = regex.exec(url);
                console.log(match);
                for (var i = 0; i < match.length; i++) {
                    console.log(match[i]);
                }
                var idVideo = 0;
                if (!isNaN(parseInt(match[0]))) {
                    console.log('0');
                    idVideo = match[0];
                    console.log(idVideo);
                }
                if (!isNaN(parseInt(match[1]))) {
                    console.log('1');
                    idVideo = match[1];
                    console.log(idVideo);
                }
                if (!isNaN(parseInt(match[2]))) {
                    console.log('2');
                    idVideo = match[2];
                    console.log(idVideo);
                }
                html = "<iframe frameborder='0' width='660' height='340' src='" + base + "embed/" + idVideo + "'></iframe>";
                console.log(html);
            // html = "<iframe frameborder='0' width='660' height='340' src='https://fr.pornhub.com/embed/1448723509'></iframe>";
            // html = "<iframe frameborder='0' width='660' height='340' src='https://fr.youporn.com/embed/10398671'></iframe>";

        }
        console.log(html);
        return html;
    }

    $(document).on('submit', 'form', function (e) {
        // console.log('form soumis');
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
            switch (type) {
                case 'message':
                    params = {type: 'text', content: $('#input-message').val()};
                    break;
                case 'img':
                    params = {type: 'img', content: $('#input-img').val()};
                    break;
                case 'video':
                    params = {type: 'video', content: $('#input-video').val()};
                    break;
                case 'song-request':
                    params = {type: 'song-request', content: $('#input-song-request').val()};
                    $('#input-song-request').val('');
                    break;
                case 'song-answer':
                    var answer = $('#input-song-answer').val();
                    var chatMessageId = $(this).attr('data-chatmessageid');
                    io.socket.post('/send-song-answer', {
                        answer: answer,
                        chatMessageId: chatMessageId
                    }, function (resData, jwres) {
                        if (resData.error == true) {
                            if (confirm(resData.message)) document.location = resData.redirect;
                        } else {
                            alert(resData.message);
                            if (resData.response == 'title') {
                                $('[data-chatmessageid="' + chatMessageId + '"]').find('.icon-' + data.response).css('background-color', '#2DF037');
                            }
                            if (resData.response == 'artist') {
                                $('[data-chatmessageid="' + chatMessageId + '"]').find('.icon-artist').css('background-color', '#2DF037');
                            }
                        }
                        $('#input-song-answer').val('');
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
        // console.log(date);
        var html = "<div><span style='font-style:italic'>" + date.substr(11, 5) + "</span>";
        html += " - <span style='font-weight:bold' class='username'>" + username + "</span>" + " : ";
        html += content;
        html += "</div><br/>";
        return html;
    };

    $(document).on("click", ".username", function (e) {
        e.preventDefault();
        var target = $(this).text();
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
        $('#choice-tracks').empty();
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
        var search = $('#choice-tracks').find("select").attr('data-search');
        io.socket.post('/confirm-track', {numTrack: numTrack, search: search}, function (resData, jwres) {
            if (resData.error == true) {
                if (confirm(resData.message)) document.location = resData.redirect;
            }
            alert(resData.message);
        });
        $('#modal-tracks-choice').modal('hide');
        $('#choice-tracks').empty();
    });

    io.socket.on('answers-found', function (data) {
        $('[data-chatmessageid="' + data.chatMessageId + '"]').hide();
    })

    io.socket.on('answer-found', function (data) {
        if (data.response == 'title') {
            $('[data-chatmessageid="' + data.chatMessageId + '"]').find('.icon-' + data.response).css('background-color', '#2DF037');
            var html = "<p>" + data.user + " a trouvé le titre: \"" + data.responseContent + "\" (\+ 2 points)";
            $('[data-chatmessageid="' + data.chatMessageId + '"]').after(html);
        }
        if (data.response == 'artist') {
            $('[data-chatmessageid="' + data.chatMessageId + '"]').find('.icon-artist').css('background-color', '#2DF037');
            var html = "<p>" + data.user + " a trouvé l'artiste: \"" + data.responseContent + "\" (\+ 2 points)";
            $('[data-chatmessageid="' + data.chatMessageId + '"]').after(html);
        }
        $('#input-song-answer').val('');
    });

    io.socket.on('update-user', function (data) {
        $(".username-list").each(function (index, elm) {
            if ($(elm).text() == data.username) {
                $(elm).next('span').text(data.score);
                return false;
            }
        });
    });

    $('#input-message').Emoji({
        path: 'img/emojione/',
        class: 'emoji',
        ext: 'png'
    });
    $('#chat-content').Emoji({
        path: 'img/emojione/',
        class: 'emoji',
        ext: 'png'
    });

    $('#btn-test').on('click', function () {
        window.open("", "", "width=200,height=100");
    })
});
