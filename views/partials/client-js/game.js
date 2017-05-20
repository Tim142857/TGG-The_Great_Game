$(document).ready(function () {

    //Variables
    var myId = $('#myId').text();
    var startCase = null;
    var endCase = null;
    var reinforcementsTime = $('#reinforcements-time').text() === 'true';

    $(".case").each(function () {
        $(this).css('height', $(this).css('width'));
    });

    $(document).on('click', '.table-research-title', function () {
        if ($(this).next('.table-research').hasClass('hidden')) {
            $('.table-research').addClass('hidden');
            $(this).next('.table-research').removeClass('hidden');
        } else {
            $(this).next('.table-research').addClass('hidden');
        }
    });

    $(".progressBar").each(function (index, elm) {
        var pourcentage = $(this).closest('tr').attr('data-pourcentage');
        progress(pourcentage, $(this));
    });


    function progress(percent, $element) {
        var progressBarWidth = percent * $element.width() / 100;
        $element.find('div').animate({width: progressBarWidth}, 500).html(percent + "% ");
    }


    io.socket.get('/game-authenticate', null, function (res) {
        console.log('authenticate');
        if (res.success == false) {
            alert(res.message + "<br/><br/>" + res.error);
        }
    });


    $(document).on('click', '.case', function () {
        if (reinforcementsTime) {
            var idCase = $(this).attr('data-idcase');
            io.socket.get('/add-unit/' + idCase, null, function (res) {
                if (!res.success) {
                    alert(res.message);
                } else {
                    var left = parseInt($('#reinforcements-left').text()) - 1;
                    $('#reinforcements-left').text(left);
                }
            });

        } else {

            var idTurnPlayer = $('#turn-player').attr("data-turnPlayer-id");

            //Ce n'est pas le tour du joueur
            if (myId != idTurnPlayer) {
                displayFlashMessage("Ce n'est pas à votre tour de jouer");
            }
            else {
                if (startCase == null && $(this).attr('data-ownedby') != myId) {
                    displayFlashMessage('Veuillez sélectionner une case vous appartenant');
                } else {

                    //le joueur choisit sa case de depart
                    if ($(this).attr('data-ownedby') == myId) {
                        $('.case-selected').removeClass('case-selected');
                        $(this).addClass('case-selected');
                        startCase = $(this).attr('data-idcase');
                        console.log('startCase:' + startCase);
                    } else {
                        if (startCase == null) {
                            displayFlashMessage('Commencez par sélectionner une de vos cases');
                        } else {
                            $(this).addClass('case-selected');
                            endCase = $(this).attr('data-idcase');

                            //lancement de l'attaque
                            io.socket.get('/move-units', {startCase: startCase, endCase: endCase}, function (res) {
                                if (!res.success) {
                                    alert(res.message);
                                    removeSelection();
                                }
                            });
                        }
                    }
                }
            }
        }
    });

    io.socket.on('leave-case', function (data) {
        leaveCase(data.idCase);
    });

    io.socket.on('update-case', function (data) {
        updateCase(data.idCase, data.idPlayer, data.units);
    });

    io.socket.on('turn-player-change', function (data) {
        console.log('turn-player-change');
        $('#turn-player').text("C'est au tour de " + data.namePlayer);
        $('#turn-player').attr('data-turnplayer-id', data.idPlayer);
        $('#turn-player').attr('data-turnplayer-name', data.namePlayer);
        if (data.idPlayer == myId) {
            $('#btn-end-turn').text('Fin de tour');
            displayFlashMessage('A votre tour de jouer!');
        } else {
            $('#btn-end-turn').text("Tour de l'adversaire");
        }
    });

    io.socket.on('end-turn', function (data) {
        $('#btn-end-turn').text("Reinforcements time");
        alert('Reinforcements time');
        $('#reinforcements-infos').removeClass('hidden');
        $('#reinforcements-left').text(data.nbReinforcements);

        reinforcementsTime = true;
    });

    io.socket.on('reinforcementsTime-ended', function (data) {
        io.socket.get('/update-after-reinforcements', null, function (res) {

        });
        $('#reinforcements-infos').addClass('hidden');
        reinforcementsTime = false;
    });

    io.socket.on('win', function (data) {
        alert(data.winner + ' a gagné la partie!');
        window.location.replace('/homepagePlayer');
    });

    $('#btn-end-turn').on('click', function (e) {
        e.preventDefault();
        io.socket.get('/end-turn/' + myId, null, function () {
        });
    });

    function updateCase(idCase, idPlayer, unitsLength) {
        var endTD = $(".case[data-idcase='" + idCase + "']");

        //Maj units
        endTD.find('.unitsActual').text(unitsLength);

        //Maj players
        if (idPlayer != null) {
            endTD.attr('data-ownedby', idPlayer);
            var color = $("li[data-infos-player='" + idPlayer + "']").attr('data-color');
            endTD.css('background-color', color);
        }

        removeSelection();

    }

    function leaveCase(idCase) {
        var startTD = $(".case[data-idcase='" + idCase + "']");
        startTD.find('.unitsActual').text('1');
        startTD.removeClass('case-selected');

    }

    function removeSelection() {
        // alert('remove selection');
        $('.case-selected').each(function (elm, index) {
            $(this).removeClass('case-selected');
        });
        startCase = null;
        endCase = null;
    }


    function displayFlashMessage(message) {
        alert(message);
    }

});

$(window).resize(function () {
    $(".case").each(function () {
        $(this).css('height', $(this).css('width'));
    })
});