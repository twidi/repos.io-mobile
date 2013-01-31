Reposio.Models.Account = (function() {

    var Account = function(id, controller) {
        var parts = id.split('@');
        this.id = id;
        this.username = parts[0];
        this.provider = controller.providers[parts[1]];

        this.controller = controller;

        this.details = null;
        this.repositories = null;
        this.stars = null;
        this.own_events = null;
        this.received_events = null;
        this.followers = null;
        this.following = null;
    };

    Account.prototype.name = 'Account';
    Account.cache = {};
    Account.get = function(id, controller) {
        if (!Account.cache[id]) {
            Account.cache[id] = new Account(id, controller);
        }
        return Account.cache[id];
    };

    Account.prototype.fetch = function(type, callback, args) {
        var that = this;
        if (type != 'details' && !that.details) {
            that.fetch('details', function() {
                that.fetch(type, callback, args);
            });
            return;
        }
        if (that[type] === null) {
            that.provider['get_account_' + type](that.username, function(err, data) {
                if (err) {
                    that.controller.fetch_error(err, that, type, callback);
                } else {
                    that[type] = data;
                    callback();                    
                }
            });
        } else {
            callback();
        }
    };

    return Account;

})();
