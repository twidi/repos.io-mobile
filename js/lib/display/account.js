(function(App) {

    App.Display.prototype.pages.account = [
        { id: 'home', name: 'Details',  method: 'details' },
        { id: 'repositories', name: 'Repos', count: true },
        { id: 'activity', method: 'own_events' },
        { id: 'members', method: 'org_members' },
        { id: 'stars' },
        { id: 'following', count: true },
        { id: 'followers', count: true },
        { id: 'orgs', method: 'orgs' },
        { id: 'events', method: 'received_events' }
    ];

    App.Display.prototype.change_account = function() {
        $('.account_repositories-count').hide();
        $('.account_followers-count').hide();
        $('.account_following-count').hide();
        for (var page_name in this.nodes.account) {
            var links = this.nodes.account[page_name].links;
            for (var i=0; i<links.length; i++) {
                var link = $(links[i]),
                    href = '#' + page_name + '!account=' + this.controller.account.id;
                link.attr('href', href);

            }
            this.nodes.account[page_name].header.html(this.controller.account.id);
            this.nodes.account[page_name].page.removeData('current-for');
        }
    };


    App.Display.prototype.account_link = function(user_name, provider_name) {
        return '<a class="mini-button" data-role="button" data-inline="true" data-mini="true" data-theme="a" href="#account_home!account=' + user_name + '@' + provider_name + '">' + user_name + '</a>';
    };

    App.Display.prototype.get_markup_for_accounts = function(accounts, provider, more_callback) {
        var markup = "<ul data-role='listview' class='accounts-list'>";

        for (var i=0; i<accounts.length; i++) {
            var account = accounts[i];
            markup += '<li>';
            markup += '<a href="#account_home!account=' + account.login + '@' + provider.name +'">' ;
            markup += '<img src="' + account.avatar_url + '" />';
            markup += account.login;
            if (more_callback) {
                markup += more_callback(account, provider);
            }
            markup += '</a>';
            markup += '</li>';
        }

        markup += "</ul>";

        return markup;
    };

    App.Display.prototype.views = App.Display.prototype.views || {};

    App.Display.prototype.views.account_home = {
        cache_nodes: function(display) {
            var container = display.nodes.account.account_home.content,
                nodes = display.nodes.account.account_home.nodes;

            if (!nodes) {
                nodes = display.nodes.account.account_home.nodes = {};

                var main = container.children('.account-main').children();
                nodes.avatar = main.children('img');
                nodes.provider = main.children('p.provider');
                nodes.name = main.children('p.account-name');

                var username_container = main.children('h3');
                nodes.username = username_container.children('strong');
                nodes.organization = username_container.children('span');

                nodes.infos = container.children('.account-details');

                nodes.company_container = nodes.infos.children('li.account-company');
                nodes.company = nodes.company_container.children(':last');

                nodes.location_container = nodes.infos.children('li.account-location');
                nodes.location = nodes.location_container.children(':last');

                nodes.email_container = nodes.infos.children('li.account-email');
                nodes.email = nodes.email_container.children(':last');

                nodes.created_at_container = nodes.infos.children('li.account-created_at');
                nodes.created_at = nodes.created_at_container.children(':last');

                nodes.site_container = nodes.infos.children('li.account-site');
                nodes.site = nodes.site_container.find('a');
            }

            return nodes;

        },

        reset: function(display) {
            var container = display.nodes.account.account_home.content,
                nodes = display.views.account_home.cache_nodes(display);

            nodes.username.html('loading...');
            nodes.name.html('');
            nodes.organization.hide();
            nodes.avatar.attr('src', 'https://a248.e.akamai.net/assets.github.com/images/gravatars/gravatar-user-420.png');
            nodes.infos.hide();

        },

        update: function(display, account) {
            var container = display.nodes.account.account_home.content,
            nodes = display.views.account_home.cache_nodes(display);

            nodes.username.html(account.username);
            nodes.organization.toggle(account.details.type == 'Organization');
            nodes.provider.html(account.provider.name);
            nodes.avatar.attr('src', account.details.avatar_url);

            nodes.name.html(account.details.name || '');
            nodes.name.toggle(!!account.details.name);

            nodes.company.html(account.details.company || '');
            nodes.company_container.toggle(!!account.details.company);

            nodes.location.html(account.details.location || '');
            nodes.location_container.toggle(!!account.details.location);

            var has_email = !!(account.details.email && account.details.email.indexOf('@') !== -1);
            nodes.email.html(has_email ? account.details.email : '');
            nodes.email_container.toggle(has_email);

            nodes.created_at.html(display.format_date(account.details.created_at));

            nodes.site.html(account.details.blog || '');
            nodes.site_container.toggle(!!account.details.blog);
            nodes.site.attr('href', account.details.blog || '/');

            nodes.infos.show();

            container.children('ul[data-role=listview]').listview('refresh');

        }
    };

    App.Display.prototype.views.account_repositories = {
        cache_nodes: function(display) {
            var container = display.nodes.account.account_repositories.content,
                nodes = display.nodes.account.account_repositories.nodes;

            if (!nodes) {
                nodes = display.nodes.account.account_repositories.nodes = {};

                nodes.list = container.children('ul');
            }

            return nodes;
        },

        reset: function(display) {
            var container = display.nodes.account.account_repositories.content,
                nodes = display.views.account_repositories.cache_nodes(display);

            nodes.list.empty();
        },

        update: function(display, account) {
            var container = display.nodes.account.account_repositories.content,
                nodes = display.views.account_repositories.cache_nodes(display);

            nodes.list.empty();
            nodes.list.append(display.create_repositories_list_items(account.repositories, account.provider));

            nodes.list.listview('refresh');
        }
    };

    App.Display.prototype.get_markup_for_account_stars = function(account) {
        var markup = this.get_markup_for_repositories(account.stars, account.provider);
        return markup;
    };

    App.Display.prototype.get_markup_for_account_activity = function(account) {
        var events = [];
        for (var i=0; i<account.own_events.length; i++) {
            var event = account.provider.formatter.format(account.own_events[i], account);
            if (event) { events.push(event); }
        }
        return this.get_markup_for_events(events);
    };

    App.Display.prototype.get_markup_for_account_events = function(account) {
        var events = [];
        for (var i=0; i<account.received_events.length; i++) {
            var event = account.provider.formatter.format(account.received_events[i], account);
            if (event) { events.push(event); }
        }
        return this.get_markup_for_events(events);
    };

    App.Display.prototype.get_markup_for_account_followers = function(account) {
        var markup = this.get_markup_for_accounts(account.followers, account.provider);
        return markup;
    };

    App.Display.prototype.get_markup_for_account_following = function(account) {
        var markup = this.get_markup_for_accounts(account.following, account.provider);
        return markup;
    };

    App.Display.prototype.get_markup_for_account_members = function(account) {
        var markup = this.get_markup_for_accounts(account.org_members, account.provider);
        return markup;
    };

    App.Display.prototype.get_markup_for_account_orgs = function(account) {
        var markup = this.get_markup_for_accounts(account.orgs, account.provider);
        return markup;
    };

    App.Display.prototype.update_account_navbar = function(account) {
        var is_org = (account.details && account.details.type.toLowerCase() == 'organization');
        $('.account_members-link').closest('li').toggle(is_org);
        $('.account_orgs-link').closest('li').toggle(!is_org);
        $('.account_repositories-count').html(account.details ? account.details.public_repos : '?').show();
        $('.account_followers-count').html(account.details ? account.details.followers : '?').show();
        $('.account_following-count').html(account.details ? account.details.following : '?').show();
    };

})(Reposio);
