(function(App) {


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
