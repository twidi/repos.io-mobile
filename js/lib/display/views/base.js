(function(App) {

    App.View = Class.$extend({

        __classvars__: {
            model: null,
            view_name: null,
            views: {},
            views_cache: {},
            get: function(page, display) {
                if (!this.views_cache[page.id]) {
                    this.views_cache[page.id] = new this.views[page.id](page, display);
                }
                return this.views_cache[page.id];
            }
        },

        __init__: function(page, display) {
            this.page = page;
            this.display = display;
            this.nodes_cache = null;
            this.container = null;
            this.init_events();
            this.accept_options = this.__classvars__.accept_options;
        },

        init_events: function() {
        },

        cache_nodes: function() {
            this.container = this.page.nodes.content;
            this.nodes_cache = {};
        },

        nodes: function() {
            if (!this.nodes_cache) {
                this.cache_nodes();
            }
            return this.nodes_cache;
        },

        reset: function() {
            if (!this.page.node.data('mobile-page')) {
                this.page.node.page();
            }
        },

        update: function(obj, force) {
        }

    });


    App.View.views._list = App.View.$extend({
        // provide a "data_field" in __classvars__ to know which field of the
        // object to use as data (or override get_data)

        __init__: function(page, display) {
            this.$super(page, display);
            this.options = {};
        },

        cache_nodes: function() {
            this.$super();
            this.nodes_cache.list = this.container.children('ul');
            this.nodes_cache.load_buttons = this.container.children('.load-buttons');
            this.nodes_cache.load_more_button = this.nodes_cache.load_buttons.find('a.list-more-button');
            this.nodes_cache.load_all_button = this.nodes_cache.load_buttons.find('a.list-all-button');
        },

        reset: function() {
            this.$super();
            var nodes = this.nodes();
            nodes.list.empty();
            nodes.load_buttons.hide();
            nodes.load_more_button.addClass('ui-disabled');
            nodes.load_all_button.addClass('ui-disabled');
        },

        update: function(obj, force) {
            var nodes = this.nodes();
            nodes.list.empty();
            nodes.list.append(this.get_items(obj, this.get_data(obj)));
            this.update_load_buttons(obj);
            this.refresh_widgets();
        },

        complete: function(obj, data) {
            var nodes = this.nodes();
            nodes.list.append(this.get_items(obj, data));
            this.refresh_widgets();
        },

        update_load_buttons: function(obj) {
            var nodes = this.nodes();
            if (!nodes.load_buttons.length) { return; }
            var str_options = $.param(this.options),
                list_options = obj.list_page_status[this.$class.data_field][str_options];
            if (list_options ? list_options.maybe_more : true) {
                this.enable_load_buttons();
            } else {
                this.hide_load_buttons();
            }
        },

        toggle_load_buttons_enabled: function(enabled) {
            var nodes = this.nodes();
            if (!nodes.load_buttons.length) { return; }
            nodes.load_more_button.toggleClass('ui-disabled', !enabled);
            nodes.load_all_button.toggleClass('ui-disabled', !enabled);
            if (enabled) {
                this.show_load_buttons();
            }
        },
        disable_load_buttons: function() { this.toggle_load_buttons_enabled(false); },
        enable_load_buttons: function() { this.toggle_load_buttons_enabled(true); },

        toggle_load_buttons_visible: function(visible) {
            var nodes = this.nodes();
            if (!nodes.load_buttons.length) { return; }
            nodes.load_buttons.toggle(visible);
            if (!visible) {
                this.disable_load_buttons();
            }
        },
        hide_load_buttons: function() { this.toggle_load_buttons_visible(false); },
        show_load_buttons: function() { this.toggle_load_buttons_visible(true); },

        refresh_widgets: function() {
            this.nodes().list.listview('refresh');
        },

        get_data: function(obj) {
            return obj.get_list(this.$class.data_field, this.options);
        },

        get_items: function(obj, data) {
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
                    var page = view.display.pages[$.mobile.activePage.data('url')];
                    $.mobile.loading('show');
                    view.display.ask_for_page(page.id, view.display.controller[page.type].id);
                    return false;
                },
                on_load_more = function(ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (!$(this).hasClass('ui-disabled')) {
                        var page = view.display.pages[$.mobile.activePage.data('url')];
                        $.mobile.loading('show');
                        view.disable_load_buttons();
                        view.display.ask_for_more(page);
                    }
                    return false;
                },
                on_load_all = function(ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (!$(this).hasClass('ui-disabled')) {
                        var page = view.display.pages[$.mobile.activePage.data('url')];
                        $.mobile.loading('show');
                        view.disable_load_buttons();
                        view.display.ask_for_all(page);
                    }
                    return false;
                };
            $(document).on('submit', '#' + this.__classvars__.view_name + '_options', on_submit);
            $(document).on('click', '#' + this.__classvars__.view_name + '_load_buttons .list-more-button', on_load_more);
            $(document).on('click', '#' + this.__classvars__.view_name + '_load_buttons .list-all-button', on_load_all);
        }

    });

    App.View.views._accounts = App.View.views._list.$extend({
        get_items: function(obj, data) {
            return this.display.create_accounts_list_items(data, obj.provider);
        }
    });

    App.View.views._repositories = App.View.views._list.$extend({
        get_items: function(obj, data) {
            return this.display.create_repositories_list_items(data, obj.provider);
        }
    });

    App.View.views._events = App.View.views._list.$extend({
        get_items: function(obj, events) {
            var real_events = [];
            for (var i=0; i < events.length; i++) {
                var event = obj.provider.formatter.format(events[i], obj);
                if (event) { real_events.push(event); }
            }
            return this.display.create_events_list_items(real_events);
        },

        refresh_widgets: function() {
            this.display.render_widgets(this.nodes().list);
        }
    });

})(Reposio);
