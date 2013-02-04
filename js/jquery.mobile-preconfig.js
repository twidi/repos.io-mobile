$(document).bind("mobileinit", function(){
    $.mobile.page.prototype.options.addBackBtn = true;
    $.mobile.defaultPageTransition = 'slide';
    $.mobile.autoInitializePage = false;
});

function querystringize(hash) {
    if (hash.indexOf('!') != -1) {
        return hash.replace('!', '?');
    }
    return hash;
}
location.hash = querystringize(location.hash);

$(document).bind("pagebeforechange", function(e, data) {
    if (typeof data.toPage === "string") {
        data.toPage = querystringize(data.toPage);
    }
});
