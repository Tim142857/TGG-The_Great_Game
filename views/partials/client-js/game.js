$(document).ready(function () {
    $(".case").each(function () {
        $(this).css('height', $(this).css('width'));
    })
});

$(window).resize(function () {
    $(".case").each(function () {
        $(this).css('height', $(this).css('width'));
    })
});