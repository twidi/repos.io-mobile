(function(App) {


    var Display = function(controller) {
        this.controller = controller;
    };

    Display.prototype.init = function() {
        this.templates_container = $('#templates');

        for (var obj_type in this.pages) {
            this.construct_pages(obj_type, this.pages[obj_type]);
        }

        $('body > p.loading').remove();
        $('html').removeClass('loading');

        this.init_events();
    };

    Display.prototype.format_date = function(str_date, show_time, show_seconds, time_only) {
        if (!str_date) { return ''; }
        var parts = str_date.split('T');
        if (show_time) {
            var time = parts[1].slice(0, show_seconds ? 8 : 5);
            return (time_only ? '' : parts[0] + ' ') + time;
        } else {
            return parts[0];
        }
    };

    Display.prototype.nodes = {};
    Display.prototype.templates = {};
    Display.prototype.all_pages = {};
    Display.prototype.pages = {};

    Display.prototype.construct_pages = function(type, pages) {

        this.controller.mapping[type] = {};
        this.all_pages[type] = [];

        for (var l=0; l<pages.length; l++) {
            var page = pages[l];
            if (!page.name) { page.name = page.id[0].toUpperCase() + page.id.slice(1); }
            if (!page.method) { page.method = page.id; }
            this.controller.mapping[type][page.id] = page.method;
            this.all_pages[type].push(page.id);
        }

        var all_markup = '';
            extended_navbar = (pages.length > 4);

        for (var i=0; i<pages.length; i++) {
            var cur_page = pages[i],
                id_page  = type + '_' + cur_page.id,
                markup = '',
                navbar_pages = [];

            if (extended_navbar) {
                navbar_pages.push(pages[0]);
                navbar_pages.push(pages[1]);
                navbar_pages.push(pages[(i < 2) ? 2 : i]);  // if the current page is not in the navbar by default, display it in the third place
            } else {
                navbar_pages = pages;
            }

            markup = '<div data-role="page" id="' + id_page + '">';

                markup += '<div data-role="header" data-id="' + type + '_pages" data-position="fixed" data-theme="a">';
                    markup += '<h3></h3>';
                    markup += '<a href="#main_menu_' + id_page + '" data-icon="gear" data-iconpos="notext" data-rel="popup" class="ui-btn-right">Options</a>';
                    markup += '<div data-role="navbar">';
                        markup += '<ul' + (extended_navbar ? ' class="extended"' : '') + '>';
                        for (var j=0; j<navbar_pages.length; j++) {
                            var navbar_page = navbar_pages[j];
                            markup += '<li>';
                                markup += '<a href="#' + type + '_' + navbar_page.id + '"' + (j < i ?  ' data-direction="reverse"' : '') + ' class="' + (navbar_page.id == cur_page.id ? 'ui-btn-active ui-state-persist ' : '') + type + '_' + navbar_page.id + '-link">';
                                    markup += navbar_page.name;
                                    if (navbar_page.count) {
                                        markup += '<span class="' + type + '_' + navbar_page.id + '-count ui-li-count ui-btn-up-c ui-btn-corner-all">?</span>';
                                    }
                                markup += '</a>';
                            markup += '</li>';
                        }
                        if (extended_navbar) {
                            markup += '<li><a data-rel="popup" href="#menu_' + id_page + '">...</a>';
                        }
                        markup += '</ul>';
                    markup += '</div>';
                markup += '</div>';

                markup += '<div data-role="content"></div>';

                if (extended_navbar) {
                    markup += '<div data-role="popup" id="menu_' + id_page + '" data-theme="a" class="nav-menu">';
                        markup += '<ul data-role="listview" data-inset="true" data-theme="a">';

                        for (var k=0; k<pages.length; k++) {
                            var ext_page = pages[k];
                            markup += '<li>';
                                markup += '<a href="#' + type + '_' + ext_page.id + '" class="' + (ext_page.id == cur_page.id ? 'ui-btn-active ': '') + type + '_' + ext_page.id + '-link">';
                                    markup += ext_page.name;
                                    if (ext_page.count) {
                                        markup += '<span class="' + type + '_' + ext_page.id + '-count ui-li-count ui-btn-up-c ui-btn-corner-all">?</span>';
                                    }
                                markup += '</a>';
                            markup += '</li>';
                        }

                        markup += '</ul>';
                    markup += '</div>';
                }

                markup += '<div data-role="popup" id="main_menu_' + id_page + '" data-theme="a" class="main-nav-menu">';
                    markup += '<div data-role="controlgroup" data-theme="a" >';
                        markup += '<a href="/" data-role="button" data-icon="home" data-rel="home" data-theme="a">Home</a>';
                        markup += '<label><input type="checkbox" name="fullscreen" class="fullscreen-control" id="fullscreen-' + id_page + '" data-theme="a"/>Full screen</label>';
                        markup += '<a href="#" data-role="button" data-icon="refresh" class="refresh-control" data-theme="a">Refresh</a>';
                        markup += '<a href="#" data-role="button" data-icon="arrow-r" class="go-button" data-theme="a">View on <span class="provider"></span></a>';
                    markup += '</div>';
                markup += '</div>';

            markup += '</div>';

            all_markup += markup;

        }

        $('body').append(all_markup);

        this.nodes[type] = {};
        for (var m=0; m<this.pages[type].length; m++) {
            var final_page = this.pages[type][m],
                full_page_name = type + '_' + final_page.id,
                page_node = $('#' + full_page_name),
                main_menu = $('#main_menu_' + full_page_name),
                template = this.templates_container.children('div[data-template-for='+full_page_name+']');

            // cache some page nodes
            this.nodes[type][full_page_name] = {
                links: $('a.' + full_page_name + '-link'),
                page: page_node,
                header: page_node.find(':jqmData(role=header)').find('h3'),
                content: page_node.children(":jqmData(role=content)"),
                main_menu: main_menu,
                refresh_control: main_menu.find('.refresh-control'),
                go_button: main_menu.find('.go-button')
            };

            // insert page content
            if (template.length) {
                this.nodes[type][full_page_name].content.prepend(template.children());
                template.remove();
            }

        }

    };

    Display.prototype.init_events = function() {
        var that = this;
        $(document).on("pagebeforechange", function(e, data) {
            if (typeof data.toPage !== "string") { return; }
            if (data.options.dataUrl) {
                data.options.dataUrl = data.options.dataUrl.replace('?', '!');
            }
            data.options.allowSamePageTransition = true;
            if (data.toPage == $.mobile.path.stripQueryParams(location.href.replace('!', '?'))) {
                data.options.transition = 'none';  // we stay on the same view
            }
            that.on_before_page_change(e, data);
        });
        $(document).on("pagechange", function(e, data) {
            that.update_fullscreen_control();
            if ($.mobile.activePage && $.mobile.activePage.hasClass('current_page') && !$.mobile.activePage.hasClass('page_loaded')) {
                $.mobile.loading('show');
            }
            try {
                var url = data.toPage.data('url'),
                    parts = url.split('_'),
                    type = parts[0],
                    page = parts[1],
                    go_button = that.nodes[type][url].go_button,
                    real_url = that['get_real_' + type + '_page'](page, that.controller[type]);
                go_button.toggleClass('ui-disabled', !real_url);
                go_button.attr('href', real_url || '');
            } catch(ex) {}
        });
        $('.nav-menu').on("popupafterclose", function() {
            // restore previous active link in navbar when closing popup menu
            var menu = $(this),
                link = $(this).find('a.ui-btn-active'),
                href, parent;
            if (link.length) {
                parent = menu.parents('.ui-page');
                if (parent.length) {
                    href = link.attr('href');
                    parent.find('.ui-header .ui-navbar a[href="' + href + '"]').addClass('ui-btn-active');
                }
            }
        });
        $(document).on('click', '.list-events a.collapsible-trigger', function(e) {
            // open/close collapsible when clicking triggering links in list of events
            e.preventDefault();
            e.stopPropagation();
            var link = $(this),
                collapsible = link.data('collapsible'),
                opened =link.data('opened') || false;
            if (!collapsible) {
                collapsible =  link.parents('li').find('.ui-collapsible');
                link.data('collapsible', collapsible);
            }
            collapsible.trigger(opened ? 'collapse' : 'expand');
            link.data('opened', !opened);
            return false;
        });
        $(document).on('click', 'li.with-extension', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).toggleClass('extended');
            return false;
        });
        $(document).on('click', '.refresh-control', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var url = $.mobile.activePage.data('url'),
                parts = url.split('_'),
                type = parts[0],
                page = parts[1];
            $.mobile.loading('show');
            that.on_page_before_load(type, that.controller[type].id, page, 'force');
            that.nodes[type][url].main_menu.popup('close');
        });
        if (screenfull.enabled) {
            $(document).on('change', '.fullscreen-control', function(e) {
                $(this).parents('.main-nav-menu').popup('close');
                screenfull.toggle();
            });
            screenfull.onchange = that.update_fullscreen_control;

        } else {
            var controls = $('.fullscreen-control');
            controls.parents('.ui-checkbox').add(controls.parents('label')).remove();
        }
    };

    Display.prototype.update_fullscreen_control = function() {
        $('.fullscreen-control').attr("checked", screenfull.isFullscreen).each(function() {
            try {
                $(this).checkboxradio("refresh");
            } catch(ex) {}
        });
    };

    Display.prototype.on_before_page_change = function(e, data) {
        var url = $.mobile.path.parseUrl(data.toPage),
            page_ok = false,
            page, type, obj;

        if (url.hash && data.options) {
            page = url.hash.slice(1);
            for (var obj_type in this.pages) {
                if (page.indexOf(obj_type + '_') === 0) {
                    type = obj_type;
                    break;
                }
            }
            if (type && data.options.pageData && data.options.pageData[type]) {
                page = page.slice(type.length+1);
                if (this.all_pages[type].indexOf(page) !== -1) {
                    obj = data.options.pageData[type];
                    page_ok = true;
                }
            }
        }

        if (page_ok) {
            $.mobile.loading('show');
            this.on_page_before_load(type, obj, page);
        } else if (type || !$(url.hash).length) {
            $.mobile.changePage($('#home'));
            e.preventDefault();
        }
    };

    Display.prototype.is_current_page = function(page, obj) {
        if (!page.hasClass('current_page')) { return false ;}
        var current_for = page.data('current-for');
        if (current_for && current_for != obj.id) { return false; }
        return true;
    };

    Display.prototype.is_page_for = function(page, obj) {
        var current_for = page.data('current-for');
        if (current_for && current_for == obj.id) { return true; }
        return false;
    };

    Display.prototype.is_view_for = function(view, obj, options) {
        if (!this.is_page_for(view.page, obj)) { return false; }
        if (view.accept_options && view.page.data('current-options') != $.param(options)) {
            return false;
        }
        return true;
    };

    Display.prototype.on_page_before_load = function(type, obj_id, page_name, force) {
        obj_id = obj_id.replace(':', '/');
        var that = this,
            changed = this.controller.set_current_object(type, obj_id),
            obj = this.controller[type],
            full_name = type + '_' + page_name,
            fetch_type = this.controller.mapping[type][page_name],
            view = App.View.get(full_name, this),
            page = view.page,
            options = view.accept_options ? view.save_options() : {};

        $('.current_page, .page_loaded').removeClass('current_page, page_loaded');
        page.addClass('current_page');

        if (!force && this.is_view_for(view, obj, options)) {
            this.post_render_page(page, type, full_name);
        } else {
            this.nodes[type][full_name].refresh_control.addClass('ui-disabled');
            view.reset();
            if (view.accept_options) {
                view.page.data('current-options', $.param(options));
            }
            obj.fetch_full(fetch_type, function() {
                that['update_' + type + '_navbar'](obj);
                that.render_page(type, page_name, obj, force);
            }, options, force);
        }
    };

    Display.prototype.update_view = function(name, obj, force) {
        App.View.get(name, this).update(obj, force);
    };

    Display.prototype.render_page = function(type, name, obj, force) {
        var full_name = type + '_' + name,
            page = $('#' + full_name);
        if (!this.is_current_page(page, obj)) { return; }
        this.update_view(full_name, obj, force);
        page.data('current-for', obj.id);
        this.post_render_page(page, type, full_name);
    };

    Display.prototype.post_render_page = function(page, type, full_name) {
        $.mobile.loading('hide');
        page.addClass('page_loaded');
        this.nodes[type][full_name].refresh_control.removeClass('ui-disabled ui-btn-active');
    };

    Display.prototype.render_widgets = function(node) {
        node.find(":jqmData(role=listview)").listview();
        node.find(":jqmData(role=collapsible-set)").collapsibleset();
        node.find(":jqmData(role=collapsible)").collapsible();
        node.find(":jqmData(role=button)").button();
        node.find(":jqmData(role=table)").table();
    };

    Display.prototype.create_events_list_items = function(events) {
        var day_template = this.get_template('event-list-day'),
            event_template = this.get_template('event-list-item'),
            items = [],
            cur_day = null,
            li, event;

        for (var i=0; i<events.length; i++) {
            event = events[i];
            if (event.day != cur_day) {
                li = day_template.clone();
                li.html(event.day);
                cur_day = event.day;
                items.push(li);
            }

            li = event_template.clone();
            li.html(event.html);
            if (i == events.length - 1 ) {
                li.addClass('ui-last-child');
            }
            items.push(li);
        }

        return items;
    };

    Display.prototype.confirm_new_fech_full = function(error) {
        var error_text = '';
        $.mobile.loading('hide');
        if (error) {
            if (error.statusText) {
                error_text = error.statusText;
            }
            if (error.status) {
                if (error.statusText) {
                    error_text += ' - ';
                }
                error_text += error.status;
            }
        }
        if (!error_text) {
            error_text = 'undefined error';
        }
        var result = confirm('Unable to fetch (' + error_text + '), retry ?');
        if (result) {
            $.mobile.loading('show');
        } else {
            history.go(-1);
        }
        return result;
    };

    Display.prototype.get_template = function(name) {
        if (!this.templates[name]) {
            this.templates[name] = this.templates_container.find('[data-template-for=' + name + ']');
        }
        return this.templates[name];
    };


    Display.prototype.clear_listview = function(node, failover, refresh) {
        node.children(':not(.ui-li-divider)').remove();
        if (failover) {
            node.append('<li class="failover">' + failover + '</li>');
        }
        if (refresh) {
            node.listview('refresh');
        }
    };


    App.Display = Display;

})(Reposio);
