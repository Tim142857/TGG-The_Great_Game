$(document).ready(function () {

    $('#btn-play').on('click', function (e) {
        e.preventDefault();
        $('#myModal').modal();
    });

    $('#btn-play-game').on('click', function () {
        var colorChoosen = $('#select-color').val();
        io.socket.get('/play/' + colorChoosen);
    });

    $('#cancel-play').on('click', function () {
        $('#myModal').modal('toggle');
    });

    io.socket.on('redirect', function (destination) {
        console.log('redirect');
        window.location.href = destination;
    });

    io.socket.on('pending', function (destination) {
        $("h1").append("<p>En attente d'un adversaire</p>");
    });

    // $('#btn-play').on('click', function () {
    //     if (window.location.pathname != 'homepagePlayer') {
    //         window.location.href = '/homepagePlayer';
    //     }
    // });


});
