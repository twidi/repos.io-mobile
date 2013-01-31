(function(App) {


    var Display = function(controller) {
        this.controller = controller;
        this.nodes = {};
    };

    Display.prototype.init = function() {
        // cache some page nodes
        var page_name, full_name, links, page, header;
        for (var obj_type in this.pages) {
            this.nodes[obj_type] = {};
            for (var page_index in this.pages[obj_type]) {
                page_name = this.pages[obj_type][page_index];
                full_page_name = obj_type + '_' + page_name
                page = $('#' + full_page_name);
                this.nodes[obj_type][full_page_name] = {
                    links: $('a.' + full_page_name + '-link'),
                    page: page,
                    header: page.find(':jqmData(role=header)').find('h3'),
                    content: page.children(":jqmData(role=content)")
                };
            }
        }

        this.init_events();
    };

    Display.prototype.format_date = function(str_date, show_time, show_seconds, time_only) {
        if (!str_date) { return '' };
        var parts = str_date.split('T');
        if (show_time) {
            var time = parts[1].slice(0, show_seconds ? 8 : 5);
            return (time_only ? '' : parts[0] + ' ') + time;
        } else {
            return parts[0];
        }
    };

    Display.prototype.pages = {};

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
                if (page.indexOf(obj_type + '_') == 0) {
                    type = obj_type;
                    break;
                }
            }
            if (type && data.options.pageData && data.options.pageData[type]) {
                page = page.slice(type.length+1);
                if (this.pages[type].indexOf(page) !== -1) {
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

    Display.prototype.render_page = function(type, name, obj) {
        var full_name = type + '_' + name,
            page = $('#' + full_name);
        if (!this.is_current_page(page, obj)) { return; }
        var content = this.nodes[type][full_name].content,
            markup = this['get_markup_for_' + full_name](obj);
        
        content.html(markup);
        page.page();
        content.find(":jqmData(role=listview)").listview();
        content.find(":jqmData(role=collapsible-set)").collapsibleset();
        content.find(":jqmData(role=collapsible)").collapsible();
        content.find(":jqmData(role=button)").button();
        content.find(":jqmData(role=table)").table();

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

    App.Display = Display;

})(Reposio);
