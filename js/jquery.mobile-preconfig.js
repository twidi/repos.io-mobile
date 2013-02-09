(function() {
    $(document).bind("mobileinit", function(){
        $.mobile.page.prototype.options.addBackBtn = true;
        $.mobile.defaultPageTransition = 'slide';
    });

    function querystringize(hash) {
        if (hash.indexOf('!') != -1) {
            return hash.replace('!', '?');
        }
        return hash;
    }

    var corrected_hash = querystringize(location.hash);
    if (corrected_hash != location.hash) {
        try {
            window.history.replaceState({}, document.title, corrected_hash);
        } catch(e) {
            location.hash = corrected_hash;
        }
    }

    $(document).bind("pagebeforechange", function(e, data) {
        if (typeof data.toPage === "string") {
            data.toPage = querystringize(data.toPage);
        }
    });

})();
