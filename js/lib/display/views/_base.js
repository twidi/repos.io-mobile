(function(App) {

    App.View = Class.$extend({

        __classvars__: {
            model: null,
            view_name: null,
            views: {},
            views_cache: {},
            get: (function View__class__get (page, display) {
                if (!this.views_cache[page.id]) {
                    this.views_cache[page.id] = new this.views[page.id](page, display);
                }
                return this.views_cache[page.id];
            }) // get
        }, // __classvars__

        __init__: (function View__constructor (page, display) {
            this.page = page;
            this.display = display;
            this.nodes_cache = null;
            this.container = null;
            this.init_events();
            this.accept_options = this.__classvars__.accept_options;
        }), // __init__

        init_events: (function View__init_events () {
        }), // init_events

        cache_nodes: (function View__cache_nodes () {
            this.container = this.page.nodes.content;
            this.nodes_cache = {};
        }), // cache_nodes

        nodes: (function View__nodes () {
            if (!this.nodes_cache) {
                this.cache_nodes();
            }
            return this.nodes_cache;
        }), // nodes

        reset: (function View__reset (obj) {
            if (!this.page.node.data('mobile-page')) {
                this.page.node.page();
            }
        }), // reset

        update: (function View__update (obj, force) {
        }) // update

    }); // View


    App.View.views._list = App.View.$extend({
        // provide a "data_field" in __classvars__ to know which field of the
        // object to use as data (or override get_data)

        __init__: (function View_list__constructor (page, display) {
            this.$super(page, display);
            this.options = {};
        }), // __init__

        cache_nodes: (function View_list__cache_nodes () {
            this.$super();
            this.nodes_cache.list = this.container.children('ul');
            this.nodes_cache.load_buttons = this.container.children('.load-buttons');
            this.nodes_cache.load_more_button = this.nodes_cache.load_buttons.find('a.list-more-button');
            this.nodes_cache.load_all_button = this.nodes_cache.load_buttons.find('a.list-all-button');
        }), // cache_nodes

        reset: (function View_list__reset (obj) {
            this.$super();
            var nodes = this.nodes();
            this.empty_list_node();
            nodes.load_buttons.addClass('ui-hidden');
            nodes.load_more_button.addClass('ui-disabled');
            nodes.load_all_button.addClass('ui-disabled');
        }), // reset

        empty_list_node: (function View_list__empty_list_node () {
            var nodes = this.nodes(),
                list = nodes.list[0];
            while (list.firstChild) {
                list.removeChild(list.firstChild);
            }
        }), // empty_list_node

        update: (function View_list__update (obj, force) {
            var nodes = this.nodes(),
                items = this.get_items(obj, this.get_data(obj));
            this.empty_list_node();
            if (items.length) {
                items[0].className += ' ui-first-child';
                this.update_list_node(items);
            }
            this.update_load_buttons(obj);
            this.refresh_widgets();
        }), // update

        update_list_node: (function View_list__update_list_node (items) {
            var nodes = this.nodes(),
                list = nodes.list[0],
                actual_last = list.lastChild;
            if (items.length) {
                items[items.length-1].className += ' ui-last-child';
                if (actual_last) {
                    actual_last.className = actual_last.className.replace('ui-last-child', '');
                }
                for (var i=0; i < items.length; i++) {
                    list.appendChild(items[i]);
                }
            }
        }), // update_list_node

        complete: (function View_list__complete (obj, data) {
            var nodes = this.nodes(),
                items = this.get_items(obj, this.prepare_data(obj, data));
            this.update_list_node(items);
            this.refresh_widgets();
        }), // complete

        update_load_buttons: (function View_list__update_load_buttons (obj) {
            var nodes = this.nodes();
            if (!nodes.load_buttons.length) { return; }
            var str_options = $.param(this.options),
                list_options = obj.list_page_status[this.$class.data_field][str_options];
            if (!obj.list_page_status[this.$class.data_field].__global__.all && (list_options ? list_options.maybe_more : true)) {
                this.enable_load_buttons();
            } else {
                this.hide_load_buttons();
            }
        }), // update_load_buttons

        toggle_load_buttons_enabled: (function View_list__toggle_load_buttons_enabled (enabled) {
            var nodes = this.nodes();
            if (!nodes.load_buttons.length) { return; }
            nodes.load_more_button.toggleClass('ui-disabled', !enabled);
            nodes.load_all_button.toggleClass('ui-disabled', !enabled);
            if (enabled) {
                this.show_load_buttons();
            }
        }), // toggle_load_buttons_enabled

        disable_load_buttons: (function View_list__disable_load_buttons () { this.toggle_load_buttons_enabled(false); }),
        enable_load_buttons: (function View_list__enable_load_buttons () { this.toggle_load_buttons_enabled(true); }),

        toggle_load_buttons_visible: (function View_list__toggle_load_buttons_visible (visible) {
            var nodes = this.nodes();
            if (!nodes.load_buttons.length) { return; }
            nodes.load_buttons.toggleClass('ui-hidden', !visible);
            if (!visible) {
                this.disable_load_buttons();
            }
        }), // toggle_load_buttons_visible

        hide_load_buttons: (function View_list__hide_load_buttons () { this.toggle_load_buttons_visible(false); }),
        show_load_buttons: (function View_list__show_load_buttons () { this.toggle_load_buttons_visible(true); }),

        refresh_widgets: (function View_list__refresh_widgets () {
            this.display.load_visible_images();
        }), // refresh_widgets

        get_data: (function View_list__get_data (obj) {
            return obj.get_list(this.$class.data_field, this.options);
        }), // get_data

        prepare_data: (function View_list__prepare_data (obj, data) {
            return obj.get_list(this.$class.data_field, this.options, data);
        }), // prepare_data

        get_items: (function View_list__get_items (obj, data) {
            // return some "li"s
        }), // get_items

        options_form: (function View_list__options_form () {
            var view = this,
                form_selector = '#' + this.$class.view_name + '_options';
            if (!this._options_form) {
                this._options_form = $(form_selector);
                if (!this._options_form.length) {
                    var template = view.display.get_template(view.$class.view_name + '_options', true),
                        $template = $(template);
                    this._options_form = $template.find(form_selector);
                    setTimeout(function() {
                        // create forms from templates if not already done
                        $template.collapsible();
                        $.mobile.checkboxradio.prototype.enhanceWithin(view._options_form, true);
                        $.mobile.button.prototype.enhanceWithin(view._options_form, true);
                        $.mobile.selectmenu.prototype.enhanceWithin(view._options_form, true);
                        $.mobile.controlgroup.prototype.enhanceWithin(view._options_form, true);
                        view.page.nodes.content.prepend(template);
                    }, 500);
                }
            }
            return this._options_form;
        }), // options_form

        get_options_from_form: (function View_list__get_options_from_form () {
            var fields = this.options_form().serializeArray(),
                name, dict = {}, sorted_names = [], sorted_dict = {}, multiples = {},
                common_part = this.$class.view_name + '_options_';
            for (var i=0; i<fields.length; i++) {
                name = fields[i].name.replace(common_part, '');
                if (name == 'submit') { continue; }
                if (!_.contains(sorted_names, name)) {
                    sorted_names.push(name);
                    multiples[name] = $('#'+fields[i].name).is('select[multiple=multiple]');
                }
                if (multiples[name]) {
                    if (!dict[name]) {
                        dict[name] = [];
                    }
                    dict[name].push(fields[i].value);
                } else {
                    dict[name] = fields[i].value;
                }
            }
            sorted_names.sort();
            for (var j=0; j<sorted_names.length; j++) {
                sorted_dict[sorted_names[j]] = dict[sorted_names[j]];
            }
            return sorted_dict;
        }), // get_options_from_form

        manage_options: (function View_list__manage_options (url_options) {
            var options, key, form_options = {},
                common_part = this.$class.view_name + '_options_';

            // reset the form
            this.options_form().find('[type=reset]').click();

            // get default options
            options = $.extend({}, this.$class.default_options);

            // if options in url, use them
            if (url_options) {
                // update options from url
                for (key in url_options) {
                    if (typeof(options[key]) !== 'undefined') {
                        options[key] = decodeURIComponent(decodeURIComponent(url_options[key]));
                    }
                }
            }

            // update form with options (from url or default one if none)
            for (key in options) {
                form_options[common_part + key] = options[key];
            }
            this.options_form().unserializeForm($.param(form_options));

            this.options = options;
            return this.options;
        }), // manage_options

        init_events: (function View_list__init_events () {
            var view = this,
                on_submit = (function View_list__on_submit(ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    var options = view.get_options_from_form(),
                        url_options = {},
                        hash = '#' + view.$class.view_name;
                    hash += '!' + view.$class.model + '=' + view.display.controller[view.$class.model].id.replace('/', ':');
                    for (var key in options) {
                        url_options[key] = encodeURIComponent(options[key]);
                    }
                    hash += '&' + $.param(url_options);
                    window.location.hash = hash;
                    return false;
                }), // on_submit
                on_load_more = (function View_list__on_load_more (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (!$(this).hasClass('ui-disabled')) {
                        var page = view.display.pages[$.mobile.activePage.data('url')];
                        $.mobile.loading('show');
                        view.disable_load_buttons();
                        view.display.ask_for_more(page);
                    }
                    return false;
                }), // on_load_more
                on_load_all = (function View_list__on_load_all (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (!$(this).hasClass('ui-disabled')) {
                        var page = view.display.pages[$.mobile.activePage.data('url')];
                        $.mobile.loading('show');
                        view.disable_load_buttons();
                        view.display.ask_for_all(page);
                    }
                    return false;
                }); // on_load_all
            $(document).on('submit', '#' + this.__classvars__.view_name + '_options', on_submit);
            $(document).on('click', '#' + this.__classvars__.view_name + '_load_buttons .list-more-button', on_load_more);
            $(document).on('click', '#' + this.__classvars__.view_name + '_load_buttons .list-all-button', on_load_all);
        }) // init_events

    }); // View.__list

    App.View.views._accounts = App.View.views._list.$extend({
        get_items: (function View_accounts__get_items (obj, data) {
            return this.display.create_accounts_list_items(data, obj.provider);
        }) // get_items
    }); // View._accounts

    App.View.views._repositories = App.View.views._list.$extend({
        get_items: (function View_repositories__get_items (obj, data) {
            return this.display.create_repositories_list_items(data, obj.provider);
        }) // get_items
    }); // View._repositories

    App.View.views._events = App.View.views._list.$extend({
        get_items: (function View__events__get_items (obj, events) {
            var real_events = [];
            for (var i=0; i < events.length; i++) {
                var event = obj.provider.formatter.format(events[i], obj);
                if (event) { real_events.push(event); }
            }
            return this.display.create_events_list_items(real_events);
        }), // get_items

        refresh_widgets: (function View_events__refresh_widgets () {
            this.display.render_widgets(this.nodes().list);
            this.display.load_visible_images();
        }) // refresh_widgets
    }); // View._events

    App.View.views._issues = App.View.views._list.$extend({
        get_items: (function View__issues__get_items (obj, issues) {
            return this.display.create_issues_list_items(issues);
        }) // get_items
    }); // View._issues

    App.View.views._pull_requests = App.View.views._list.$extend({
        get_items: (function View__pull_requests__get_items (obj, pull_requests) {
            return this.display.create_pull_requests_list_items(pull_requests);
        }) // get_items
    }); // View._pull_requests

})(Reposio);
