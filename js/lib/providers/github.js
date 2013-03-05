(function(App) {

    var EventFormatter = function(provider) {
        this.provider = provider;
    };

    EventFormatter.prototype.format = function(event, source) {
        if (event.type && this[event.type]) {
            var result = this[event.type](event, source);
            if (!result) {
                result = this.base_format(event, source, '<em>(' + event.type.replace('Event', '').toLowerCase() + ')</em>');
            }
            return { html: result, day: this.provider.controller.display.format_date(event.created_at) };
        }
        return null;
    };

    EventFormatter.prototype.format_actor  = function(actor, source) {
        if (source.name != 'account' || source.username != actor.login) {
            return this.provider.controller.display.account_link(actor.login, source.provider.name);
        } else {
            return '<strong>' + actor.login + '</strong>';
        }
    };

    EventFormatter.prototype.format_repo  = function(repository, actor, source) {
        var full_name = repository.full_name || repository.name,
            parts = full_name.split('/'), result;
        if (source.name != 'repository' || source.path != full_name) {
                result = this.provider.controller.display.repository_link(full_name, parts[1], source.provider.name);
            if (actor.login != parts[0] && (source.name != 'account' || source.username != parts[0])) {
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
        if (!target && event.repository && event.repository.name != '/') {
            target = this.format_repo(event.repository, event.actor, source);
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
        var part = '<a href="#" class="collapsible-trigger">commented</a> a commit on',
            more = '<div data-role="collapsible" data-content-theme="d" data-corners="false" data-mini="true"><h3>Comment</h3>';
        more += '<p class="ui-li ui-li-static ui-btn-up-d ui-first-child ui-last-child"><em>' + event.payload.comment.body.replace(/\n/g, '<br />') + '</em></p>';
        more += '</div>';
        return this.base_format(event, source, part, null, null, more);
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
        }
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
        }
        return this.base_format(event, source, part, desc);

    };

    EventFormatter.prototype.DownloadEvent = function(event, source) {

    };

    EventFormatter.prototype.FollowEvent = function(event, source) {
        var target = this.format_actor(event.payload.target, source);
        return this.base_format(event, source, 'started following', null, target);
    };

    EventFormatter.prototype.ForkEvent = function(event, source) {
        var part = '<a href="#" class="collapsible-trigger">forked</a>',
            more;
        more = '<div data-role="collapsible" data-content-theme="d" data-corners="false" data-mini="true"><h3>Fork</h3>';
        more += '<p class="ui-li ui-li-static ui-btn-up-d ui-first-child ui-last-child">Fork: ' + this.format_repo(event.payload.forkee, event.actor, source) + '</p>';
        more += '</div>';
        return this.base_format(event, source, part, null, null, more);
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
        var target = this.format_repo(event.repository, event.actor, source),
            part = '<a href="#" class="collapsible-trigger">edited</a> the ' + target + ' wiki';
            more = '';
        more = '<div data-role="collapsible" data-content-theme="d" data-corners="false" data-mini="true"><h3>Actions</h3>';
        more += '<ul data-role="listview" data-theme="d">';
        for (var i=0; i<event.payload.pages.length; i++) {
            var page = event.payload.pages[i];
            more += '<li>';
            more += '<em>' + page.title + '</em> — <strong>' + page.action + '</strong>';
            more += '</li>';
        }
        more += '</ul>';
        more += '</div>';
        return this.base_format(event, source, part, null, ' ', more);
    };

    EventFormatter.prototype.IssueCommentEvent = function(event, source) {
        var part = event.payload.action == 'created' ? '<a href="#" class="collapsible-trigger">commented</a> ' + (event.payload.issue.pull_request ? 'a pull request' : 'an issue') + ' on' : event.payload.action + ' a ' + (event.payload.action == 'deleted' ? 'comment' : '<a href="#" class="collapsible-trigger">comment</a>') + ' on an issue on',
            desc = (event.payload.issue.pull_request ? 'Pull request' : 'Issue') + ': <strong>#' + event.payload.issue.number + ' - ' + event.payload.issue.title + '</strong>',
            more;
        if (event.payload.action != 'deleted') {
            more = '<div data-role="collapsible" data-content-theme="d" data-corners="false" data-mini="true"><h3>Comment</h3>';
            more += '<p class="ui-li ui-li-static ui-btn-up-d ui-first-child ui-last-child"><em>' + event.payload.comment.body.replace(/\n/g, '<br />') + '</em></p>';
            more += '</div>';
        }
        return this.base_format(event, source, part, desc, null, more);
    };

    EventFormatter.prototype.IssuesEvent = function(event, source) {
        var part = event.payload.action + ' an issue on',
            desc = 'Issue: <strong>#' + event.payload.issue.number + ' - ' + event.payload.issue.title + '</strong>';
        return this.base_format(event, source, part, desc);
    };

    EventFormatter.prototype.MemberEvent = function(event, source) {
        var part = event.payload.action + ' ';
        part += this.format_actor(event.payload.member, source);
        part += ' as a member ' + (event.payload.action == 'added' ? 'to' : 'from');
        return this.base_format(event, source, part);
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
        var part = '<a href="#" class="collapsible-trigger">commented</a> a pull request on',
            PR_num = event.payload.comment._links.pull_request.href,
            more = '<div data-role="collapsible" data-content-theme="d" data-corners="false" data-mini="true"><h3>Comment</h3>';
        more += '<p class="ui-li ui-li-static ui-btn-up-d ui-first-child ui-last-child"><em>' + event.payload.comment.body.replace(/\n/g, '<br />') + '</em></p>';
        more += '</div>';
        
        if (PR_num) {
            PR_num = PR_num.match(/(\d+)\/?$/);
            if (PR_num) {
                PR_num = PR_num[1];
            }
        }
        if (PR_num) {
            desc = 'Pull request <strong>#' + PR_num + '</strong>';
        }
        
        return this.base_format(event, source, part, desc, null, more);
    };

    EventFormatter.prototype.PushEvent = function(event, source) {
        var part = 'pushed ' + (event.payload.size ? '<a href="#" class="collapsible-trigger">' + event.payload.size + ' commit' + (event.payload.size > 1 ? 's' : '') + '</a> ' : '') + 'to',
            more;
        if (event.payload.size) {
            more = '<div data-role="collapsible" data-content-theme="d" data-corners="false" data-mini="true"><h3>Commits</h3>';
            more += '<ul data-role="listview" data-theme="d">';
            for (var i=0; i<event.payload.commits.length;i++) {
                var commit = event.payload.commits[i],
                    lines = commit.message.split('\n'),
                    first_part = lines.shift(),
                    other_part = lines.length ? '<br />' + lines.join('<br />') : '';

                more += '<li' + (other_part.length ? ' class="with-extension"' : '') + '>';
                more += '<strong>' + commit.author.name + '</strong>'; // we have the name, not the username :(
                more += ' — <em>';
                more += first_part;
                if (other_part) {
                    more += '<span class="extension">' + other_part + '</span>';
                }
                more += '</em>';
                more += '</li>';
            }
            more += '</ul></div>';
        }
        return this.base_format(event, source, part, null, null, more);
    };

    EventFormatter.prototype.TeamAddEvent = function(event, source) {

    };

    EventFormatter.prototype.WatchEvent = function(event, source) {
        return this.base_format(event, source, event.payload.action + ' watching');
    };



    var Provider = function(controller) {
        var authorization, conf = (providers_config ? providers_config.github || {} : {});

        this.name = 'github';

        if (conf.auth == 'basic' && conf.username && conf.password) {
            authorization = 'Basic ' + Base64.encode(conf.username + ':' + conf.password);
        } else if (conf.auth == 'oauth' && conf.token) {
            authorization = 'token '+ conf.token;
        }
        if (authorization) {
            Gh3.Helper.headers['Authorization'] = authorization;
        }

        Gh3.Helper.cache = false;

        this.controller = controller;
        this.formatter = new EventFormatter(this);
    };

    Provider.prototype.get_user = function(username) {
        return new Gh3.User(username);
    };

    Provider.prototype.get_repo = function(path) {
        var parts = path.split('/');
        return new Gh3.Repository(parts[1], this.get_user(parts[0]));
    };

    Provider.prototype.map_type = {accounts: 'account', repositories: 'repository'};
    Provider.prototype.decorate_collback = function(callback, name, type) {
        var that = this;
        return function(err, data) {
            var final_data;
            if (!err) {
                switch (type) {
                    case 'field':
                        final_data = data[name];
                        break;
                    case 'repositories':
                    case 'accounts':
                        // call "map_account" or "map_repositories" for each entry
                        // in the list obtained by a call to "getAll"
                        final_data = _.map(data[name].getAll(), that['map_' + that.map_type[type]], that);
                        break;
                    default:
                        final_data = data[name].getAll();
                }
            }
            callback(err, err ? null : final_data);
        };
    };

    Provider.prototype.map = function(data, mapping) {
        var result = {};
        if (data) {
            for (var key in mapping) {
                if (typeof(data[key]) == 'undefined') {
                    continue;
                }
                result[mapping[key]] = data[key];
            }
        }
        return result;
    };

    Provider.prototype.account_mapping = {
        login: 'login',
        type: 'type',
        avatar_url: 'avatar_url',
        name: 'name',
        created_at: 'created_at',
        company: 'company',
        location: 'location',
        email: 'email',
        blog: 'site',
        public_repos: 'repos_count',
        followers_count: 'followers_count',
        following_count: 'following_count',
        contributions: 'contributions'
    };

    Provider.prototype.map_account = function(data) {
        var result = {};
        if (data) {
            result = this.map(data, this.account_mapping);
        }
        return result;
    };

    Provider.prototype.repository_mapping = {
        name: 'name',
        full_name: 'full_name',
        description: 'description',
        pushed_at: 'pushed_at',
        created_at: 'created_at',
        updated_at: 'updated_at',
        fork: 'is_fork',
        forks_count: 'forks_count',
        watchers_count: 'watchers_count'
    };
    Provider.prototype.map_repository = function(data) {
        var result = {};
        if (data) {
            result = this.map(data, this.repository_mapping);
            if (data.fork && data.parent) {
                result.parent = this.map_repository(data.parent);
            }
            if (data.user) {
                result.user = this.map_account(data.user);
            }
        }
        return result;
    };

    Provider.prototype.get_account_details = function(username, callback, params) {
        var that = this;
        function map_callback(error, data) {
            if (!error && data) {
                data = that.map_account(data);
            }
            return callback(error, data);
        }
        this.get_user(username).fetch(map_callback, params);
    };

    Provider.prototype.get_account_repositories = function(username, callback, params) {
        this.get_user(username).repositories.fetch(this.decorate_collback(callback, 'repositories', 'repositories'), params);
    };

    Provider.prototype.get_account_stars = function(username, callback, params) {
        this.get_user(username).starred.fetch(this.decorate_collback(callback, 'starred', 'repositories'), params);
    };

    Provider.prototype.get_account_own_events = function(username, callback, params) {
        this.get_user(username).events.fetch(this.decorate_collback(callback, 'events'), params);
    };

    Provider.prototype.get_account_received_events = function(username, callback, params) {
        this.get_user(username).received_events.fetch(this.decorate_collback(callback, 'received_events'), params);
    };

    Provider.prototype.get_account_followers = function(username, callback, params) {
        this.get_user(username).followers.fetch(this.decorate_collback(callback, 'followers', 'accounts'), params);
    };

    Provider.prototype.get_account_following = function(username, callback, params) {
        this.get_user(username).following.fetch(this.decorate_collback(callback, 'following', 'accounts'), params);
    };

    Provider.prototype.get_account_org_members = function(username, callback, params) {
        this.get_user(username).members.fetch(this.decorate_collback(callback, 'members', 'accounts'), params);
    };

    Provider.prototype.get_account_orgs = function(username, callback, params) {
        this.get_user(username).orgs.fetch(this.decorate_collback(callback, 'orgs', 'accounts'), params);
    };

    Provider.prototype.get_repository_details = function(path, callback, params) {
        var that = this;
        function map_callback(error, data) {
            if (!error && data) {
                data = that.map_repository(data);
            }
            return callback(error, data);
        }
        this.get_repo(path).fetch(map_callback, params);
    };

    Provider.prototype.get_repository_readme = function(path, callback, params) {
        this.get_repo(path).fetchReadme(this.decorate_collback(callback, 'readme', 'field'), params);
    };

    Provider.prototype.get_repository_activity = function(path, callback, params) {
        this.get_repo(path).events.fetch(this.decorate_collback(callback, 'events'), params);
    };

    Provider.prototype.get_repository_forks = function(path, callback, params) {
        this.get_repo(path).forks.fetch(this.decorate_collback(callback, 'forks', 'repositories'), params);
    };

    Provider.prototype.get_repository_stars = function(path, callback, params) {
        this.get_repo(path).stargazers.fetch(this.decorate_collback(callback, 'stargazers', 'accounts'), params);
    };

    Provider.prototype.get_repository_contributors = function(path, callback, params) {
        this.get_repo(path).contributors.fetch(this.decorate_collback(callback, 'contributors', 'accounts'), params);
    };

    if (!App.Providers) { App.Providers = {}; }
    App.Providers.github = Provider;

})(Reposio);
