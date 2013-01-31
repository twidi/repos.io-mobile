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
        var parts = repository.name.split('/'), result;
        if (source.name != 'Repository' || source.path != repository.name) {
                result = this.provider.controller.display.repository_link(repository.name, parts[1], source.provider.name);
            if (actor.login != parts[0] && (source.name != 'Account' || source.username != parts[0])) {
                result += '<span> by <strong>' + parts[0] + '</strong></span>'; //this.format_actor({login: parts[0]}, source);
                result = '<span class="repo-links">' + result + '</span>';
            }
        } else {
            result = '<strong>' + parts[1] + '</strong>';
        }
        return result;
    };

    EventFormatter.prototype.base_format = function(event, source, middle_part, desc, target, more) {
        var result = '';
        result += '<p class="ui-li-aside">' + this.provider.controller.display.format_date(event.created_at, 'show-time', null, 'time-only') + '</p>';
        if (!target && event.repo && event.repo.name != '/') {
            target = this.format_repo(event.repo, event.actor, source);
        }
        result += this.format_actor(event.actor, source) + ' ' + middle_part;
        if (target) {
            result += ' ' + target;
        }
        if (desc) {
            result += '<p class="ui-li-desc">' + desc + '</p>';
        }
        if (more) {
            result += more;
        }
        return result;
    };

    EventFormatter.prototype.CommitCommentEvent = function(event, source) {
        var part = 'commented a commit on';
        return this.base_format(event, source, part);
    };

    EventFormatter.prototype.CreateEvent = function(event, source) {
        var part = 'created', desc;
        switch(event.payload.ref_type) {
            case 'branch':
                part += ' a branch on';
                desc = 'Branch: <strong>' + event.payload.ref + '</strong>';
                break;
            case 'repository':
                if (event.payload.description) {
                    desc = 'Description: <strong>' + event.payload.description + '</strong>';
                }
                break;
            case 'tag':
                desc = 'Tag: <strong>' + event.payload.ref + '</strong>';
                break;
        };
        return this.base_format(event, source, part, desc);
    };

    EventFormatter.prototype.DeleteEvent = function(event, source) {
        var part = 'deleted', desc;
        switch(event.payload.ref_type) {
            case 'branch':
                part += ' a branch on';
                desc = 'Branch: <strong>' + event.payload.ref + '</strong>';
                break;
            case 'tag':
                desc = 'Tag: <strong>' + event.payload.ref + '</strong>';
                break;
        };
        return this.base_format(event, source, part, desc);

    };

    EventFormatter.prototype.DownloadEvent = function(event, source) {

    };

    EventFormatter.prototype.FollowEvent = function(event, source) {
        var target = this.format_actor(event.payload.target, source);
        return this.base_format(event, source, 'started following', null, target);
    };

    EventFormatter.prototype.ForkEvent = function(event, source) {
        return this.base_format(event, source, 'forked');
    };

    EventFormatter.prototype.ForkApplyEvent = function(event, source) {

    };

    EventFormatter.prototype.GistEvent = function(event, source) {
        var action = event.payload.action, part, desc;
        if (!action.match(/d$/)) {
            if (!action.match(/e$/)) {
                action += 'e';  // fork
            }
            action += 'd';  // create/update
        }
        part = action + ' a gist',
        desc = 'Description: <strong>' + event.payload.gist.description + '</strong>';
        return this.base_format(event, source, part, desc, null);
    };

    EventFormatter.prototype.GollumEvent = function(event, source) {

    };

    EventFormatter.prototype.IssueCommentEvent = function(event, source) {
        var part = event.payload.action == 'created' ? 'commented an issue on' : event.payload.action + ' a comment on an issue on',
            desc = 'Issue: <strong>#' + event.payload.issue.number + ' - ' + event.payload.issue.title + '</strong>';
        return this.base_format(event, source, part, desc);
    };

    EventFormatter.prototype.IssuesEvent = function(event, source) {
        var part = event.payload.action + ' an issue on',
            desc = 'Issue: <strong>#' + event.payload.issue.number + ' - ' + event.payload.issue.title + '</strong>';
        return this.base_format(event, source, part, desc);
    };

    EventFormatter.prototype.MemberEvent = function(event, source) {
    };

    EventFormatter.prototype.PublicEvent = function(event, source) {
        return this.base_format(event, source, 'open sourced');
    };

    EventFormatter.prototype.PullRequestEvent = function(event, source) {
        var part = event.payload.action + ' a pull request on',
            desc = 'Pull request <strong>#' + event.payload.number + ' - ' + event.payload.pull_request.title + '</strong>';
        return this.base_format(event, source, part, desc);
    };

    EventFormatter.prototype.PullRequestReviewCommentEvent = function(event, source) {
        var part = 'commented a pull request on',
            PR_num = event.payload.comment._links.pull_request.href;
        if (PR_num) { 
            PR_num = PR_num.match(/(\d+)\/?$/);
            if (PR_num) {
                PR_num = PR_num[1];
            }
        }
        if (PR_num) {
            desc = 'Pull request <strong>#' + PR_num + '</strong>';
        }
        return this.base_format(event, source, part, desc);
    };

    EventFormatter.prototype.PushEvent = function(event, source) {
        var part = 'pushed <a href="#" class="collapsible-trigger">' + event.payload.size + ' commit' + (event.payload.size > 1 ? 's' : '') + '</a> to',
            more;
        more = '<div data-role="collapsible" data-content-theme="d" data-corners="false" data-mini="true"><h3>Commits</h3>';
        more += '<ul data-role="listview" data-theme="d">';
        for (var i=0; i<event.payload.commits.length;i++) {
            var commit = event.payload.commits[i],
                message = commit.message.replace('\n', '<br />'),
                first_part = message.slice(0, 50),
                other_part = message.slice(50);
            more += '<li' + (other_part.length ? ' class="with-extension"' : '') + '>';
            more += '<span>' + this.format_actor({login: commit.author.name}, source) + '</span>'; // {provider:source.provider}
            more += ' — <em>';
            more += first_part;
            if (other_part) {
                more += '<span class="extension">' + other_part + '</span>';
            }
            more += '</em>';
            more += '</li>';
        }
        more += '</ul></div>';
        return this.base_format(event, source, part, null, null, more);
    };

    EventFormatter.prototype.TeamAddEvent = function(event, source) {

    };

    EventFormatter.prototype.WatchEvent = function(event, source) {
        return this.base_format(event, source, event.payload.action + ' watching');
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
