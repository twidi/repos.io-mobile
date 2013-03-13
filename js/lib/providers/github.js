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
            return {
                event: event,
                source: source,
                provider: this,
                html: result,
                day: this.provider.controller.display.format_date(event.created_at)
            };
        }
        return null;
    };

    EventFormatter.prototype.format_actor  = function(actor, source, force_link) {
        if (force_link || source.$class.model_name != 'account' || source.username != actor.login) {
            return this.provider.controller.display.account_link(actor.login, source.provider.name);
        } else {
            return '<strong>' + actor.login + '</strong>';
        }
    };

    EventFormatter.prototype.format_repo  = function(repository, actor, source, force_link, force_name) {
        var full_name = repository.full_name || repository.name,
            parts = full_name.split('/'), result;
        if (force_link || source.$class.model_name != 'repository' || source.path != full_name) {
                result = this.provider.controller.display.repository_link(full_name, parts[1], source.provider.name);
            if (force_name || actor.login != parts[0] && (source.$class.model_name != 'account' || source.username != parts[0])) {
                result += '<span> by <strong>' + parts[0] + '</strong></span>'; //this.format_actor({login: parts[0]}, source);
                result = '<span class="repo-links">' + result + '</span>';
            }
        } else {
            result = '<strong>' + parts[1] + '</strong>';
        }
        return result;
    };

    EventFormatter.prototype.base_format = function(event, source, middle_part, desc, target, external_link) {
        var result = '';
        result += '<p class="ui-li-aside">' + this.provider.controller.display.format_date(event.created_at, 'show-time', null, 'time-only') + '</p>';
        if (!target && event.repository && (event.repository.name || event.repository.full_name)) {
            target = this.format_repo(event.repository, event.actor, source);
        }
        result += this.format_actor(event.actor, source) + ' ' + middle_part;
        if (target) {
            result += ' ' + target;
        }
        if (desc) {
            result += '<p class="ui-li-desc">' + desc + '</p>';
        }
        if (external_link) {
            result += this.format_external_link(external_link);
        }
        return result;
    };

    EventFormatter.prototype.markdown_event_more = function(text) {
        if (!text) { return ''; }
        result = '<div class="ui-li ui-li-static ui-btn-up-d ui-first-child ui-last-child markdown">';
        result += marked(text, {sanitize: true, breaks: true, smartLists: true});
        result +='</div>';
        return result;
    };

    EventFormatter.prototype.trigger_text = function(text, triggerable) {
        if (triggerable) {
            return '<a href="#" class="collapsible-trigger">' + text + '</a>';
        } else {
            return text;
        }
    };

    EventFormatter.prototype.more = function(html) {
        var more = '<div data-role="collapsible" data-content-theme="d" data-corners="false" data-mini="true" class="event-more"><h3>More</h3>';
        more += html;
        more += '</div>';
        return more;
    };

    EventFormatter.prototype.description_fetcher = function(event, source) {
        var desc, repository;
        if (event.repository.name && event.repository.name != source.path) {
            repository = App.Models.repository.get(event.repository.name + '@github', this.provider.controller),
            desc = 'Description: ';
            if (!repository.details) {
                desc += '<a href="#" class="fetch-desc-trigger" data-repository="' + repository.id + '">click to fetch</a>';
            } else if (repository.details.description) {
                desc += '<strong>' + repository.details.description + '</strong>';
            } else {
                desc += '<em>no description</em>';
            }
        }
        return desc;
    };

    EventFormatter.prototype.format_external_link = function(href) {
        var html = '<a class="ui-li-link-alt ui-btn ui-btn-icon-notext ui-btn-up-c" data-theme="c" href="' + href + '" target="_blank">';
        html += '<span class="ui-btn ui-btn-icon-notext">';
        html += '<span class="ui-btn-inner">';
        html += '<span class="ui-icon ui-icon-arrow-r">&nbsp;</span>';
        html += '</span>';
        html += '</span>';
        html += '</a>';
        return html;
    };

    EventFormatter.prototype.CommitCommentEvent = function(event, source) {
        var part = this.trigger_text('commented', event.comment.body) +  ' a commit on';
        return this.base_format(event, source, part, null, null, event.comment.html_url);
    };

    EventFormatter.prototype.more_CommitCommentEvent = function(event, source) {
        return this.more(this.markdown_event_more(event.comment.body));
    };

    EventFormatter.prototype.CreateEvent = function(event, source) {
        var part = 'created', desc, link;
        switch( event.ref_type) {
            case 'branch':
                part += ' a branch on';
                desc = 'Branch: <strong>' + event.ref + '</strong>';
                link = 'https://github.com/' + event.repository.name + '/tree/' + event.ref;
                break;
            case 'repository':
                if (event.description) {
                    desc = 'Description: <strong>' + event.description + '</strong>';
                }
                link = 'https://github.com/' + event.repository.name;
                break;
            case 'tag':
                part += ' a tag on';
                desc = 'Tag: <strong>' + event.ref + '</strong>';
                link = 'https://github.com/' + event.repository.name + '/tree/' + event.ref;
                break;
        }
        return this.base_format(event, source, part, desc, null, link);
    };

    EventFormatter.prototype.DeleteEvent = function(event, source) {
        var part = 'deleted', desc;
        switch(event.ref_type) {
            case 'branch':
                part += ' a branch on';
                desc = 'Branch: <strong>' + event.ref + '</strong>';
                break;
            case 'tag':
                desc = 'Tag: <strong>' + event.ref + '</strong>';
                break;
        }
        return this.base_format(event, source, part, desc);

    };

    EventFormatter.prototype.DownloadEvent = function(event, source) {

    };

    EventFormatter.prototype.FollowEvent = function(event, source) {
        var target = this.format_actor(event.target, source);
        return this.base_format(event, source, 'started following', null, target);
    };

    EventFormatter.prototype.ForkEvent = function(event, source) {
        var part = this.trigger_text('forked', event.forkee),
            desc = this.description_fetcher(event, source);
        return this.base_format(event, source, part, desc);
    };

    EventFormatter.prototype.more_ForkEvent = function(event, source) {
        return this.more('<p class="ui-li ui-li-static ui-btn-up-d ui-first-child ui-last-child">Fork: ' + this.format_repo(event.forkee, event.actor, source, null, true) + '</p>');
    };

    EventFormatter.prototype.ForkApplyEvent = function(event, source) {
        return this.base_format(event, source, 'applied the fork queue to');
    };

    EventFormatter.prototype.GistEvent = function(event, source) {
        var action = event.action, part, desc;
        if (!action.match(/d$/)) {
            if (!action.match(/e$/)) {
                action += 'e';  // fork
            }
            action += 'd';  // create/update
        }
        part = action + ' a gist';
        if (event.gist.description) { desc = 'Description: <strong>' + event.gist.description + '</strong>'; }
        return this.base_format(event, source, part, desc, null, event.gist.html_url);
    };

    EventFormatter.prototype.GollumEvent = function(event, source) {
        var target = this.format_repo(event.repository, event.actor, source),
            part = this.trigger_text('edited', true) + ' the ' + target + ' wiki',
            link = 'https://github.com/' + event.repository.name + '/wiki';
        return this.base_format(event, source, part, null, ' ', link);
    };

    EventFormatter.prototype.more_GollumEvent = function(event, source) {
        var more = '<ul data-role="listview" data-theme="d">';
        for (var i=0; i<event.pages.length; i++) {
            var page = event.pages[i];
            more += '<li>';
            more += '<em>' + page.title + '</em> — <strong>' + page.action + '</strong>';
            more += '</li>';
        }
        more += '</ul>';
        return this.more(more);
    };

    EventFormatter.prototype.IssueCommentEvent = function(event, source) {
        var part,
            desc = (event.is_pull_request ? 'Pull request' : 'Issue') + ': <strong>#' + event.issue.number + ' - ' + event.issue.title + '</strong>',
            link;
        if (event.action == 'created') {
            part = this.trigger_text('commented', event.comment.body);
            part += ' ' + (event.is_pull_request ? 'a pull request' : 'an issue') + ' on';
        } else {
            part = event.action + ' a ';
            part += this.trigger_text('comment', event.action != 'deleted' && event.comment.body);
            part += ' on an issue on';
        }
        if (event.comment.html_url) {
            link = event.comment.html_url;
        } else if (event.issue.html_url && event.comment.id) {
            link = event.issue.html_url + '#issuecomment-' + event.comment.id;
        }
        return this.base_format(event, source, part, desc, null, link);
    };

    EventFormatter.prototype.more_IssueCommentEvent = function(event, source) {
        return this.more(this.markdown_event_more(event.comment.body));
    };

    EventFormatter.prototype.IssuesEvent = function(event, source) {
        var part = event.action + ' an ' + this.trigger_text('issue', event.issue.body) + ' on',
            desc = 'Issue <strong>#' + event.issue.number + ' - ' + event.issue.title + '</strong>';
        return this.base_format(event, source, part, desc, null, event.issue.html_url);
    };

    EventFormatter.prototype.more_IssuesEvent = function(event, source) {
        return this.more(this.markdown_event_more(event.issue.body));
    };

    EventFormatter.prototype.MemberEvent = function(event, source) {
        var part = event.action + ' ';
        part += this.format_actor(event.member, source);
        part += ' as a member ' + (event.action == 'added' ? 'to' : 'from');
        return this.base_format(event, source, part);
    };

    EventFormatter.prototype.PublicEvent = function(event, source) {
        return this.base_format(event, source, 'open sourced');
    };

    EventFormatter.prototype.PullRequestEvent = function(event, source) {
        var part = event.action + ' a ' + this.trigger_text('pull request', event.pull_request.body) + ' on',
            desc = 'Pull request <strong>#' + event.pull_request.number + ' - ' + event.pull_request.title + '</strong>';
        return this.base_format(event, source, part, desc, null, event.pull_request.html_url);
    };

    EventFormatter.prototype.more_PullRequestEvent = function(event, source) {
        return this.more(this.markdown_event_more(event.pull_request.body));
    };

    EventFormatter.prototype.PullRequestReviewCommentEvent = function(event, source) {
        var part = this.trigger_text('commented', event.comment.body) + ' a pull request on',
            desc;
        if (event.pull_request.number) {
            desc = 'Pull request <strong>#' + event.pull_request.number + '</strong>';
        }
        return this.base_format(event, source, part, desc, null, event.comment.html_url);
    };

    EventFormatter.prototype.more_PullRequestReviewCommentEvent = function(event, source) {
        return this.more(this.markdown_event_more(event.comment.body));
    };

    EventFormatter.prototype.PushEvent = function(event, source) {
        var part = 'pushed ' + (event.size ? this.trigger_text(event.size + ' commit' + (event.size > 1 ? 's' : ''), true) : '') + ' to',
            desc, link;
            if (event.ref && event.ref.indexOf('refs/heads/') === 0) {
                desc = 'Branch: <strong>' + event.ref.replace('refs/heads/', '') + '</strong>';
            }
            if (event.size == 1) {
                link = 'https://github.com/' + event.repository.name + '/commit/' + event.commits[0].sha;
            } else if (event.before && event.head) {
                link = 'https://github.com/' + event.repository.name + '/compare/' + event.before + '...' + event.head;
            }
        return this.base_format(event, source, part, desc, null, link);
    };

    EventFormatter.prototype.more_PushEvent = function(event, source) {
        var more = '<ul data-role="listview" data-theme="d">';

        for (var i=0; i<event.commits.length;i++) {
            var commit = event.commits[i],
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
        more += '</ul>';
        return this.more(more);
    };

    EventFormatter.prototype.TeamAddEvent = function(event, source) {

    };

    EventFormatter.prototype.WatchEvent = function(event, source) {
        var part = event.action + ' watching',
            desc = this.description_fetcher(event, source);
        return this.base_format(event, source, part, desc);
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

    Provider.prototype.map_type = {accounts: 'account', repositories: 'repository', events: 'event'};
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
                    case 'events':
                        // call "map_account", "map_repository" or "map_event"
                        // for each entry in the list obtained by a call to "getAll"
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
        var result = {}, key_in;
        if (data) {
            for (var i = 0; i < mapping._.length; i++) {
                key_in = mapping._[i];
                if (typeof(data[key_in]) == 'undefined') {
                    continue;
                }
                result[mapping[key_in] || key_in] = data[key_in];
            }
        }
        return result;
    };

    Provider.prototype.account_mapping = {
        _: ['login', 'type', 'avatar_url', 'name', 'created_at', 'company', 'location', 'email', 'blog', 'public_repos', 'followers_count', 'following_count', 'contributions'],
        blog: 'site',
        public_repos: 'repos_count'
    };

    Provider.prototype.map_account = function(data) {
        var result = {};
        if (data) {
            result = this.map(data, this.account_mapping);
        }
        return result;
    };

    Provider.prototype.repository_mapping = {
        _: ['name', 'full_name', 'description', 'pushed_at', 'created_at', 'updated_at', 'forks_count', 'fork', 'watchers_count', 'language'],
        fork: 'is_fork'
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

    Provider.prototype.map_event = function(data) {
        var event = {}, payload;
        if (data) {
            payload = data.payload || {};
            switch (data.type) {
                case 'CommitCommentEvent':
                    event.comment = this.map(payload.comment, {_:['body', 'html_url']});
                    break;
                case 'CreateEvent':
                    event = this.map(payload, {_:['ref_type', 'ref', 'description']});
                    break;
                case 'DeleteEvent':
                    event = this.map(payload, {_:['ref_type', 'ref']});
                    break;
                case 'FollowEvent':
                    if (payload.target && payload.target.login) { event.target = {login: payload.target.login}; }
                    break;
                case 'ForkEvent':
                    // in old events, forkee was the github id of the repository, so we don't have any name
                    if (payload.forkee && isNaN(payload.forkee)) { event.forkee = this.map(payload.forkee, {_:['name', 'full_name']}); }
                    break;
                case 'GistEvent':
                    event = this.map(payload, {_:['action']});
                    event.gist = this.map(payload.gist, {_:['description', 'html_url']});
                    break;
                case 'GollumEvent':
                    event.pages = [];
                    if (payload.pages && payload.pages.length) {
                        for (var page_number = 0; page_number < payload.pages.length; page_number++) {
                            event.pages.push(this.map(payload.pages[page_number], {_:['title', 'action']}));
                        }
                    }
                    break;
                case 'IssueCommentEvent':
                    event = this.map(payload, {_:['action']});
                    event.issue = this.map(payload.issue, {_:['number', 'title', 'html_url']});
                    event.issue.is_pull_request = (payload.issue && payload.issue.pull_request && payload.issue.pull_request.html_url);
                    event.comment = this.map(payload.comment, {_:['body', 'html_url', 'id']});
                    break;
                case 'IssuesEvent':
                    event = this.map(payload, {_:['action']});
                    event.issue = this.map(payload.issue, {_:['number', 'title', 'body', 'html_url']});
                    break;
                case 'MemberEvent':
                    event = this.map(payload, {_:['action']});
                    if (payload.member && payload.member.login) { event.member = {login: payload.member.login}; }
                    break;
                case 'PullRequestEvent':
                    event = this.map(payload, {_:['action', 'number']});
                    event.pull_request = this.map(payload.pull_request, {_:['body', 'title', 'html_url']});
                    if (event.number) {
                        event.pull_request.number = event.number;
                        delete event.number;
                    }
                    break;
                case 'PullRequestReviewCommentEvent':
                    // hack the pull request url to get its number, not officialy available in the payload
                    var PR_num;
                    event.pull_request = {};
                    if (payload.comment._links && payload.comment._links.pull_request && payload.comment._links.pull_request.href) {
                        PR_num = payload.comment._links.pull_request.href;
                        PR_num = PR_num.match(/(\d+)\/?$/);
                        PR_num = PR_num ? PR_num[1] : null;
                        if (PR_num) { event.pull_request.number = PR_num; }
                    }
                    event.comment = this.map(payload.comment, {_:['body', 'html_url']});
                    if (!event.comment.html_url && payload.comment && payload.comment._links && payload.comment._links.html) {
                        event.comment.html_url = payload.comment._links.html.href;
                    }
                    break;
                case 'PushEvent':
                    // in old events, commit infos are available as arrays in 'shas', not as objects in 'commits'
                    var old_style, commits;
                    event = this.map(payload, {_:['size', 'ref', 'before', 'head']});
                    event.commits = [];
                    if (event.size) {
                        if (payload.commits) {
                            commits = payload.commits;
                            old_style = false;
                        } else if (payload.shas) {
                            commits = payload.shas;
                            old_style = true;
                        }
                        if (!commits.length) {
                            event.size = 0;
                        } else {
                            for (var i=0; i<commits.length;i++) {
                                var commit = commits[i];
                                event.commits.push({
                                    sha: old_style ? commit[0] : commit.sha,
                                    message: old_style ? commit[2] : commit.message,
                                    author: {name: old_style ? commit[3] : commit.author.name}
                                });
                            }
                        }
                    }
                    break;
                case 'WatchEvent':
                    event = this.map(payload, {_:['action']});
                    break;
            } // switch data.type

            event.type = data.type;
            event.created_at = data.created_at;
            event.actor = this.map(data.actor, {_:['login']});
            event.repository = this.map(data.repository || data.repo, {_:['name', 'full_name']});

        }

        return event;
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
        this.get_user(username).events.fetch(this.decorate_collback(callback, 'events', 'events'), params);
    };

    Provider.prototype.get_account_received_events = function(username, callback, params) {
        this.get_user(username).received_events.fetch(this.decorate_collback(callback, 'received_events', 'events'), params);
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
        this.get_repo(path).events.fetch(this.decorate_collback(callback, 'events', 'events'), params);
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
