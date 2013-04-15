(function(App) {

    var EventFormatter = (function GithubEventFormatter__constructor (provider) {
        this.provider = provider;
    }); // EventFormatter

    EventFormatter.prototype.format = (function GithubEventFormatter__format (event, source) {
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
    }); // format

    EventFormatter.prototype.format_actor  = (function GithubEventFormatter__format_actor (actor, source, main) {
        return '<a class="account-link' + (main ? ' main-link' : '') + '" href="#account_home!account=' + actor.login + '@' + source.provider.name + '">' + actor.login + '</a>';
    }); // format_actor

    EventFormatter.prototype.format_repo  = (function GithubEventFormatter__format_repo (repository, actor, source, main, force_name) {
        var parts = repository.full_name.split('/'), result;

        result = '<a class="repo-link' + (main ? ' main-link' : '') + '" href="#repository_home!repository=' + repository.full_name.replace('/', ':') + '@' + source.provider.name + '">' + parts[1] + '</a>';
        if (force_name || actor.login != parts[0] && (source.$class.model_name != 'account' || source.username != parts[0])) {
            result += ' by ' + this.format_actor({login: parts[0]}, source);
        }

        return result;
    }); // format_repo

    EventFormatter.prototype.base_format = (function GithubEventFormatter__base_format (event, source, middle_part, desc, target, external_link) {
        var result, content;
        result = '<p class="ui-li-aside">' + this.provider.controller.display.format_date(event.created_at, 'show-time', null, 'time-only') + '</p>';
        if (!target && event.repository && event.repository.full_name) {
            target = this.format_repo(event.repository, event.actor, source, 'main');
        }
        content = this.format_actor(event.actor, source, 'main') + ' ' + middle_part;
        if (target) {
            content += ' ' + target;
        }
        result += '<div class="event-main">' + content + '</div>';
        if (external_link) {
            result += this.format_external_link(external_link);
        }
        if (desc) {
            result += '<p class="ui-li-desc">' + desc + '</p>';
        }
        return result;
    }); // base_format

    EventFormatter.prototype.markdown_event_more = (function GithubEventFormatter__markdown_event_more (text) {
        if (!text) { return ''; }
        result = '<div class="markdown">';
        result += marked(text, {sanitize: true, breaks: true, smartLists: true});
        result +='</div>';
        return result;
    }); // markdown_event_more

    EventFormatter.prototype.trigger_text = (function GithubEventFormatter__trigger_text (text, triggerable) {
        if (triggerable) {
            return '<a href="#" class="collapsible-trigger">' + text + '</a>';
        } else {
            return text;
        }
    }); // trigger_text

    EventFormatter.prototype.more = (function GithubEventFormatter__more (html) {
        var more = '<div data-role="collapsible" data-content-theme="d" data-corners="false" data-mini="true" class="event-more"><h3>More</h3>';
        more += html;
        more += '</div>';
        return more;
    }); // more

    EventFormatter.prototype.description_fetcher = (function GithubEventFormatter__description_fetcher (event, source, repo) {
        var desc, repository;
        if (!repo) { repo = event.repository; }
        if (repo.full_name && (!source.path || repo.full_name != source.path)) {
            repository = App.Models.repository.get(repo.full_name + '@github', this.provider.controller);
            if (typeof(repo.description) != 'undefined') {
                repository.update_data('details', repo);
            }
            desc = 'Description: ';
            if (repository.details && repository.details.description) {
                desc += '<strong>' + this.provider.controller.display.escape_html(repository.details.description) + '</strong>';
            } else if (repository.details_fetched) {
                desc += '<em>no description</em>';
            } else {
                desc += '<a href="#" class="fetch-desc-trigger" data-repository="' + repository.id + '">click to fetch</a>';
            }
        }
        return desc;
    }); // description_fetcher

    EventFormatter.prototype.format_external_link = (function GithubEventFormatter__format_external_link (href) {
        var html = '<a class="ui-li-link-alt ui-btn ui-btn-icon-notext ui-btn-up-c" data-theme="c" href="' + href + '" target="_blank">';
        html += '<span class="ui-btn ui-btn-icon-notext">';
        html += '<span class="ui-btn-inner">';
        html += '<span class="ui-icon ui-icon-arrow-r">&nbsp;</span>';
        html += '</span>';
        html += '</span>';
        html += '</a>';
        return html;
    }); // format_external_link

    EventFormatter.prototype.CommitCommentEvent = (function GithubEventFormatter__CommitCommentEvent (event, source) {
        var part = this.trigger_text('commented', event.comment.body) +  ' a commit on';
        return this.base_format(event, source, part, null, null, event.comment.html_url);
    }); // CommitCommentEvent

    EventFormatter.prototype.more_CommitCommentEvent = (function GithubEventFormatter__more_CommitCommentEvent (event, source) {
        return this.more(this.markdown_event_more(event.comment.body));
    }); // more_CommitCommentEvent

    EventFormatter.prototype.CreateEvent = (function GithubEventFormatter__CreateEvent (event, source) {
        var part = 'created', desc, link;
        switch( event.ref_type) {
            case 'branch':
                part += ' a branch on';
                desc = 'Branch: <strong>' + event.ref + '</strong>';
                link = 'https://github.com/' + event.repository.full_name + '/tree/' + event.ref;
                break;
            case 'repository':
                if (event.description) {
                    desc = 'Description: <strong>' + event.description + '</strong>';
                }
                link = 'https://github.com/' + event.repository.full_name;
                break;
            case 'tag':
                part += ' a tag on';
                desc = 'Tag: <strong>' + event.ref + '</strong>';
                link = 'https://github.com/' + event.repository.full_name + '/tree/' + event.ref;
                break;
        }
        return this.base_format(event, source, part, desc, null, link);
    }); // CreateEvent

    EventFormatter.prototype.DeleteEvent = (function GithubEventFormatter__DeleteEvent (event, source) {
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

    }); // DeleteEvent

    EventFormatter.prototype.DownloadEvent = (function GithubEventFormatter__DownloadEvent (event, source) {
    }); // DownloadEvent

    EventFormatter.prototype.FollowEvent = (function GithubEventFormatter__FollowEvent (event, source) {
        var target = this.format_actor(event.target, source);
        return this.base_format(event, source, 'started following', null, target);
    }); // FollowEvent

    EventFormatter.prototype.ForkEvent = (function GithubEventFormatter__ForkEvent (event, source) {
        var part = this.trigger_text('forked', event.forkee),
            desc = this.description_fetcher(event, source, event.forkee);
        return this.base_format(event, source, part, desc);
    }); // ForkEvent

    EventFormatter.prototype.more_ForkEvent = (function GithubEventFormatter__more_ForkEvent (event, source) {
        return this.more('<p>Fork: ' + this.format_repo(event.forkee, event.actor, source, null, true) + '</p>');
    }); // more_ForkEvent

    EventFormatter.prototype.ForkApplyEvent = (function GithubEventFormatter__ForkApplyEvent (event, source) {
        return this.base_format(event, source, 'applied the fork queue to');
    }); // ForkApplyEvent

    EventFormatter.prototype.GistEvent = (function GithubEventFormatter__GistEvent (event, source) {
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
    }); // GistEvent

    EventFormatter.prototype.GollumEvent = (function GithubEventFormatter__GollumEvent (event, source) {
        var target = this.format_repo(event.repository, event.actor, source),
            part = this.trigger_text('edited', true) + ' the ' + target + ' wiki',
            link = 'https://github.com/' + event.repository.full_name + '/wiki';
        return this.base_format(event, source, part, null, ' ', link);
    }); // GollumEvent

    EventFormatter.prototype.more_GollumEvent = (function GithubEventFormatter__more_GollumEvent (event, source) {
        var more = '<ul data-role="listview" data-theme="d">';
        for (var i=0; i<event.pages.length; i++) {
            var page = event.pages[i];
            more += '<li>';
            more += '<em>' + page.title + '</em> — <strong>' + page.action + '</strong>';
            more += '</li>';
        }
        more += '</ul>';
        return this.more(more);
    }); // more_GollumEvent

    EventFormatter.prototype.IssueCommentEvent = (function GithubEventFormatter__IssueCommentEvent (event, source) {
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
    }); // IssueCommentEvent

    EventFormatter.prototype.more_IssueCommentEvent = (function GithubEventFormatter__more_IssueCommentEvent (event, source) {
        return this.more(this.markdown_event_more(event.comment.body));
    }); // more_IssueCommentEvent

    EventFormatter.prototype.IssuesEvent = (function GithubEventFormatter__IssuesEvent (event, source) {
        var part = event.action + ' an ' + this.trigger_text('issue', event.issue.body) + ' on',
            desc = 'Issue <strong>#' + event.issue.number + ' - ' + event.issue.title + '</strong>';
        return this.base_format(event, source, part, desc, null, event.issue.html_url);
    }); // IssuesEvent

    EventFormatter.prototype.more_IssuesEvent = (function GithubEventFormatter__more_IssuesEvent (event, source) {
        return this.more(this.markdown_event_more(event.issue.body));
    }); // more_IssuesEvent

    EventFormatter.prototype.MemberEvent = (function GithubEventFormatter__MemberEvent (event, source) {
        var part = event.action + ' ';
        part += this.format_actor(event.member, source);
        part += ' as a member ' + (event.action == 'added' ? 'to' : 'from');
        return this.base_format(event, source, part);
    }); // MemberEvent

    EventFormatter.prototype.PublicEvent = (function GithubEventFormatter__PublicEvent (event, source) {
        return this.base_format(event, source, 'open sourced');
    }); // PublicEvent

    EventFormatter.prototype.PullRequestEvent = (function GithubEventFormatter__PullRequestEvent (event, source) {
        var part = event.action + ' a ' + this.trigger_text('pull request', event.pull_request.body) + ' on',
            desc = 'Pull request <strong>#' + event.pull_request.number + ' - ' + event.pull_request.title + '</strong>';
        return this.base_format(event, source, part, desc, null, event.pull_request.html_url);
    }); // PullRequestEvent

    EventFormatter.prototype.more_PullRequestEvent = (function GithubEventFormatter__more_PullRequestEvent (event, source) {
        return this.more(this.markdown_event_more(event.pull_request.body));
    }); // more_PullRequestEvent

    EventFormatter.prototype.PullRequestReviewCommentEvent = (function GithubEventFormatter__PullRequestReviewCommentEvent (event, source) {
        var part = this.trigger_text('commented', event.comment.body) + ' a pull request on',
            desc;
        if (event.pull_request.number) {
            desc = 'Pull request <strong>#' + event.pull_request.number + '</strong>';
        }
        return this.base_format(event, source, part, desc, null, event.comment.html_url);
    }); // PullRequestReviewCommentEvent

    EventFormatter.prototype.more_PullRequestReviewCommentEvent = (function GithubEventFormatter__more_PullRequestReviewCommentEvent (event, source) {
        return this.more(this.markdown_event_more(event.comment.body));
    });

    EventFormatter.prototype.PushEvent = (function GithubEventFormatter__PushEvent (event, source) {
        var part = 'pushed ' + (event.size ? this.trigger_text(event.size + ' commit' + (event.size > 1 ? 's' : ''), true) : '') + ' to',
            desc, link;
            if (event.ref && event.ref.indexOf('refs/heads/') === 0) {
                desc = 'Branch: <strong>' + event.ref.replace('refs/heads/', '') + '</strong>';
            }
            if (event.size == 1) {
                link = 'https://github.com/' + event.repository.full_name + '/commit/' + event.commits[0].sha;
            } else if (event.before && event.head) {
                link = 'https://github.com/' + event.repository.full_name + '/compare/' + event.before + '...' + event.head;
            }
        return this.base_format(event, source, part, desc, null, link);
    }); // PushEvent

    EventFormatter.prototype.more_PushEvent = (function GithubEventFormatter__more_PushEvent (event, source) {
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
    }); // more_PushEvent

    EventFormatter.prototype.TeamAddEvent = (function GithubEventFormatter__TeamAddEvent (event, source) {
    }); // TeamAddEvent

    EventFormatter.prototype.WatchEvent = (function GithubEventFormatter__WatchEvent (event, source) {
        var part = event.action + ' watching',
            desc = this.description_fetcher(event, source);
        return this.base_format(event, source, part, desc);
    }); // WatchEvent



    var Provider = (function Github__constructor (controller) {
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
    }); // Provider

    Provider.prototype.get_user = (function Github__get_user (username) {
        return new Gh3.User(username);
    }); // get_user

    Provider.prototype.get_repo = (function Github__get_repo (path) {
        var parts = path.split('/');
        return new Gh3.Repository(parts[1], this.get_user(parts[0]));
    }); // get_repo

    Provider.prototype.map_type = {accounts: 'account', repositories: 'repository', events: 'event'};
    Provider.prototype.decorate_collback = (function Github__decorate_collback (callback, name, type) {
        var provider = this;
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
                        final_data = _.map(data[name].getAll(), provider['map_' + provider.map_type[type]], provider);
                        break;
                    default:
                        final_data = data[name].getAll();
                }
            }
            callback(err, err ? null : final_data);
        };
    }); // decorate_collback

    Provider.prototype.map = (function Github__map (data, mapping) {
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
    }); // map

    Provider.prototype.account_mapping = {
        _: ['login', 'type', 'avatar_url', 'name', 'created_at', 'company', 'location', 'email', 'blog', 'public_repos', 'followers_count', 'following_count', 'contributions'],
        blog: 'site',
        public_repos: 'repos_count'
    };

    Provider.prototype.map_account = (function Github__map_account (data) {
        var result = {};
        if (data) {
            result = this.map(data, this.account_mapping);
        }
        return result;
    }); // map_account

    Provider.prototype.repository_mapping = {
        _: ['name', 'full_name', 'description', 'pushed_at', 'created_at', 'updated_at', 'forks_count', 'fork', 'watchers_count', 'language'],
        fork: 'is_fork'
    };

    Provider.prototype.map_repository = (function Github__map_repository (data) {
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
    }); // map_repository

    Provider.prototype.map_event = (function Github__map_event (data) {
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
                    if (payload.forkee && isNaN(payload.forkee)) {
                        event.forkee = this.map_repository(payload.forkee);
                    }
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
            event.actor = this.map(data.actor, {_:['login', 'avatar_url']});
            event.repository = this.map(data.repository || data.repo, {_:['name', 'full_name']});
            if (event.repository && (event.repository.full_name || event.repository.name)) {
                // the full_name (path) must be stored in full_name, not name
                if (!event.repository.full_name && event.repository.name) {
                    event.repository.full_name = event.repository.name;
                    event.repository.name = null;
                }
                // when creating a repo, the description is in the event, not the repo itself
                if (event.type == 'CreateEvent' && event.ref_type == 'repository' && event.description) {
                    event.repository.description = event.description;
                }
            }

        }

        return event;
    }); // map_event

    Provider.prototype.get_account_details = (function Github__get_account_details (username, callback, params) {
        var provider = this;
        function map_callback(error, data) {
            if (!error && data) {
                data = provider.map_account(data);
            }
            return callback(error, data);
        }
        this.get_user(username).fetch(map_callback, params);
    }); // get_account_details

    Provider.prototype.get_account_repositories = (function Github__get_account_repositories (username, callback, params) {
        this.get_user(username).repositories.fetch(this.decorate_collback(callback, 'repositories', 'repositories'), params);
    }); // get_account_repositories

    Provider.prototype.get_account_stars = (function Github__get_account_stars (username, callback, params) {
        this.get_user(username).starred.fetch(this.decorate_collback(callback, 'starred', 'repositories'), params);
    }); // get_account_stars

    Provider.prototype.get_account_own_events = (function Github__get_account_own_events (username, callback, params) {
        this.get_user(username).events.fetch(this.decorate_collback(callback, 'events', 'events'), params);
    }); // get_account_own_events

    Provider.prototype.get_account_received_events = (function Github__get_account_received_events (username, callback, params) {
        this.get_user(username).received_events.fetch(this.decorate_collback(callback, 'received_events', 'events'), params);
    }); // get_account_received_events

    Provider.prototype.get_account_followers = (function Github__get_account_followers (username, callback, params) {
        this.get_user(username).followers.fetch(this.decorate_collback(callback, 'followers', 'accounts'), params);
    }); // get_account_followers

    Provider.prototype.get_account_following = (function Github__get_account_following (username, callback, params) {
        this.get_user(username).following.fetch(this.decorate_collback(callback, 'following', 'accounts'), params);
    }); // get_account_following

    Provider.prototype.get_account_org_members = (function Github__get_account_org_members (username, callback, params) {
        this.get_user(username).members.fetch(this.decorate_collback(callback, 'members', 'accounts'), params);
    }); // get_account_org_members

    Provider.prototype.get_account_orgs = (function Github__get_account_orgs (username, callback, params) {
        this.get_user(username).orgs.fetch(this.decorate_collback(callback, 'orgs', 'accounts'), params);
    }); // get_account_orgs

    Provider.prototype.get_repository_details = (function Github__get_repository_details (path, callback, params) {
        var provider = this;
        function map_callback(error, data) {
            if (!error && data) {
                data = provider.map_repository(data);
            }
            return callback(error, data);
        }
        this.get_repo(path).fetch(map_callback, params);
    }); // get_repository_details

    Provider.prototype.get_repository_readme = (function Github__get_repository_readme (path, callback, params) {
        this.get_repo(path).fetchReadme(this.decorate_collback(callback, 'readme', 'field'), params);
    }); // get_repository_readme

    Provider.prototype.get_repository_activity = (function Github__get_repository_activity (path, callback, params) {
        this.get_repo(path).events.fetch(this.decorate_collback(callback, 'events', 'events'), params);
    }); // get_repository_activity

    Provider.prototype.get_repository_forks = (function Github__get_repository_forks (path, callback, params) {
        this.get_repo(path).forks.fetch(this.decorate_collback(callback, 'forks', 'repositories'), params);
    }); // get_repository_forks

    Provider.prototype.get_repository_stars = (function Github__get_repository_stars (path, callback, params) {
        this.get_repo(path).stargazers.fetch(this.decorate_collback(callback, 'stargazers', 'accounts'), params);
    }); // get_repository_stars

    Provider.prototype.get_repository_contributors = (function Github__get_repository_contributors (path, callback, params) {
        this.get_repo(path).contributors.fetch(this.decorate_collback(callback, 'contributors', 'accounts'), params);
    }); // get_repository_contributors

    if (!App.Providers) { App.Providers = {}; }
    App.Providers.github = Provider;

})(Reposio);
