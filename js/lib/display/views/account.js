(function(App) {

    App.View.views.account_home = App.View.$extend({

        __classvars__: {
            model: 'account',
            view_name: 'account_home'
        },

        cache_nodes: (function View_account_home__cache_nodes () {
            this.$super();

            var nodes = this.nodes_cache;

            var main = this.container.children('.account-main').children();
            nodes.avatar = main.children('img');
            nodes.provider = main.children('p.provider');
            nodes.name = main.children('p.account-name');

            var username_container = main.children('h3');
            nodes.username = username_container.children('strong');
            nodes.organization = username_container.children('span');

            nodes.infos = this.container.children('.account-details');
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

            nodes.orgs_container = this.container.children('.account-orgs');
        }), // cache_nodes

        reset: (function View_account_home__reset () {
            this.$super();

            var nodes = this.nodes();

            nodes.username.html('loading...');
            nodes.name.html('');
            nodes.organization.hide();
            nodes.avatar.attr('src', 'img/default-avatar.png');
            nodes.infos_items.hide();
            nodes.infos_loading.show();

            this.display.clear_listview(nodes.orgs_container, 'Loading...', true);
            nodes.orgs_container.show();
        }), // reset

        update: (function View_account_home__update (account, force) {
            var nodes = this.nodes(),
                that = this,
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

            nodes.created_at.html(this.display.format_date(account.details.created_at));
            nodes.created_at_container.show();
            nodes.infos_loading.hide();

            nodes.company.html(account.details.company || '');
            nodes.company_container.toggle(!!account.details.company);

            nodes.location.html(account.details.location || '');
            nodes.location_container.toggle(!!account.details.location);

            var has_email = !!(account.details.email && account.details.email.indexOf('@') !== -1);
            nodes.email.html(has_email ? account.details.email : '');
            nodes.email_container.toggle(has_email);

            nodes.site.html(account.details.site || '');
            nodes.site_container.toggle(!!account.details.site);
            nodes.site.attr('href', account.details.site || '/');


            if (!is_org) {
                var orgs_success = (function Account__orgs_fetch_success (data) {
                    account.orgs = data;
                    if (account.orgs && account.orgs.length) {
                        that.display.clear_listview(nodes.orgs_container);
                        nodes.orgs_container.append(that.display.create_accounts_list_items(account.orgs, account.provider));
                        nodes.orgs_container.listview('refresh');
                    } else {
                        that.display.clear_listview(nodes.orgs_container, 'No organizations', true);
                        nodes.orgs_container.fadeOut();
                    }
                }); // orgs_success

                var orgs_fail = (function Account__orgs_fetch_error (err) {
                    that.display.clear_listview(nodes.orgs_container, 'Failed to load organizations', true);
                });

                if (account.orgs === null || force) {
                    account.fetch('orgs', orgs_success, orgs_fail);
                } else {
                    orgs_success(account.orgs);
                }
            }

            that.container.children('ul[data-role=listview]').listview('refresh');
        }) // update

    }); // View.account_home

    App.View.views.account_repositories = App.View.views._repositories.$extend({
        __classvars__: {
            model: 'account',
            view_name: 'account_repositories',
            data_field: 'repositories',
            accept_options: true,
            default_options: {
                direction: 'desc',
                forks: 'all',
                language: null,
                sort: 'pushed',
                type: 'all'
            }
        }
    }); // View.account_repositories

    App.View.views.account_stars = App.View.views._repositories.$extend({
        __classvars__: {
            model: 'account',
            view_name: 'account_stars',
            data_field: 'stars',
            accept_options: true,
            default_options: {
                direction: 'desc',
                forks: 'all',
                language: null,
                sort: 'created'
            }
        }
    }); // View.account_stars

    App.View.views.account_followers = App.View.views._accounts.$extend({
        __classvars__: {
            model: 'account',
            view_name: 'account_followers',
            data_field: 'followers'
        }
    }); // View.account_followers

    App.View.views.account_following = App.View.views._accounts.$extend({
        __classvars__: {
            model: 'account',
            view_name: 'account_following',
            data_field: 'following'
        }
    }); // View.account_following

    App.View.views.account_members = App.View.views._accounts.$extend({
        __classvars__: {
            model: 'account',
            view_name: 'account_members',
            data_field: 'org_members'
        }
    }); // View.account_members

    App.View.views.account_activity = App.View.views._events.$extend({
        __classvars__: {
            model: 'account',
            view_name: 'account_activity',
            data_field: 'own_events',
            accept_options: true,
            default_options: {
                mode: 'display',
                type: null
            }
        }
    }); // View.account_activity

    App.View.views.account_events = App.View.views._events.$extend({
        __classvars__: {
            model: 'account',
            view_name: 'account_events',
            data_field: 'received_events',
            accept_options: true,
            default_options: {
                mode: 'display',
                type: null
            }
        }
    }); // View.account_events

})(Reposio);
