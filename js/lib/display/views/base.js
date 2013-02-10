(function(App) {

    App.View = Class.$extend({

        __classvars__: {
            model: null,
            view_name: null,
            views: {},
            cache: {},
            get: function(name, display) {
                if (!this.cache[name]) {
                    this.cache[name] = new this.views[name](display);
                }
                return this.cache[name];
            }
        },

        __init__: function(display) {
            this.display = display;
            this.cache = null;
            this.container = null;
        },

        cache_nodes: function() {
            this.container = this.display.nodes[this.$class.model][this.$class.view_name].content;
            this.cache = {};
        },

        nodes: function() {
            if (!this.cache) {
                this.cache_nodes();
            }
            return this.cache;
        },

        reset: function() {
        },

        update: function(obj, force) {
        }

    });


    App.View.views._list = App.View.$extend({
        // provide a "data_field" in __classvars__ to know which field of the
        // object to use as data (or override get_data)

        cache_nodes: function() {
            this.$super();
            this.cache.list = this.container.children('ul');
        },

        reset: function() {
            var nodes = this.nodes();
            nodes.list.empty();
        },

        update: function(obj, force) {
            var nodes = this.nodes();
            nodes.list.empty();
            nodes.list.append(this.get_items(obj));
            this.refresh_widgets();
        },

        refresh_widgets: function() {
            this.nodes().list.listview('refresh');
        },

        get_data: function(obj) {
            return obj[this.$class.data_field];
        },

        get_items: function(obj) {
            // return some "li"s
        }

    });

    App.View.views._accounts = App.View.views._list.$extend({
        get_items: function(obj) {
            return this.display.create_accounts_list_items(this.get_data(obj), obj.provider);
        }
    });

    App.View.views._repositories = App.View.views._list.$extend({
        get_items: function(obj) {
            return this.display.create_repositories_list_items(this.get_data(obj), obj.provider);
        }
    });

    App.View.views._events = App.View.views._list.$extend({
        get_data: function(obj) {
            var raw_events = this.$super(obj),
                events = [];
            for (var i=0; i < raw_events.length; i++) {
                var event = obj.provider.formatter.format(raw_events[i], obj);
                if (event) { events.push(event); }
            }
            return events;
        },

        get_items: function(obj) {
            return this.display.create_events_list_items(this.get_data(obj));
        },

        refresh_widgets: function() {
            this.display.render_widgets(this.nodes().list);
        }
    });

})(Reposio);
