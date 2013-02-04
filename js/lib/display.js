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

    Display.prototype.views = {};
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
                markup += '<span class="nav-home"><a href="/" data-role="button" data-icon="home" data-iconpos="notext" data-rel="home">Home</a></span>';
                    markup += '<h3></h3>';
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

            markup += '</div>';

            all_markup += markup;

        }

        $('body').append(all_markup);

        this.nodes[type] = {};
        for (var m=0; m<this.pages[type].length; m++) {
            var final_page = this.pages[type][m],
                full_page_name = type + '_' + final_page.id,
                page_node = $('#' + full_page_name),
                template = this.templates_container.children('div[data-template-for='+full_page_name+']');

            // cache some page nodes
            this.nodes[type][full_page_name] = {
                links: $('a.' + full_page_name + '-link'),
                page: page_node,
                header: page_node.find(':jqmData(role=header)').find('h3'),
                content: page_node.children(":jqmData(role=content)")
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
            that.on_before_page_change(e, data);
        });
        $(document).on("pagechange", function() {

            if ($.mobile.activePage && $.mobile.activePage.hasClass('current_page') && !$.mobile.activePage.hasClass('page_loaded')) {
                $.mobile.loading('show');
            }
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
            this.controller['on_' + type + '_page_before_load'](obj, page);
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

    Display.prototype.has_view = function(name) {
        return !!this.views[name];
    };

    Display.prototype.reset_view = function(name) {
        var page = $('#' + name);
        if (!page.data('mobile-page')) {
            page.page();
        }
        this.views[name].reset(this);
    };

    Display.prototype.update_view = function(name, obj) {
        this.views[name].update(this, obj);
    };

    Display.prototype.render_page = function(type, name, obj) {
        var full_name = type + '_' + name,
            page = $('#' + full_name);
        if (!this.is_current_page(page, obj)) { return; }
        var content = this.nodes[type][full_name].content;

        if (this.has_view(full_name)) {
            this.update_view(full_name, obj);
        } else {
            var markup = this['get_markup_for_' + full_name](obj);

            content.html(markup);
            page.page();
            content.find(":jqmData(role=listview)").listview();
            content.find(":jqmData(role=collapsible-set)").collapsibleset();
            content.find(":jqmData(role=collapsible)").collapsible();
            content.find(":jqmData(role=button)").button();
            content.find(":jqmData(role=table)").table();
        }

        page.data('current-for', obj.id);
        this.post_render_page(page);
    };

    Display.prototype.post_render_page = function(page) {
        $.mobile.loading('hide');
        page.addClass('page_loaded');
    };

    Display.prototype.get_markup_for_events = function(events) {
        var markup = '<ul class="ui-listview list-events" data-mobile-listview=\'{"options":{}}\'>',  // data needed to prevent a bug in listview filter plugin
            cur_day = null;
        for (var i=0; i<events.length; i++) {
            if (events[i].day != cur_day) {
                markup += '<li class="ui-li ui-li-divider ui-bar-d">' + events[i].day + '</li>';
                cur_day = events[i].day;
            }
            markup += '<li class="ui-li ui-li-static ui-btn-up-c' + (i == events.length - 1 ? ' ui-last-child' : '') + '">' + events[i].str + '</li>';
        }
        markup += "</ul>";

        return markup;
    };

    Display.prototype.confirm_new_fech = function(error) {
        $.mobile.loading('hide');
        error = error || 'undefined error';
        var result = confirm('Unable to fetch (' + error + '), retry ?');
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

    App.Display = Display;

})(Reposio);
