Reposio.Models.Repository = (function() {

    var Repository = function(id, controller) {
        var parts = id.split('@');
        this.id = id;
        this.path = parts[0];
        this.href_id = this.id.replace('/', ':');

        this.provider = controller.providers[parts[1]];

        this.controller = controller;

        this.details = null;
        this.activity = null;
        this.forks = null;
    };

    Repository.cache = {};
    Repository.get = function(id, controller) {
        if (!Repository.cache[id]) {
            Repository.cache[id] = new Repository(id, controller);
        }
        return Repository.cache[id];
    };

    Repository.prototype.fetch = function(type, callback, args) {
        var that = this;
        if (type != 'details' && !that.details) {
            that.fetch('details', function() {
                that.fetch(type, callback, args);
            }, {no_readme: true});
            return;
        }
        if (type == 'details' && that.details && !that.details.readme) {
            that.provider.get_repository_readme(that.path, function(err, data) {
                if (err) {
                    that.controller.fetch_error(err, that, type, callback, args);                    
                } else {
                    that.details.readme = data;
                    callback();
                }
            }, args);
        }
        else if (that[type] === null) {
            that.provider['get_repository_' + type](that.path, function(err, data) {
                if (err) {
                    that.controller.fetch_error(err, that, type, callback, args);
                } else {
                    that[type] = data;
                    callback();
                }
            }, args);
        } else {
            callback();
        }
    };

    return Repository;

})();
