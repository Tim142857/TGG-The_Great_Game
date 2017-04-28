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
});