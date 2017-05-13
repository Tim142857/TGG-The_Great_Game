$(document).ready(function () {

    //Variables
    var myId = $('#myId').text();
    var startCase = null;
    var endCase = null;

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
        if (res.success == false) {
            alert(res.message + "<br/><br/>" + res.error);
        }
    });


    $(document).on('click', '.case', function () {
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
                            } else {
                                alert(res.idEndCase);
                                alert(res.survivor);
                            }
                        });
                    }
                }
            }
        }
    });


    function displayFlashMessage(message) {
        alert(message);
    }

});

$(window).resize(function () {
    $(".case").each(function () {
        $(this).css('height', $(this).css('width'));
    })
});