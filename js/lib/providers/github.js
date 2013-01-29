Reposio.Providers.github = (function() {

    var Provider = function(controller) {
        this.name = 'github';
        this.engine = new Github(typeof providers_config == 'undefined' ? {} : providers_config.github);
        this.user = this.engine.getUser();
    };

    Provider.prototype.get_repo = function(path) {
        var parts = path.split('/');
        return this.engine.getRepo(parts[0], parts[1]);
    }

    Provider.prototype.get_account_details = function(username, callback) {
        this.user.show(username, callback);
    };

    Provider.prototype.get_account_repositories = function(username, callback) {
        this.user.userRepos(username, callback);
    };

    Provider.prototype.get_account_stars = function(username, callback) {
        this.user.userStars(username, callback);
    };

    Provider.prototype.get_account_own_events = function(username, callback) {
        this.user.userEvents(username, callback);
    };

    Provider.prototype.get_account_received_events = function(username, callback) {
        this.user.userReceivedEvents(username, callback);
    };

    Provider.prototype.get_repository_details = function(path, callback, args) {
        var that = this,
            repo = that.get_repo(path);
        if (args && args.no_readme==true) {
            repo.show(callback);
        } else {
            repo.show(function(err, data) {
                if (err) { return callback(err, {}); }
                that.get_repository_readme(path, function(err, readme) {
                    if (err) { return callback(err, {}); }
                    data.readme = readme;
                    callback(null, data);
                });
            });
        }
    };

    Provider.prototype.get_repository_readme = function(path, callback) {
        this.get_repo(path).readme(callback);
    }

    Provider.prototype.get_repository_activity = function(path, callback) {
        this.get_repo(path).events(callback);
    };

    Provider.prototype.get_repository_forks = function(path, callback) {
        this.get_repo(path).forks(callback);
    };

    return Provider;

})();
