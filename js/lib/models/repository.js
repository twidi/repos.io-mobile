(function(App) {

    var Model = function(id, controller) {
        var parts = id.split('@');
        this.id = id;
        this.path = parts[0];
        this.href_id = this.id.replace('/', ':');

        this.provider = controller.providers[parts[1]];

        this.controller = controller;

        this.details = null;
        this.readme = null;
        this.activity = null;
        this.forks = null;
        this.stars = null;
        this.contributors = null;
    };

    Model.prototype.name = 'repository';
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
            that.provider['get_repository_' + type](that.path, function(err, data) {
                if (err) {
                    that.controller.fetch_full_error(err, that, type, callback);
                } else {
                    that[type] = data;
                    callback();
                }
            });
        } else {
            callback();
        }
    };

    Model.prototype.fetch_readme = function(success, failure) {
        var that = this;
        that.provider.get_repository_readme(that.path, function(err, data) {
            if (err && err.error == 404) {
                data = '';
                err = null;
            }
            if (err) {
                failure(err.error);
            } else {
                that.readme = data;
                success();
            }
        });
    };

    if (!App.Models) { App.Models = {}; }
    App.Models.repository = Model;

})(Reposio);
