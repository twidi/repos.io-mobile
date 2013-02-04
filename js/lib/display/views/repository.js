(function(App) {



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

})(Reposio);
