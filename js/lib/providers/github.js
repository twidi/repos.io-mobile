Reposio.Providers.github = (function() {

    var EventFormatter = function(provider) {
        this.provider = provider;
    };

    EventFormatter.prototype.format = function(event, source) {
        if (event.type && this[event.type]) {
            var result = this[event.type](event, source);
            if (!result) {
                result = this.base_format(event, source, '<em>(' + event.type.replace('Event', '').toLowerCase() + ')</em>');
            }
            return { str: result, day: this.provider.controller.display.format_date(event.created_at) };
        }
        return null;
    };

    EventFormatter.prototype.format_actor  = function(actor, source) {
        if (source.name != 'Account' || source.username != actor.login) {
            return this.provider.controller.display.account_link(actor.login, source.provider.name);
        } else {
            return '<strong>' + actor.login + '</strong>';
        }
    };

    EventFormatter.prototype.format_repo  = function(repository, actor, source) {
        if (source.name != 'Repository' || source.path != repository.name) {
            var parts = repository.name.split('/'),
                result = this.provider.controller.display.repository_link(repository.name, parts[1], source.provider.name),
                with_owner = false;
            if (actor.login != parts[0] && (source.name != 'Account' || source.username != parts[0])) {
                with_owner = true;
                result += '<span> by <strong>' + parts[0] + '</strong></span>'; //this.format_actor({login: parts[0]}, source);
            }
            if (with_owner) {
                return '<span class="repo-links">' + result + '</span>';
            } else {
                return result;
            }
        } else {
            return '<strong>' + repository.name + '</strong>';
        }
    };

    EventFormatter.prototype.base_format = function(event, source, middle_part, more) {
        var result = '';
        result += '<p class="ui-li-aside">' + this.provider.controller.display.format_date(event.created_at, 'show-time', null, 'time-only') + '</p>';
        result += this.format_actor(event.actor, source) + ' ' + middle_part + ' ' + this.format_repo(event.repo, event.actor, source);
        if (more) {
            result += '<p class="ui-li-desc">' + more + '</p>';
        }
        return result;
    };

    EventFormatter.prototype.CommitCommentEvent = function(event, source) {

    };

    EventFormatter.prototype.CreateEvent = function(event, source) {
        var part = 'created', more;
        if (event.payload.ref_type == 'branch') {
            part += ' a branch on';
            more = 'Created branch: <strong>' + event.payload.ref + '</strong>';
        }
        return this.base_format(event, source, part, more);
    };

    EventFormatter.prototype.DeleteEvent = function(event, source) {
        var part = 'deleted', more;
        if (event.payload.ref_type == 'branch') {
            part += ' a branch on';
            more = 'Deleted branch: <strong>' + event.payload.ref + '</strong>';
        }
        return this.base_format(event, source, part, more);

    };

    EventFormatter.prototype.DownloadEvent = function(event, source) {

    };

    EventFormatter.prototype.FollowEvent = function(event, source) {
        // no repo, followed account is in payload.target
    };
    
    EventFormatter.prototype.ForkEvent = function(event, source) {
        return this.base_format(event, source, 'forked');
    };
    
    EventFormatter.prototype.ForkApplyEvent = function(event, source) {

    };
    
    EventFormatter.prototype.GistEvent = function(event, source) {

    };
    
    EventFormatter.prototype.GollumEvent = function(event, source) {

    };
    
    EventFormatter.prototype.IssueCommentEvent = function(event, source) {

    };
    
    EventFormatter.prototype.IssuesEvent = function(event, source) {

    };
    
    EventFormatter.prototype.MemberEvent = function(event, source) {

    };
    
    EventFormatter.prototype.PublicEvent = function(event, source) {

    };
    
    EventFormatter.prototype.PullRequestEvent = function(event, source) {

    };
    
    EventFormatter.prototype.PullRequestReviewCommentEvent = function(event, source) {

    };
    
    EventFormatter.prototype.PushEvent = function(event, source) {
        return this.base_format(event, source, 'pushed to');
    };
    
    EventFormatter.prototype.TeamAddEvent = function(event, source) {

    };
    
    EventFormatter.prototype.WatchEvent = function(event, source) {
        return this.base_format(event, source, 'watched');
    };

    var Provider = function(controller) {
        this.name = 'github';
        this.engine = new Github(typeof providers_config == 'undefined' ? {} : providers_config.github);
        this.user = this.engine.getUser();
        this.controller = controller;
        this.formatter = new EventFormatter(this);
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
