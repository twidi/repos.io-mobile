
$(document).bind("mobileinit", function(){
    $.mobile.page.prototype.options.addBackBtn = true;
    $.mobile.defaultPageTransition = 'slide';
});


var qs_separator = '!';
function querystringize(hash) {
    if (hash.indexOf(qs_separator) != -1) {
        return hash.replace(qs_separator, '?')
    }
    return hash
}
location.hash = querystringize(location.hash);

$(document).bind("pagebeforechange", function(e, data) {
    if (typeof data.toPage === "string") {
        data.toPage = querystringize(data.toPage);
    }
});
