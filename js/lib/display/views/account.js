(function(App) {

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
                nodes.infos_loading = nodes.infos.children('.failover');
                nodes.infos_items = nodes.infos.children('.ui-li-has-icon');

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

                nodes.orgs_container = container.children('.account-orgs');
            }

            return nodes;

        },

        reset: function(display) {
            var container = display.nodes.account.account_home.content,
                nodes = display.views.account_home.cache_nodes(display);

            nodes.username.html('loading...');
            nodes.name.html('');
            nodes.organization.hide();
            nodes.avatar.attr('src', 'img/default-avatar.png');
            nodes.infos_items.hide();
            nodes.infos_loading.show();

            display.clear_listview(nodes.orgs_container, 'Loading...', true);
            nodes.orgs_container.show();

        },

        update: function(display, account) {
            var container = display.nodes.account.account_home.content,
            nodes = display.views.account_home.cache_nodes(display),
            is_org = (account.details.type == 'Organization');

            if (is_org) {
                nodes.orgs_container.hide();
            }

            nodes.username.html(account.username);
            nodes.organization.toggle(is_org);
            nodes.provider.html(account.provider.name);
            nodes.avatar.attr('src', account.details.avatar_url);

            nodes.name.html(account.details.name || '');
            nodes.name.toggle(!!account.details.name);

            nodes.created_at.html(display.format_date(account.details.created_at));
            nodes.created_at_container.show();
            nodes.infos_loading.hide();

            nodes.company.html(account.details.company || '');
            nodes.company_container.toggle(!!account.details.company);

            nodes.location.html(account.details.location || '');
            nodes.location_container.toggle(!!account.details.location);

            var has_email = !!(account.details.email && account.details.email.indexOf('@') !== -1);
            nodes.email.html(has_email ? account.details.email : '');
            nodes.email_container.toggle(has_email);

            nodes.site.html(account.details.blog || '');
            nodes.site_container.toggle(!!account.details.blog);
            nodes.site.attr('href', account.details.blog || '/');


            if (!is_org) {
                var orgs_success = function() {
                    if (account.orgs && account.orgs.length) {
                        display.clear_listview(nodes.orgs_container);
                        nodes.orgs_container.append(display.create_accounts_list_items(account.orgs, account.provider));
                        nodes.orgs_container.listview('refresh');
                    } else {
                        display.clear_listview(nodes.orgs_container, 'No organizations', true);
                        nodes.orgs_container.fadeOut();
                    }
                };

                var orgs_fail = function(err) {
                    display.clear_listview(nodes.orgs_container, 'Failed to load organizations', true);
                };

                if (account.orgs === null) {
                    account.fetch_orgs(orgs_success, orgs_fail);
                } else {
                    orgs_success();
                }
            }

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


    App.Display.prototype.views.account_stars = {
        cache_nodes: function(display) {
            var container = display.nodes.account.account_stars.content,
                nodes = display.nodes.account.account_stars.nodes;

            if (!nodes) {
                nodes = display.nodes.account.account_stars.nodes = {};

                nodes.list = container.children('ul');
            }

            return nodes;
        },

        reset: function(display) {
            var container = display.nodes.account.account_stars.content,
                nodes = display.views.account_stars.cache_nodes(display);

            nodes.list.empty();
        },

        update: function(display, account) {
            var container = display.nodes.account.account_stars.content,
                nodes = display.views.account_stars.cache_nodes(display);

            nodes.list.empty();
            nodes.list.append(display.create_repositories_list_items(account.stars, account.provider));

            nodes.list.listview('refresh');
        }
    };


    App.Display.prototype.views.account_followers = {
        cache_nodes: function(display) {
            var container = display.nodes.account.account_followers.content,
                nodes = display.nodes.account.account_followers.nodes;

            if (!nodes) {
                nodes = display.nodes.account.account_followers.nodes = {};

                nodes.list = container.children('ul');
            }

            return nodes;
        },

        reset: function(display) {
            var container = display.nodes.account.account_followers.content,
                nodes = display.views.account_followers.cache_nodes(display);

            nodes.list.empty();
        },

        update: function(display, account) {
            var container = display.nodes.account.account_followers.content,
                nodes = display.views.account_followers.cache_nodes(display);

            nodes.list.empty();
            nodes.list.append(display.create_accounts_list_items(account.followers, account.provider));

            nodes.list.listview('refresh');
        }
    };


    App.Display.prototype.views.account_following = {
        cache_nodes: function(display) {
            var container = display.nodes.account.account_following.content,
                nodes = display.nodes.account.account_following.nodes;

            if (!nodes) {
                nodes = display.nodes.account.account_following.nodes = {};

                nodes.list = container.children('ul');
            }

            return nodes;
        },

        reset: function(display) {
            var container = display.nodes.account.account_following.content,
                nodes = display.views.account_following.cache_nodes(display);

            nodes.list.empty();
        },

        update: function(display, account) {
            var container = display.nodes.account.account_following.content,
                nodes = display.views.account_following.cache_nodes(display);

            nodes.list.empty();
            nodes.list.append(display.create_accounts_list_items(account.following, account.provider));

            nodes.list.listview('refresh');
        }
    };


    App.Display.prototype.views.account_members = {
        cache_nodes: function(display) {
            var container = display.nodes.account.account_members.content,
                nodes = display.nodes.account.account_members.nodes;

            if (!nodes) {
                nodes = display.nodes.account.account_members.nodes = {};

                nodes.list = container.children('ul');
            }

            return nodes;
        },

        reset: function(display) {
            var container = display.nodes.account.account_members.content,
                nodes = display.views.account_members.cache_nodes(display);

            nodes.list.empty();
        },

        update: function(display, account) {
            var container = display.nodes.account.account_members.content,
                nodes = display.views.account_members.cache_nodes(display);

            nodes.list.empty();
            nodes.list.append(display.create_accounts_list_items(account.org_members, account.provider));

            nodes.list.listview('refresh');
        }
    };


    App.Display.prototype.views.account_activity = {
        cache_nodes: function(display) {
            var container = display.nodes.account.account_activity.content,
                nodes = display.nodes.account.account_activity.nodes;

            if (!nodes) {
                nodes = display.nodes.account.account_activity.nodes = {};

                nodes.list = container.children('ul');
            }

            return nodes;
        },

        reset: function(display) {
            var container = display.nodes.account.account_activity.content,
                nodes = display.views.account_activity.cache_nodes(display);

            nodes.list.empty();
        },

        update: function(display, account) {
            var container = display.nodes.account.account_activity.content,
                nodes = display.views.account_activity.cache_nodes(display),
                events = [];

            for (var i=0; i<account.own_events.length; i++) {
                var event = account.provider.formatter.format(account.own_events[i], account);
                if (event) { events.push(event); }
            }

            nodes.list.empty();
            nodes.list.append(display.create_events_list_items(events));
            display.render_widgets(nodes.list);
        }
    };


    App.Display.prototype.views.account_events = {
        cache_nodes: function(display) {
            var container = display.nodes.account.account_events.content,
                nodes = display.nodes.account.account_events.nodes;

            if (!nodes) {
                nodes = display.nodes.account.account_events.nodes = {};

                nodes.list = container.children('ul');
            }

            return nodes;
        },

        reset: function(display) {
            var container = display.nodes.account.account_events.content,
                nodes = display.views.account_events.cache_nodes(display);

            nodes.list.empty();
        },

        update: function(display, account) {
            var container = display.nodes.account.account_events.content,
                nodes = display.views.account_events.cache_nodes(display),
                events = [];

            for (var i=0; i<account.received_events.length; i++) {
                var event = account.provider.formatter.format(account.received_events[i], account);
                if (event) { events.push(event); }
            }

            nodes.list.empty();
            nodes.list.append(display.create_events_list_items(events));
            display.render_widgets(nodes.list);
        }
    };

})(Reposio);
