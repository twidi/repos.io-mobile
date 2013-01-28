var Reposio = (function() {

    var Providers = {}

    Providers['github'] = function(controller) {
        this.name = 'github';
        this.engine = new Github(typeof providers_config == 'undefined' ? {} : providers_config.github);
        this.user = this.engine.getUser();
    };

    Providers['github'].prototype.get_details = function(username, callback) {
        this.user.show(username, callback);
    };

    Providers['github'].prototype.get_repositories = function(username, callback) {
        this.user.userRepos(username, callback);
    };

    Providers['github'].prototype.get_stars = function(username, callback) {
        this.user.userStars(username, callback);
    };

    Providers['github'].prototype.get_own_events = function(username, callback) {
        this.user.userEvents(username, callback);
    };

    Providers['github'].prototype.get_received_events = function(username, callback) {
        this.user.userReceivedEvents(username, callback);
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
            that.controller.account.provider['get_' + type](that.username, function(err, data) {
                that[type] = data;
                callback();
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
                this.nodes[obj_type][page_name] = {
                    links: $('a.' + full_page_name + '-link'),
                    page: page,
                    header: page.find(':jqmData(role=header)').find('h3')
                };
            }
        }

        this.init_events();
    };

    Display.prototype.pages = {
        account: ['home', 'activity', 'repositories', 'stars', 'events']
    }

    Display.prototype.change_account = function() {
        for (var name in this.nodes.account) {
            var links = this.nodes.account[name].links;
            for (var i=0; i<links.length; i++) {
                var link = $(links[i]),
                    href = '#account_' + name + '?account=' + this.controller.account.id;
                link.attr('href', href);

            }
            this.nodes.account[name].header.html(this.controller.account.id);
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

    Display.prototype.render_page = function(name, obj) {
        var page = $('#'+name);
        if (!this.is_current_page(page, obj)) { return; }
        var content = page.children( ":jqmData(role=content)" ),
            markup = this['get_markup_for_'+name](obj);
        
        content.html(markup);
        page.page();
        content.find(":jqmData(role=listview)").listview();

        $.mobile.loading('hide');
        page.addClass('page_loaded');        
    }

    Display.prototype.get_markup_for_repositories = function(repositories) {
        var markup = "<ul data-role='listview'>";

        for (var i=0; i<repositories.length; i++) {
            var repository = repositories[i];
            markup += '<li>' + (repository.full_name || repository.name) + '</li>';
        }

        markup += "</ul>";

        return markup;
    }

    Display.prototype.get_markup_for_account_home = function(account) {
        var markup = '<p><img src="' + account.details.avatar_url + '" /></p><p><strong>' + account.username + '</strong> (<strong>' + account.details.name + '</strong>) est sur <strong>' + account.provider.name + '</strong>';
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

    var Controller = function() {
        this.providers = {
            github: new Providers['github'](this)
        };
        this.account = null;
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

    Controller.prototype.on_account_page_before_load = function(account_id, page) {
        var that = this,
            changed = this.set_account(account_id),
            account = this.account,
            render = function() { that.display.render_page('account_' + page, account); },
            fetch_type = this.mapping.account[page];

        $('.current_page, .page_loaded').removeClass('current_page, page_loaded');
        $('#account_' + page).addClass('current_page');
        this.account.fetch(fetch_type, render);
    };

    Controller.prototype.init_events = function() {
    };

    var controller = new Controller();

    $(document).ready(function() {
        controller.init();
    });

    return controller;
})();
