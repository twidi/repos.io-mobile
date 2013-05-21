(function(App) {

    App.View.views.repository_home = App.View.$extend({

        __classvars__: {
            model: 'repository',
            view_name: 'repository_home'
        },

        cache_nodes: (function View_repository_home__cache_nodes () {
            this.$super();

            var nodes = this.nodes_cache;

            var main = this.container.children('.repo-main');
            nodes.provider = main.children('p.provider');

            var repo = main.children('.repo-path');
            nodes.name = repo.children('strong.repo-name');
            nodes.owner_container = repo.children('span.repo-owner-container');
            nodes.owner = nodes.owner_container.children('span.repo-owner');

            nodes.fork_container = main.children('div.repo-fork');
            var fork = main.find('.repo-links');
            nodes.fork_name = fork.children('span.repo-fork-name');
            nodes.fork_owner = fork.find('span strong.repo-fork-owner');

            nodes.last_push_container = main.children('p.repo-last-push');
            nodes.last_push = nodes.last_push_container.children('span');

            nodes.desc_readme = this.container.children('div.ui-collapsible-set');
            nodes.description_container = nodes.desc_readme.children('div.repo-desc-container');
            nodes.description = nodes.description_container.find('.repo-desc');

            nodes.readme_container = nodes.desc_readme.children('div.repo-readme-container');
            nodes.readme = nodes.readme_container.find('.repo-readme');
        }), // cache_nodes

        reset: (function View_repository_home__reset (repository) {
            this.$super();

            var nodes = this.nodes(),
                has_details = !!(repository && repository.details);

            nodes.name.html((has_details && repository.details.name) || 'loading...');

            if (has_details && repository.details.user) {
                this._update_owner(repository, nodes);
                nodes.owner_container.show();
            } else {
                nodes.owner_container.hide();
            }
            if (has_details && repository.details.is_fork && repository.details.parent) {
                this._update_fork(repository, nodes);
                nodes.fork_container.show();
            } else {
                nodes.fork_container.hide();
            }
            if (has_details && repository.details.pushed_at) {
                this._update_last_push(repository, nodes);
                nodes.last_push_container.show();
            } else {
                nodes.last_push_container.hide();
            }

            if (has_details && (repository.details.description || repository.readme)) {
                nodes.desc_readme.show();
            } else {
                nodes.desc_readme.hide();
            }
            nodes.description.text((has_details && repository.details.description) || '');
            nodes.readme.html((has_details && repository.readme) || '<em>Loading...</em>');

            this.display.render_widgets(this.container);

        }), // reset

        _update_owner: (function View_repository_home__update_owner (repository, nodes) {
            nodes.owner.html(this.display.account_link(repository.details.user.login, repository.provider.name, repository.details.user.avatar_url));
        }), // _update_owner

        _update_fork: (function View_repository_home__update_fork (repository, nodes) {
            nodes.fork_name.html(this.display.repository_link(repository.details.parent.full_name, repository.provider.name, true));
            nodes.fork_owner.html(this.display.account_link(repository.details.parent.user.login, repository.provider.name, repository.details.parent.user.avatar_url));
        }), // _update_fork

        _update_last_push: (function View_repository_home__update_last_push (repository, nodes) {
            nodes.last_push.html(repository.details.pushed_at ? this.display.format_date(repository.details.pushed_at, true) : 'never !');
        }), // _update_last_push

        update: (function View_repository_home__update (repository, force) {
            var nodes = this.nodes();

            nodes.provider.html(repository.provider.name);
            nodes.name.html(repository.details.name);
            this._update_owner(repository, nodes);
            nodes.owner_container.show();

            if (repository.details.is_fork) {
                this._update_fork(repository, nodes);
                nodes.fork_container.show();
            }

            this._update_last_push(repository, nodes);
            nodes.last_push_container.show();

            nodes.description.text(repository.details.description || '<em>No description!</em>');
            nodes.description_container.toggle(!!repository.details.description);

            var readme_success = (function Repository__readme_fetch_success (data) {
                repository.update_data('readme', data);
                if (!repository.readme && nodes.readme_container.hasClass('ui-collapsible-collapsed')) {
                    nodes.readme_container.fadeOut();
                } else {
                    nodes.readme.html(repository.readme || '<em>No readme!</em>');
                }
            }); // readme_success

            var readme_fail = (function Repository__readme_fetch_error (err) {
                nodes.readme.html('<em>Failed to load readme!</em>');
            });

            if (repository.readme === null || force) {
                repository.fetch('readme', readme_success, readme_fail);
            } else {
                readme_success(repository.readme);
            }

            nodes.desc_readme.show();
            nodes.readme_container.show();

            this.display.render_widgets(this.container);

        }) // update

    }); // View.repository_home

    App.View.views.repository_forks = App.View.views._repositories.$extend({
        __classvars__: {
            model: 'repository',
            view_name: 'repository_forks',
            data_field: 'forks',
            accept_options: true,
            default_options: {
                never_updated: 'show',
                sort: 'newest'
            }
        }
    }); // View.repository_forks

    App.View.views.repository_activity = App.View.views._events.$extend({
        __classvars__: {
            model: 'repository',
            view_name: 'repository_activity',
            data_field: 'activity',
            accept_options: true,
            default_options: {
                mode: 'display',
                type: null
            }
        }
    }); // View.repository_activity

    App.View.views.repository_contributors = App.View.views._accounts.$extend({
        __classvars__: {
            model: 'repository',
            view_name: 'repository_contributors',
            data_field: 'contributors'
        },
        get_items: (function View_repository_contributors__get_items (repository, contributors) {
            for (var i=0; i<contributors.length; i++) {
                contributors[i].html_prepend = '<p class="ui-li-aside count ui-li-desc">' + contributors[i].contributions + '</p>';
            }
            return this.$super(repository, contributors);
        }) // get_items
    }); // View.repository_contributors

    App.View.views.repository_stars = App.View.views._accounts.$extend({
        __classvars__: {
            model: 'repository',
            view_name: 'repository_stars',
            data_field: 'stars'
        }
    }); // View.repository_stars

    App.View.views.repository_issues = App.View.views._issues.$extend({
        __classvars__: {
            model: 'repository',
            view_name: 'repository_issues',
            data_field: 'issues',
            accept_options: true,
            default_options: {
                direction: 'desc',
                sort: 'created',
                state: 'open'
            }
        }
    }); // View.repository_issues

    App.View.views.repository_pull_requests = App.View.views._pull_requests.$extend({
        __classvars__: {
            model: 'repository',
            view_name: 'repository_pull_requests',
            data_field: 'pull_requests',
            accept_options: true,
            default_options: {
                state: 'open'
            }
        }
    }); // View.repository_pull_requests

})(Reposio);
