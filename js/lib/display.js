(function(App) {


    var Display = function(controller) {
        this.controller = controller;
    };

    Display.prototype.init = function() {
        this.templates_container = $('#templates');


        for (var obj_type in this.pages_list) {
            this.construct_pages(obj_type, this.pages_list[obj_type]);
        }

        $('body > p.loading').remove();
        $('html').removeClass('loading');

        $.mobile.initializePage();

        // not done automatically anymore ??
        $('div[data-role=page]:not(.ui-page)').page();

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
    Display.prototype.pages_list = {};  // to define pages in display/*.js
    Display.prototype.pages = {};  // to hold all final pages

    Display.prototype.construct_pages = function(type, pages) {

        for (var l=0; l<pages.length; l++) {
            var page = pages[l];
            page.name = page.id;  // name will be the right part, ie "home"
            page.id = type + '_' + page.name;  // id will be the full name, ie "account_home"
            page.type = type;
            if (!page.title) { page.title = page.name[0].toUpperCase() + page.name.slice(1); }
            if (!page.method) { page.method = page.name; }
        }

        var all_markup = '';
            extended_navbar = (pages.length > 4);

        for (var i=0; i<pages.length; i++) {
            var cur_page = pages[i],
                markup = '',
                navbar_pages = [];

            if (extended_navbar) {
                navbar_pages.push(pages[0]);
                navbar_pages.push(pages[1]);
                navbar_pages.push(pages[(i < 2) ? 2 : i]);  // if the current page is not in the navbar by default, display it in the third place
            } else {
                navbar_pages = pages;
            }

            markup = '<div data-role="page" id="' + cur_page.id + '">';

                markup += '<div data-role="header" data-id="' + type + '_pages" data-position="fixed" data-theme="a">';
                    markup += '<h3></h3>';
                    markup += '<a href="#main_menu_' + cur_page.id + '" data-icon="gear" data-iconpos="notext" data-rel="popup" class="ui-btn-right">Options</a>';
                    markup += '<div data-role="navbar">';
                        markup += '<ul' + (extended_navbar ? ' class="extended"' : '') + '>';
                        for (var j=0; j<navbar_pages.length; j++) {
                            var navbar_page = navbar_pages[j];
                            markup += '<li>';
                                markup += '<a href="#' + navbar_page.id + '"' + (j < i ?  ' data-direction="reverse"' : '') + ' class="' + (navbar_page.name == cur_page.name ? 'ui-btn-active ui-state-persist ' : '') + navbar_page.id + '-link">';
                                    markup += navbar_page.title;
                                    if (navbar_page.count) {
                                        markup += '<span class="' + navbar_page.id + '-count ui-li-count ui-btn-up-c ui-btn-corner-all">?</span>';
                                    }
                                markup += '</a>';
                            markup += '</li>';
                        }
                        if (extended_navbar) {
                            markup += '<li><a data-rel="popup" href="#menu_' + cur_page.id + '">...</a>';
                        }
                        markup += '</ul>';
                    markup += '</div>';
                markup += '</div>';

                markup += '<div data-role="content"></div>';

                if (extended_navbar) {
                    markup += '<div data-role="popup" id="menu_' + cur_page.id + '" data-theme="a" class="nav-menu">';
                        markup += '<ul data-role="listview" data-inset="true" data-theme="a">';

                        for (var k=0; k<pages.length; k++) {
                            var ext_page = pages[k];
                            markup += '<li>';
                                markup += '<a href="#' + ext_page.id + '" class="' + (ext_page.name == cur_page.name ? 'ui-btn-active ': '') + ext_page.id + '-link">';
                                    markup += ext_page.title;
                                    if (ext_page.count) {
                                        markup += '<span class="' + ext_page.id + '-count ui-li-count ui-btn-up-c ui-btn-corner-all">?</span>';
                                    }
                                markup += '</a>';
                            markup += '</li>';
                        }

                        markup += '</ul>';
                    markup += '</div>';
                }

                markup += '<div data-role="popup" id="main_menu_' + cur_page.id + '" data-theme="a" class="main-nav-menu">';
                    markup += '<div data-role="controlgroup" data-theme="a" >';
                        markup += '<a href="/" data-role="button" data-icon="home" data-rel="home" data-theme="a">Home</a>';
                        markup += '<label><input type="checkbox" name="fullscreen" class="fullscreen-control" id="fullscreen-' + cur_page.id + '" data-theme="a"/>Full screen</label>';
                        markup += '<a href="#" data-role="button" data-icon="refresh" class="refresh-control" data-theme="a">Refresh</a>';
                        markup += '<a href="#" data-role="button" data-icon="arrow-r" class="go-button" data-theme="a">View on <span class="provider"></span></a>';
                    markup += '</div>';
                markup += '</div>';

            markup += '</div>';

            all_markup += markup;

        }

        $('body').append(all_markup);

        for (var m=0; m<pages.length; m++) {
            var final_page = pages[m],
                page_node = $('#' + final_page.id),
                main_menu = $('#main_menu_' + final_page.id),
                template = this.templates_container.children('div[data-template-for=' + final_page.id + ']');

            // cache some page nodes
            final_page.nodes = {
                links: $('a.' + final_page.id + '-link'),
                page: page_node,
                header: page_node.find(':jqmData(role=header)').find('h3'),
                content: page_node.children(":jqmData(role=content)"),
                main_menu: main_menu,
                refresh_control: main_menu.find('.refresh-control'),
                go_button: main_menu.find('.go-button')
            };
            final_page.node = final_page.nodes.page;

            // insert page content
            if (template.length) {
                final_page.nodes.content.prepend(template.children());
                template.remove();
            }

            final_page.view = App.View.get(final_page, this);
            this.pages[final_page.id] = final_page;

        } // for

    }; // construct_pages

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
                var page = that.pages[data.toPage.data('url')],
                    go_button = page.nodes.go_button,
                    real_url = that['get_real_' + page.type + '_page'](page.name, that.controller[page.type]);
                go_button.toggleClass('ui-disabled', !real_url);
                go_button.attr('href', real_url || '');
            } catch(ex) {}
        });
        $('.nav-menu').on("popupafterclose", function() {
            // restore previous active link in navbar when closing popup menu
            var menu = $(this),
                link = menu.find('a.ui-btn-active'),
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
                opened = link.data('opened') || false;
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
            var page = that.pages[$.mobile.activePage.data('url')];
            $.mobile.loading('show');
            that.ask_for_page(page.id, that.controller[page.type].id, 'force');
            page.nodes.main_menu.popup('close');
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
        $('.fullscreen-control')
            .attr("checked", screenfull.isFullscreen)
            .each(function() {
                    try {
                        $(this).checkboxradio("refresh");
                    } catch(ex) {}
            });
    };

    Display.prototype.on_before_page_change = function(e, data) {
        var url = $.mobile.path.parseUrl(data.toPage),
            page_id, page;

        if (url.hash && data.options) {
            page_id = url.hash.slice(1);

            if (this.pages[page_id]) {
                page = this.pages[page_id];
                if (data.options.pageData && data.options.pageData[page.type]) {
                    $.mobile.loading('show');
                    this.ask_for_page(page.id, data.options.pageData[page.type]);
                    return;
                }
            }
        }

        if (page || !$(url.hash).length) {
            $.mobile.changePage($('#home'));
            e.preventDefault();
        }

    };

    Display.prototype.is_page_for = function(page, obj, options) {
        var current_for = page.node.data('current-for');
        if (!current_for || current_for != obj.id) { return false; }
        if (page.view.accept_options && page.node.data('current-options') != $.param(options)) {
            return false;
        }
        return true;
    };

    Display.prototype.ask_for_page = function(page_id, obj_id, force) {
        obj_id = obj_id.replace(':', '/');
        var that = this,
            page = this.pages[page_id],
            changed = this.controller.set_current_object(page.type, obj_id),
            obj = this.controller[page.type],
            options = page.view.accept_options ? page.view.save_options() : {};

        $('.current_page, .page_loaded').removeClass('current_page page_loaded');
        page.node.addClass('current_page');

        if (!force && this.is_page_for(page, obj, options)) {
            this.post_render_page(page);
        } else {
            page.nodes.refresh_control.addClass('ui-disabled');
            page.view.reset();
            if (page.view.accept_options) {
                page.node.data('current-options', $.param(options));
            }
            page.node.data('current-for', obj.id);
            obj.fetch_full(page.method, function() {
                that.render_page(page, obj, options, force);
            }, options, force);
        }
    };

    Display.prototype.ask_for_more = function(page) {
        var that = this,
            obj = this.controller[page.type],
            options = page.view.options;

        obj.fetch_more(page.method, function(data) {
            if (!that.is_page_for(page, obj, options)) { return; }
            page.view.complete(obj, data);
            page.view.update_load_buttons(obj);
            if (page.node.hasClass('current_page')) {
                $.mobile.loading('hide');
            }
        }, options, function() {
            page.view.enable_load_buttons();
        });
    };

    Display.prototype.ask_for_all = function(page) {
        var that = this,
            obj = this.controller[page.type],
            options = page.view.options;
        obj.fetch_all(page.method, function(data) {
            if (!that.is_page_for(page, obj, options)) { return; }
            page.view.complete(obj, data);
        }, function() {
            if (!that.is_page_for(page, obj, options)) { return; }
            if (page.node.hasClass('current_page')) {
                page.view.hide_load_buttons();
                $.mobile.loading('hide');
            }
        }, options, function() {
            page.view.enable_load_buttons();
        });
    };

    Display.prototype.render_page = function(page, obj, options, force) {
        if (!this.is_page_for(page, obj, options)) { return; }
        page.view.update(obj, force);
        if (page.node.hasClass('current_page')) {
            this['update_' + page.type + '_navbar'](obj);
            this.post_render_page(page);
        }
    };

    Display.prototype.post_render_page = function(page) {
        $.mobile.loading('hide');
        page.node.addClass('page_loaded');
        page.nodes.refresh_control.removeClass('ui-disabled ui-btn-active');
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

    Display.prototype.get_error_text = function(error) {
        var error_text = '';
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
        return error_text;
    };

    Display.prototype.confirm_new_fech = function(mode, text, error, callback_error) {
        $.mobile.loading('hide');
        var result = confirm('Unable to fetch ' + text + ' (' + this.get_error_text(error) + '), retry ?');
        if (result) {
            $.mobile.loading('show');
        } else {
            if (callback_error) {
                callback_error();
            } else {
                switch (mode) {
                    case 'full':
                        history.go(-1);
                        break;
                    case 'more':
                    case 'all':
                }
            }
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
