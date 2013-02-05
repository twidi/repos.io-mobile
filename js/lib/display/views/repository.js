(function(App) {


    App.Display.prototype.views.repository_home = {
        cache_nodes: function(display) {
            var container = display.nodes.repository.repository_home.content,
                nodes = display.nodes.repository.repository_home.nodes;

            if (!nodes) {
                nodes = display.nodes.repository.repository_home.nodes = {};

                var main = container.children('.repo-main').children('li');
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

                nodes.desc_readme = container.children('div');
                nodes.description_container = nodes.desc_readme.children('div.repo-desc-container');
                nodes.description = nodes.description_container.find('.repo-desc');

                nodes.readme_container = nodes.desc_readme.children('div.repo-readme-container');
                nodes.readme = nodes.readme_container.find('.repo-readme');
            }

            return nodes;

        },

        reset: function(display) {
            var container = display.nodes.repository.repository_home.content,
                nodes = display.views.repository_home.cache_nodes(display);

            nodes.name.html('loading...');
            nodes.owner_container.hide();
            nodes.owner.html('...');
            nodes.fork_container.hide();
            nodes.last_push_container.hide();
            nodes.desc_readme.hide();
            nodes.description.html('');
            nodes.readme.html('');

        },

        update: function(display, repository) {
            var container = display.nodes.repository.repository_home.content,
            nodes = display.views.repository_home.cache_nodes(display);

            nodes.provider.html(repository.provider.name);
            nodes.name.html(repository.details.name);
            nodes.owner.html(display.account_link(repository.details.owner.login, repository.provider.name));
            nodes.owner_container.show();

            if (repository.details.fork) {
                nodes.fork_name.html(display.repository_link(repository.details.parent.full_name, repository.details.parent.name, repository.provider.name));
                nodes.fork_owner.html(repository.details.parent.owner.login);
                nodes.fork_container.show();
            }

            nodes.last_push.html(repository.details.pushed_at ? display.format_date(repository.details.pushed_at, true) : 'never !');
            nodes.last_push_container.show();

            nodes.description.html(repository.details.description || '<em>No description!</em>');
            nodes.readme.html(repository.details.readme || '<em>No readme!</em>');
            if (!repository.details.description) {
                nodes.description_container.hide();
            }
            if (!repository.details.readme) {
                nodes.readme_container.hide();
            }

            nodes.desc_readme.show();

            display.render_widgets(container);

        }
    };


    App.Display.prototype.views.repository_forks = {
        cache_nodes: function(display) {
            var container = display.nodes.repository.repository_forks.content,
                nodes = display.nodes.repository.repository_forks.nodes;

            if (!nodes) {
                nodes = display.nodes.repository.repository_forks.nodes = {};

                nodes.list = container.children('ul');
            }

            return nodes;
        },

        reset: function(display) {
            var container = display.nodes.repository.repository_forks.content,
                nodes = display.views.repository_forks.cache_nodes(display);

            nodes.list.empty();
        },

        update: function(display, repository) {
            var container = display.nodes.repository.repository_forks.content,
                nodes = display.views.repository_forks.cache_nodes(display);

            nodes.list.empty();
            nodes.list.append(display.create_repositories_list_items(repository.forks, repository.provider));

            nodes.list.listview('refresh');
        }
    };



    App.Display.prototype.views.repository_activity = {
        cache_nodes: function(display) {
            var container = display.nodes.repository.repository_activity.content,
                nodes = display.nodes.repository.repository_activity.nodes;

            if (!nodes) {
                nodes = display.nodes.repository.repository_activity.nodes = {};

                nodes.list = container.children('ul');
            }

            return nodes;
        },

        reset: function(display) {
            var container = display.nodes.repository.repository_activity.content,
                nodes = display.views.repository_activity.cache_nodes(display);

            nodes.list.empty();
        },

        update: function(display, repository) {
            var container = display.nodes.repository.repository_activity.content,
                nodes = display.views.repository_activity.cache_nodes(display),
                events = [];

            for (var i=0; i<repository.activity.length; i++) {
                var event = repository.provider.formatter.format(repository.activity[i], repository);
                if (event) { events.push(event); }
            }

            nodes.list.empty();
            nodes.list.append(display.create_events_list_items(events));
            display.render_widgets(nodes.list);
        }
    };


    App.Display.prototype.views.repository_contributors = {
        cache_nodes: function(display) {
            var container = display.nodes.repository.repository_contributors.content,
                nodes = display.nodes.repository.repository_contributors.nodes;

            if (!nodes) {
                nodes = display.nodes.repository.repository_contributors.nodes = {};

                nodes.list = container.children('ul');
            }

            return nodes;
        },

        reset: function(display) {
            var container = display.nodes.repository.repository_contributors.content,
                nodes = display.views.repository_contributors.cache_nodes(display);

            nodes.list.empty();
        },

        update: function(display, repository) {
            var container = display.nodes.repository.repository_contributors.content,
                nodes = display.views.repository_contributors.cache_nodes(display);

            for (var i=0; i<repository.contributors.length; i++) {
                repository.contributors[i].html_extended = '<p class="ui-li-aside count">' + repository.contributors[i].contributions + '</p>';
            }

            nodes.list.empty();
            nodes.list.append(display.create_accounts_list_items(repository.contributors, repository.provider));

            nodes.list.listview('refresh');
        }
    };

    App.Display.prototype.views.repository_stars = {
        cache_nodes: function(display) {
            var container = display.nodes.repository.repository_stars.content,
                nodes = display.nodes.repository.repository_stars.nodes;

            if (!nodes) {
                nodes = display.nodes.repository.repository_stars.nodes = {};

                nodes.list = container.children('ul');
            }

            return nodes;
        },

        reset: function(display) {
            var container = display.nodes.repository.repository_stars.content,
                nodes = display.views.repository_stars.cache_nodes(display);

            nodes.list.empty();
        },

        update: function(display, repository) {
            var container = display.nodes.repository.repository_stars.content,
                nodes = display.views.repository_stars.cache_nodes(display);

            nodes.list.empty();
            nodes.list.append(display.create_accounts_list_items(repository.stars, repository.provider));

            nodes.list.listview('refresh');
        }
    };

})(Reposio);
