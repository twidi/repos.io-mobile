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
            this.init_events();
            this.page = this.display.nodes[this.__classvars__.model][this.__classvars__.view_name].page;
            this.accept_options = this.__classvars__.accept_options;
        },

        init_events: function() {
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

        __init__: function(display) {
            this.$super(display);
            this.options = {};
        },

        cache_nodes: function() {
            this.$super();
            this.cache.list = this.container.children('ul');
        },

        reset: function() {
            if (!this.page.data('mobile-page')) {
                this.page.page();
            }
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
            return obj.get_list(this.$class.data_field, this.options);
        },

        get_items: function(obj) {
            // return some "li"s
        },
        options_form: function() {
            if (!this._options_form) {
                this._options_form = $('#' + this.$class.view_name + '_options');
            }
            return this._options_form;
        },
        save_options: function() {
            var fields = this.options_form().serializeArray(),
                name, dict = {}, sorted_names = [], sorted_dict = {};
            for (var i=0; i<fields.length; i++) {
                name = fields[i].name.replace(this.$class.view_name + '_options_', '');
                if (name == 'submit') { continue; }
                sorted_names.push(name);
                dict[name] = fields[i].value;
            }
            sorted_names.sort();
            for (var j=0; j<sorted_names.length; j++) {
                sorted_dict[sorted_names[j]] = dict[sorted_names[j]];
            }
            this.options = sorted_dict;
            return this.options;
        },
        init_events: function() {
            var view = this,
                on_submit = function(ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    var url = $.mobile.activePage.data('url'),
                        parts = url.split('_'),
                        type = parts[0],
                        page = parts[1];
                    $.mobile.loading('show');
                    view.display.on_page_before_load(type, view.display.controller[type].id, page);
                    return false;
                };
            $(document).on('submit', '#' + this.__classvars__.view_name + '_options', on_submit);
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
