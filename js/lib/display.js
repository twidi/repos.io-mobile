Reposio.Display = (function() {


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

    Display.prototype.format_date = function(str_date, show_time, show_seconds, time_only) {
        if (!str_date) { return '' };
        var parts = str_date.split('T');
        if (show_time) {
            var time = parts[1].slice(0, show_seconds ? 8 : 5);
            return (time_only ? '' : parts[0] + ' ') + time;
        } else {
            return parts[0];
        }
    };

    Display.prototype.pages = {
        account: ['home', 'activity', 'repositories', 'stars', 'events', 'following', 'followers'],
        repository: ['home', 'activity', 'forks']
    };

    Display.prototype.change_account = function() {
        $('.repos-count').hide();
        $('.followers-count').hide();
        $('.following-count').hide();
        for (var page_name in this.nodes.account) {
            var links = this.nodes.account[page_name].links;
            for (var i=0; i<links.length; i++) {
                var link = $(links[i]),
                    href = '#' + page_name + '!account=' + this.controller.account.id;
                link.attr('href', href);

            }
            this.nodes.account[page_name].header.html(this.controller.account.id);
            this.nodes.account[page_name].content.html(' ');
            this.nodes.account[page_name].page.removeData('current-for');
        }
    };

    Display.prototype.change_repository = function() {
        $('.forks-count').hide();
        for (var page_name in this.nodes.repository) {
            var links = this.nodes.repository[page_name].links;
            for (var i=0; i<links.length; i++) {
                var link = $(links[i]),
                    href = '#' + page_name + '!repository=' + this.controller.repository.href_id;
                link.attr('href', href);

            }
            this.nodes.repository[page_name].header.html(this.controller.repository.id);
            this.nodes.repository[page_name].content.html(' ');
            this.nodes.repository[page_name].page.removeData('current-for');
        }
    };

    Display.prototype.init_events = function() {
        var that = this;
        $(document).on("pagebeforechange", function(e, data) {
            if (typeof data.toPage !== "string") { return; }
            if (data.options.dataUrl) {
                data.options.dataUrl = data.options.dataUrl.replace('?', '!');
            }
            that.on_before_page_change(e, data);
        });
        $(document).on("pagechange", function() {

            if ($.mobile.activePage && $.mobile.activePage.hasClass('current_page') && !$.mobile.activePage.hasClass('page_loaded')) {
                $.mobile.loading('show');
            }
        });
        $('.nav-menu').on("popupafterclose", function() {
            // restore previous active link in navbar when closing popup menu
            var menu = $(this),
                link = $(this).find('a.ui-btn-active'),
                href, parent;
            if (link.length) {
                parent = menu.parents('.ui-page');
                if (parent.length) {
                    href = link.attr('href');
                    parent.find('.ui-header .ui-navbar a[href="' + href + '"]').addClass('ui-btn-active');
                }
            }
        });
        $(document).on('click', '.list-events a.collapsible-trigger', function(e) {
            // open/close collapsible when clicking triggering links in list of events
            e.preventDefault();
            e.stopPropagation();
            var link = $(this),
                collapsible = link.data('collapsible'),
                opened =link.data('opened') || false;
            if (!collapsible) {
                collapsible =  link.parents('li').find('.ui-collapsible');
                link.data('collapsible', collapsible);
            }
            collapsible.trigger(opened ? 'collapse' : 'expand');
            link.data('opened', !opened);
            return false;
        });
        $(document).on('click', 'li.with-extension', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).toggleClass('extended');
            return false;
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
        if (!page.hasClass('current_page')) { return false ;}
        var current_for = page.data('current-for');
        if (current_for && current_for != obj.id) { return false; }
        return true;
    };

    Display.prototype.is_page_for = function(page, obj) {
        var current_for = page.data('current-for');
        if (current_for && current_for == obj.id) { return true; }
        return false;
    };

    Display.prototype.render_page = function(type, name, obj) {
        var full_name = type + '_' + name,
            page = $('#' + full_name);
        if (!this.is_current_page(page, obj)) { return; }
        var content = this.nodes[type][full_name].content,
            markup = this['get_markup_for_' + full_name](obj);
        
        content.html(markup);
        page.page();
        content.find(":jqmData(role=listview)").listview();
        content.find(":jqmData(role=collapsible-set)").collapsibleset();
        content.find(":jqmData(role=collapsible)").collapsible();
        content.find(":jqmData(role=button)").button();
        content.find(":jqmData(role=table)").table();

        page.data('current-for', obj.id);
        this.post_render_page(page);
    };

    Display.prototype.post_render_page = function(page) {
        $.mobile.loading('hide');
        page.addClass('page_loaded');
    };

    Display.prototype.account_link = function(user_name, provider_name) {
        return '<a class="mini-button" data-role="button" data-inline="true" data-mini="true" data-theme="a" href="#account_home!account=' + user_name + '@' + provider_name + '">' + user_name + '</a>'        
    };

    Display.prototype.repository_link = function(full_name, repo_name, provider_name) {
        full_name = full_name.replace('/', ':');
        return '<a class="mini-button" data-role="button" data-inline="true" data-mini="true" data-theme="b" href="#repository_home!repository=' + full_name + '@' + provider_name + '">' + repo_name + '</a>';
    };

    Display.prototype.get_markup_for_repositories = function(repositories, provider) {
        var markup = "<ul data-role='listview' class='repos-list'>";

        for (var i=0; i<repositories.length; i++) {
            var repository = repositories[i],
                path = repository.full_name || repository.name;
            markup += '<li>';
            markup += '<a href="#repository_home!repository=' + path.replace('/', ':') + '@' + provider.name +'">' ;
            markup += '<h4>' + path + '</h4>';
            if (repository.description) {
                markup += '<p class="repo-desc">' + repository.description + '</p>';
            }
            if (repository.fork) {
                markup += '<p class="ui-li-aside ui-btn-up-e ui-btn-corner-all fork">fork</p>'
            }
            if (repository.pushed_at) {
                markup += '<p class="last-push">Last push: ' + this.format_date(repository.pushed_at, true) + '</p>';
            }
            markup += '</a>';
            markup += '</li>';
        }

        markup += "</ul>";

        return markup;
    };

    Display.prototype.get_markup_for_accounts = function(accounts, provider) {
        var markup = "<ul data-role='listview' class='accounts-list'>";

        for (var i=0; i<accounts.length; i++) {
            var account = accounts[i];
            markup += '<li>';
            markup += '<a href="#account_home!account=' + account.login + '@' + provider.name +'">' ;
            markup += '<img src="' + account.avatar_url + '" />';
            markup += account.login;
            markup += '</a>';
            markup += '</li>';
        }

        markup += "</ul>";

        return markup;
    };

    Display.prototype.get_markup_for_events = function(events) {
        var markup = '<ul class="ui-listview list-events" data-mobile-listview=\'{"options":{}}\'>',  // data needed to prevent a bug in listview filter plugin
            cur_day = null;
        for (var i=0; i<events.length; i++) {
            if (events[i].day != cur_day) {
                markup += '<li class="ui-li ui-li-divider ui-bar-d">' + events[i].day + '</li>';
                cur_day = events[i].day;
            }
            markup += '<li class="ui-li ui-li-static ui-btn-up-c' + (i == events.length - 1 ? ' ui-last-child' : '') + '">' + events[i].str + '</li>';
        }
        markup += "</ul>";

        return markup;
    };

    Display.prototype.get_markup_for_account_home = function(account) {
        var markup = '<ul data-role="listview" data-theme="e" class="account-main"><li>';
        markup += '<img src="' + account.details.avatar_url + '" />';
        markup += '<h3>' + account.username + '</h3>';
        if (account.details.name) {
            markup += '<p>' + account.details.name + '</p>';
        }
        markup += '<p class="ui-li-aside ui-btn-up-c ui-btn-corner-all provider">' + account.provider.name + '</p>'
        markup += '</li></ul>';
        markup += '<ul data-role="listview" data-theme="d" class="account-details">';
        if (account.details.company) {
            markup += '<li class="ui-li-has-icon"><span class="ui-li-icon ui-icon ui-icon-gear ui-icon-shadow"></span>' + account.details.company + '</li>'
        }
        if (account.details.location) {
            markup += '<li class="ui-li-has-icon"><span class="ui-li-icon ui-icon ui-icon-mappin ui-icon-shadow"></span>' + account.details.location + '</li>'
        }
        if (account.details.email && account.details.email.indexOf('@') !== -1) {
            markup += '<li class="ui-li-has-icon"><span class="ui-li-icon ui-icon ui-icon-email ui-icon-shadow"></span>' + account.details.email + '</li>'
        }
        markup += '<li class="ui-li-has-icon"><span class="ui-li-icon ui-icon ui-icon-calendar ui-icon-shadow"></span>Since ' + this.format_date(account.details.created_at) + '</li>'
        if (account.details.blog) {
            markup += '<li class="ui-li-has-icon"><span class="ui-li-icon ui-icon ui-icon-link ui-icon-shadow"></span><a href="' + account.details.blog + '">' + account.details.blog + '</a></li>'
        }
        markup += '</ul>'
        return markup;
    };

    Display.prototype.get_markup_for_account_repositories = function(account) {
        var markup = this.get_markup_for_repositories(account.repositories, account.provider);
        return markup;
    };

    Display.prototype.get_markup_for_account_stars = function(account) {
        var markup = this.get_markup_for_repositories(account.stars, account.provider);
        return markup;
    };

    Display.prototype.get_markup_for_account_activity = function(account) {
        var events = [];
        for (var i=0; i<account.own_events.length; i++) {
            var event = account.provider.formatter.format(account.own_events[i], account);
            if (event) { events.push(event); }
        }
        return this.get_markup_for_events(events);
    };

    Display.prototype.get_markup_for_account_events = function(account) {
        var events = [];
        for (var i=0; i<account.received_events.length; i++) {
            var event = account.provider.formatter.format(account.received_events[i], account);
            if (event) { events.push(event); }
        }
        return this.get_markup_for_events(events);
    };

    Display.prototype.get_markup_for_account_followers = function(account) {
        var markup = this.get_markup_for_accounts(account.followers, account.provider);
        return markup;
    };

    Display.prototype.get_markup_for_account_following = function(account) {
        var markup = this.get_markup_for_accounts(account.following, account.provider);
        return markup;
    };

    Display.prototype.get_markup_for_repository_home = function(repository) {
        var markup = '<ul data-role="listview" data-theme="e" class="repo-main"><li>';
        markup += '<div>';
        markup += '<strong>' + repository.details.name + '</strong>';
        markup += ' by ';
        markup += this.account_link(repository.details.owner.login, repository.provider.name);
        markup += '</strong></div>';
        if (repository.details.fork) {
            markup += '<div>Fork of <span class="repo-links">';
            markup += this.repository_link(repository.details.parent.full_name, repository.details.parent.name, repository.provider.name);
            markup += '<span> by <strong>' + repository.details.parent.owner.login + '</strong></span>';
            markup += '</span></div>';
        }
        markup += '<p class="last-push">Last push: ' + (repository.details.pushed_at ? this.format_date(repository.details.pushed_at, true) : 'never !') + '</p>';            
        markup += '<p class="ui-li-aside ui-btn-up-c ui-btn-corner-all provider">' + repository.provider.name + '</p>'
        markup += '</li></ul>';

         markup += '<div data-role="collapsible-set" data-corners="false" data-theme="c" data-content-theme="d" data-inset="false" data-mini="true">';
        if (repository.details.description) {
            markup += '<div data-role="collapsible" data-collapsed="false"><h3>Description</h3><p>' + repository.details.description + '</p></div>';
        }
        if (repository.details.readme) {
            markup += '<div data-role="collapsible"' + (repository.details.description ? '' : ' data-collapsed="false"') + '><h3>Readme</h3><div class="readme-container">' + repository.details.readme + '</div></div>';
        }
        markup += '</div>';
        return markup;
    };

    Display.prototype.get_markup_for_repository_activity = function(repository) {
        var events = [];
        for (var i=0; i<repository.activity.length; i++) {
            var event = repository.provider.formatter.format(repository.activity[i], repository);
            if (event) { events.push(event); }
        }
        return this.get_markup_for_events(events);
    };

    Display.prototype.get_markup_for_repository_forks = function(repository) {
        var markup = this.get_markup_for_repositories(repository.forks, repository.provider);
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

    Display.prototype.update_account_navbar = function(account) {
        $('.repos-count').html(account.details ? account.details.public_repos : '?').show();
        $('.followers-count').html(account.details ? account.details.followers : '?').show();
        $('.following-count').html(account.details ? account.details.following : '?').show();
    };

    Display.prototype.update_repository_navbar = function(repository) {
        $('.forks-count').html(repository.details ? repository.details.forks_count : '?').show();
    };

    return Display;

})();
