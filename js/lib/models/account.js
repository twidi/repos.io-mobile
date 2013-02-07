(function(App) {

    var Model = function(id, controller) {
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
        this.org_members = null;
        this.orgs = null;
    };

    Model.prototype.name = 'account';

    Model.prototype.defaults = {
        details: {},
        repositories: [],
        stars: [],
        own_events: [],
        received_events: [],
        followers: [],
        following: [],
        org_members: [],
        orgs: []
    };

    Model.cache = {};
    Model.get = function(id, controller) {
        if (!Model.cache[id]) {
            Model.cache[id] = new Model(id, controller);
        }
        return Model.cache[id];
    };

    Model.prototype.fetch_full = function(type, callback) {
        var that = this;
        if (type != 'details' && !that.details) {
            that.fetch_full('details', function() {
                that.fetch_full(type, callback);
            });
            return;
        }
        if (that[type] === null) {
            that.fetch(type,
                function(data) {  // success
                    that[type] = data;
                    callback();
                },
                function(err) {  // failure
                    that.controller.fetch_full_error(err, that, type, callback);
                },
                'fail_if_404'
            );
        } else {
            callback();
        }
    };

    Model.prototype.fetch = function(type, success, failure, fail_if_404) {
        var that = this;
        that.provider['get_account_' + type](that.username, function(err, data) {
            if (err && err.error == 404 && !fail_if_404) {
                data = that.defaults[type];
                err = null;
            }
            if (err) {
                failure(err.error);
            } else {
                success(data);
            }
        });
    };

    if (!App.Models) { App.Models = {}; }
    App.Models.account = Model;

})(Reposio);
