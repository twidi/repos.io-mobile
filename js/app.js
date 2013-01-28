var Reposio = (function() {

    var Providers = {}

    Providers['github'] = function(controller) {
        this.name = 'github';
        this.engine = new Github(typeof providers_config == 'undefined' ? {} : providers_config.github);
        this.user = this.engine.getUser();
    };

    Providers['github'].prototype.get_repo = function(path) {
        var parts = path.split('/');
        return this.engine.getRepo(parts[0], parts[1]);
    }

    Providers['github'].prototype.get_account_details = function(username, callback) {
        this.user.show(username, callback);
    };

    Providers['github'].prototype.get_account_repositories = function(username, callback) {
        this.user.userRepos(username, callback);
    };

    Providers['github'].prototype.get_account_stars = function(username, callback) {
        this.user.userStars(username, callback);
    };

    Providers['github'].prototype.get_account_own_events = function(username, callback) {
        this.user.userEvents(username, callback);
    };

    Providers['github'].prototype.get_account_received_events = function(username, callback) {
        this.user.userReceivedEvents(username, callback);
    };

    Providers['github'].prototype.get_repository_details = function(path, callback) {
        var repo = this.get_repo(path);
        repo.show(function(err, data) {
            if (err) { return callback(err, {}); }
            repo.readme(function(err, readme) {
                if (err) { return callback(err, {}); }
                data.readme = readme;
                callback(null, data);
            });
        });
    };

    Providers['github'].prototype.get_repository_activity = function(path, callback) {
        this.get_repo(path).events(callback);
    };


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
    };

    Account.prototype.fetch = function(type, callback) {
        var that = this;
        if (that[type] === null) {
            that.controller.account.provider['get_account_' + type](that.username, function(err, data) {
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


    var Repository = function(id, controller) {
        var parts = id.split('@');
        this.id = id;
        this.path = parts[0];
        this.href_id = this.id.replace('/', ':');

        this.provider = controller.providers[parts[1]];

        this.controller = controller;

        this.details = null;
        this.activity = null;
    };

    Repository.prototype.fetch = function(type, callback) {
        var that = this;
        if (that[type] === null) {
            that.controller.repository.provider['get_repository_' + type](that.path, function(err, data) {
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


    var Display = function(controller) {
        this.controller = controller;
        this.nodes = {};
    };

    Display.prototype.init = function() {
        // cache some page nodes
        var page_name, full_name, links, page, header;
        for (var obj_type in this.pages) {
            this.nodes[obj_type] = {};
            for (var page_index in this.pages[obj_type]) {
                page_name = this.pages[obj_type][page_index];
                full_page_name = obj_type + '_' + page_name
                page = $('#' + full_page_name);
                this.nodes[obj_type][full_page_name] = {
                    links: $('a.' + full_page_name + '-link'),
                    page: page,
                    header: page.find(':jqmData(role=header)').find('h3'),
                    content: page.children(":jqmData(role=content)")
                };
            }
        }

        this.init_events();
    };

    Display.prototype.pages = {
        account: ['home', 'activity', 'repositories', 'stars', 'events'],
        repository: ['home', 'activity']
    }

    Display.prototype.change_account = function() {
        for (var page_name in this.nodes.account) {
            var links = this.nodes.account[page_name].links;
            for (var i=0; i<links.length; i++) {
                var link = $(links[i]),
                    href = '#' + page_name + '?account=' + this.controller.account.id;
                link.attr('href', href);

            }
            this.nodes.account[page_name].header.html(this.controller.account.id);
            this.nodes.account[page_name].content.html(' ');
        }
    };

    Display.prototype.change_repository = function() {
        for (var page_name in this.nodes.repository) {
            var links = this.nodes.repository[page_name].links;
            for (var i=0; i<links.length; i++) {
                var link = $(links[i]),
                    href = '#' + page_name + '?repository=' + this.controller.repository.href_id;
                link.attr('href', href);

            }
            this.nodes.repository[page_name].header.html(this.controller.repository.id);
            this.nodes.repository[page_name].content.html(' ');
        }
    };

    Display.prototype.init_events = function() {
        var that = this;
        $(document).on("pagebeforechange", function(e, data) {
            if (typeof data.toPage !== "string") { return; }
            if (data.options.dataUrl) {
                data.options.dataUrl = data.options.dataUrl.replace('?', qs_separator);
            }
            that.on_before_page_change(e, data);
        });
        $(document).on("pagechange", function() {

            if ($.mobile.activePage && $.mobile.activePage.hasClass('current_page') && !$.mobile.activePage.hasClass('page_loaded')) {
                $.mobile.loading('show');
            }
        });
    };

    Display.prototype.on_before_page_change = function(e, data) {
        var url = $.mobile.path.parseUrl(data.toPage),
            page_ok = false,
            page, type, obj;

        if (url.hash && data.options) {
            page = url.hash.slice(1);
            for (var obj_type in this.pages) {
                if (page.indexOf(obj_type + '_') == 0) {
                    type = obj_type;
                    break;
                }
            }
            if (type && data.options.pageData && data.options.pageData[type]) {
                page = page.slice(type.length+1);
                if (this.pages[type].indexOf(page) !== -1) {
                    obj = data.options.pageData[type];
                    page_ok = true;
                }
            }
        }

        if (page_ok) {
            $.mobile.loading('show');
            this.controller['on_' + type + '_page_before_load'](obj, page);
        } else if (type || !$(url.hash).length) {
            $.mobile.changePage($('#home'));
            e.preventDefault();
        }
    };

    Display.prototype.is_current_page = function(page, obj) {
        return page.hasClass('current_page');
    }

    Display.prototype.render_page = function(type, name, obj) {
        var full_name = type + '_' + name,
            page = $('#' + full_name);
        if (!this.is_current_page(page, obj)) { return; }
        var content = this.nodes[type][full_name].content,
            markup = this['get_markup_for_' + full_name](obj);
        
        content.html(markup);
        page.page();
        content.find(":jqmData(role=listview)").listview();

        $.mobile.loading('hide');
        page.addClass('page_loaded');        
    }

    Display.prototype.get_markup_for_repositories = function(repositories) {
        var markup = "<ul data-role='listview'>";

        for (var i=0; i<repositories.length; i++) {
            var repository = repositories[i],
                path = repository.full_name || repository.name;
            markup += '<li>';
            markup += '<a href="#repository_home?repository=' + path.replace('/', ':') + '@github">' ;
            markup += '<h4>' + path;
            if (repository.fork) {
                markup += '<span> - fork</span>'
            }
            markup += '</h4>';
            if (repository.description) {
                markup += '<p class="repo-desc">' + repository.description + '</p>';
            }
            markup += '</a>';
            markup += '</li>';
        }

        markup += "</ul>";

        return markup;
    }

    Display.prototype.get_markup_for_account_home = function(account) {
        var markup = '<p><img src="' + account.details.avatar_url + '" /></p><p><strong>' + account.username + '</strong> (<strong>' + account.details.name + '</strong>) est sur <strong>' + account.provider.name + '</strong></p>';
        return markup;
    }

    Display.prototype.get_markup_for_account_repositories = function(account) {
        var markup = this.get_markup_for_repositories(account.repositories);
        return markup;
    };

    Display.prototype.get_markup_for_account_stars = function(account) {
        var markup = this.get_markup_for_repositories(account.stars);
        return markup;
    };

    Display.prototype.get_markup_for_account_activity = function(account) {
        var markup = "<ul data-role='listview'>";
        for (var i=0; i<account.own_events.length; i++) {
            var entry = account.own_events[i];
            markup += '<li>' + entry.actor.login + ' | ' + entry.type.replace('Event', '').toLowerCase() + ' | ' + entry.repo.name + '</li>';
        }
        markup += "</ul>";

        return markup;
    };

    Display.prototype.get_markup_for_account_events = function(account) {
        var markup = "<ul data-role='listview'>";
        for (var i=0; i<account.received_events.length; i++) {
            var entry = account.received_events[i];
            markup += '<li>' + entry.actor.login + ' | ' + entry.type.replace('Event', '').toLowerCase() + ' | ' + entry.repo.name + '</li>';
        }
        markup += "</ul>";

        return markup;
    };

    Display.prototype.get_markup_for_repository_home = function(repository) {
        var markup = '<p><strong>' + repository.path + '</strong> est sur <strong>' + repository.provider.name + '</strong></p>';
        if (repository.details.fork) {
            markup += '<p><em>Fork ok <strong>' + repository.details.parent.full_name + '</strong></em></p>'
        }
        if (repository.details.readme) {
            markup += '<hr /><div class="readme-container">' + repository.details.readme + '</div>';
        }
        return markup;
    }

    Display.prototype.get_markup_for_repository_activity = function(repository) {
        var markup = "<ul data-role='listview'>";
        for (var i=0; i<repository.activity.length; i++) {
            var entry = repository.activity[i];
            markup += '<li>' + entry.actor.login + ' | ' + entry.type.replace('Event', '').toLowerCase();
        }
        markup += "</ul>";

        return markup;
    };

    Display.prototype.confirm_new_fech = function(error) {
        $.mobile.loading('hide');
        error = error || 'undefined error';
        var result = confirm('Unable to fetch (' + error + '), retry ?');
        if (result) {
            $.mobile.loading('show');
        } else {
            history.go(-1);
        }
        return result;
    };


    var Controller = function() {
        this.providers = {
            github: new Providers['github'](this)
        };
        this.account = null;
        this.repository = null;
        this.display = new Display(this);
    };

    Controller.prototype.mapping = {
        account: {
            // page : object method
            home: 'details',
            repositories: 'repositories',
            stars: 'stars',
            activity: 'own_events',
            events: 'received_events'
        },
        repository: {
            home: 'details',
            activity: 'activity'
        }
    }

    Controller.prototype.init = function() {
        this.display.init();
        this.init_events();
    };

    Controller.prototype.set_account = function(account_id) {
        var changed = (this.account == null || this.account.id != account_id);
        if (changed) {
            this.account = new Account(account_id, this);
            this.display.change_account();
        }
        return changed;
    };

    Controller.prototype.set_repository = function(repository_id) {
        var changed = (this.repository == null || this.repository.id != repository_id);
        if (changed) {
            this.repository = new Repository(repository_id, this);
            this.display.change_repository();
        }
        return changed;
    };

    Controller.prototype.on_account_page_before_load = function(account_id, page) {
        var that = this,
            changed = this.set_account(account_id),
            account = this.account,
            render = function() { that.display.render_page('account', page, account); },
            fetch_type = this.mapping.account[page];

        $('.current_page, .page_loaded').removeClass('current_page, page_loaded');
        $('#account_' + page).addClass('current_page');
        this.account.fetch(fetch_type, render);
    };

    Controller.prototype.on_repository_page_before_load = function(repository_id, page) {
        repository_id = repository_id.replace(':', '/');
        var that = this,
            changed = this.set_repository(repository_id),
            repository = this.repository,
            render = function() { that.display.render_page('repository', page, repository); },
            fetch_type = this.mapping.repository[page];

        $('.current_page, .page_loaded').removeClass('current_page, page_loaded');
        $('#repository_' + page).addClass('current_page');
        this.repository.fetch(fetch_type, render);
    };

    Controller.prototype.fetch_error = function(error, obj, fetch_type, original_callback) {
        if (this.display.confirm_new_fech(error.error)) {
            obj.fetch(fetch_type, original_callback);
        }
    };

    Controller.prototype.init_events = function() {
    };

    var controller = new Controller();

    $(document).ready(function() {
        controller.init();
    });

    return controller;
})();
