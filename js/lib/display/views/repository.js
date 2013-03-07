(function(App) {

    App.View.views.repository_home = App.View.$extend({

        __classvars__: {
            model: 'repository',
            view_name: 'repository_home'
        },

        cache_nodes: function() {
            this.$super();

            var nodes = this.nodes_cache;

            var main = this.container.children('.repo-main').children('li');
            nodes.provider = main.children('p.provider');

            var repo = main.children('div.repo-path');
            nodes.name = repo.children('strong.repo-name');
            nodes.owner_container = repo.children('span.repo-owner-container');
            nodes.owner = nodes.owner_container.children('span.repo-owner');

            nodes.fork_container = main.children('div.repo-fork');
            var fork = main.find('.repo-links');
            nodes.fork_name = fork.children('span.repo-fork-name');
            nodes.fork_owner = fork.find('span strong.repo-fork-owner');

            nodes.last_push_container = main.children('p.repo-last-push');
            nodes.last_push = nodes.last_push_container.children('span');

            nodes.desc_readme = this.container.children('div');
            nodes.description_container = nodes.desc_readme.children('div.repo-desc-container');
            nodes.description = nodes.description_container.find('.repo-desc');

            nodes.readme_container = nodes.desc_readme.children('div.repo-readme-container');
            nodes.readme = nodes.readme_container.find('.repo-readme');
        },

        reset: function() {
            this.$super();

            var nodes = this.nodes();

            nodes.name.html('loading...');
            nodes.owner_container.hide();
            nodes.owner.html('...');
            nodes.fork_container.hide();
            nodes.last_push_container.hide();
            nodes.desc_readme.hide();
            nodes.description.html('');
            nodes.readme.html('<em>Loading...</em>');
        },

        update: function(repository, force) {
            var nodes = this.nodes(),
                that = this;

            nodes.provider.html(repository.provider.name);
            nodes.name.html(repository.details.name);
            nodes.owner.html(this.display.account_link(repository.details.user.login, repository.provider.name));
            nodes.owner_container.show();

            if (repository.details.is_fork) {
                nodes.fork_name.html(this.display.repository_link(repository.details.parent.full_name, repository.details.parent.name, repository.provider.name));
                nodes.fork_owner.html(repository.details.parent.user.login);
                nodes.fork_container.show();
            }

            nodes.last_push.html(repository.details.pushed_at ? this.display.format_date(repository.details.pushed_at, true) : 'never !');
            nodes.last_push_container.show();

            nodes.description.html(repository.details.description || '<em>No description!</em>');
            if (!repository.details.description) {
                nodes.description_container.hide();
            }

            var readme_success = function(data) {
                repository.readme = data;
                if (!repository.readme && nodes.readme_container.hasClass('ui-collapsible-collapsed')) {
                    nodes.readme_container.fadeOut();
                } else {
                    nodes.readme.html(repository.readme || '<em>No readme!</em>');
                }
            };

            var readme_fail = function(err) {
                nodes.readme.html('<em>Failed to load readme!</em>');
            };

            if (repository.readme === null || force) {
                repository.fetch('readme', readme_success, readme_fail);
            } else {
                readme_success(repository.readme);
            }

            nodes.desc_readme.show();

            this.display.render_widgets(this.container);

        }
    });

    App.View.views.repository_forks = App.View.views._repositories.$extend({
        __classvars__: {
            model: 'repository',
            view_name: 'repository_forks',
            data_field: 'forks',
            accept_options: true
        }
    });

    App.View.views.repository_activity = App.View.views._events.$extend({
        __classvars__: {
            model: 'repository',
            view_name: 'repository_activity',
            data_field: 'activity',
            accept_options: true
        }
    });

    App.View.views.repository_contributors = App.View.views._accounts.$extend({
        __classvars__: {
            model: 'repository',
            view_name: 'repository_contributors',
            data_field: 'contributors'
        },
        get_items: function(repository, contributors) {
            for (var i=0; i<contributors.length; i++) {
                contributors[i].html_prepend = '<p class="ui-li-aside count ui-li-desc">' + contributors[i].contributions + '</p>';
            }
            return this.$super(repository, contributors);
        }
    });

    App.View.views.repository_stars = App.View.views._accounts.$extend({
        __classvars__: {
            model: 'repository',
            view_name: 'repository_stars',
            data_field: 'stars'
        }
    });

})(Reposio);
