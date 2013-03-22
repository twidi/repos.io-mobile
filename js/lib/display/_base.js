(function(App) {


    var Display = (function Display__constructor (controller) {
        this.controller = controller;
    }); // Display

    Display.prototype.init = (function Display__init () {
        var display = this;
        this.templates_container = $('#templates');

        for (var obj_type in this.pages_list) {
            this.construct_pages(obj_type, this.pages_list[obj_type]);
        }

        $.mobile.initializePage();
        display.init_events();

        var pages = $('div[data-role=page]:not(.ui-page)'),
            loader = $('#progress-loader'),
            pages_length = pages.length,
            delay_init_pages = (function Display__delay_init_pages (pages, step) {
                if (step < pages.length) {
                    var done = Math.max(6, Math.min(Math.round(100 * (step + 1) / pages_length), 100));
                    loader.css({width: done + '%'});
                    setTimeout((function Display__init_next_page() {
                        var page = pages.eq(step);
                        // console.time('CREATE ' + page[0].id);
                        page.page();
                        // console.timeEnd('CREATE ' + page[0].id);
                        delay_init_pages(pages, step+1);
                    }), 10);
                    if (step==2) {
                        $('html').removeClass('loading');
                    }
                } else {
                    $('#first-loader').remove();
                }

            }); // delay_init_pages

        delay_init_pages(pages, 0);

    }); // init

    

    Display.prototype.format_date = (function Display__format_date(str_date, show_time, show_seconds, time_only) {
        if (!str_date) { return ''; }
        var parts = str_date.split('T');
        if (show_time) {
            var time = parts[1].slice(0, show_seconds ? 8 : 5);
            return (time_only ? '' : parts[0] + ' ') + time;
        } else {
            return parts[0];
        }
    }); // format_date

    Display.prototype.escape_html = (function Display__escape_html(html) {
        if (!html) { return ''; }
        return html.indexOf('<') === -1 ? html : $('<div/>').text(html).html();
    }); // escape_html

    Display.prototype.nodes = {};
    Display.prototype.templates = {};
    Display.prototype.pages_list = {};  // to define pages in display/*.js
    Display.prototype.pages = {};  // to hold all final pages

    Display.prototype.construct_pages = (function Display__construct_pages(type, pages) {

        for (var l=0; l<pages.length; l++) {
            var page = pages[l];
            page.name = page.id;  // name will be the right part, ie "home"
            page.id = type + '_' + page.name;  // id will be the full name, ie "account_home"
            page.type = type;
            if (!page.title) { page.title = page.name[0].toUpperCase() + page.name.slice(1); }
            if (!page.method) { page.method = page.name; }
        }

        var all_markup = '',
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
                        markup += '<ul data-inset="true" data-theme="a">';

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
                markup += '</div>';

            markup += '</div>';

            all_markup += markup;

        }

        $('body').append(all_markup);

        for (var m=0; m<pages.length; m++) {
            var final_page = pages[m],
                page_node = $('#' + final_page.id),
                main_menu = $('#main_menu_' + final_page.id),
                template = this.get_template(final_page.id, true, true);

            // cache some page nodes
            final_page.nodes = {
                links: $('a.' + final_page.id + '-link'),
                page: page_node,
                header: page_node.children(':jqmData(role=header)').children('h3'),
                content: page_node.children(":jqmData(role=content)"),
                main_menu: main_menu,
                refresh_control: $(),
                go_button: $()
            };
            final_page.node = final_page.nodes.page;

            // insert page content
            if (template) {
                final_page.nodes.content.prepend(template.children);
            }

            final_page.view = App.View.get(final_page, this);
            this.pages[final_page.id] = final_page;

        } // for

    }); // construct_pages

    Display.prototype.update_go_button = (function Display__update_go_button (page, url) {
        var go_button = page.nodes.go_button;
        if (go_button.length) {
            go_button.find('.provider').text(this.controller[page.type].provider.name);
            go_button.toggleClass('ui-disabled', !url);
            go_button.attr('href', url || '');
        }
    }); // update_go_button

    Display.prototype.init_events = (function Display__init_events () {
        var display = this;

        $(document).on("pagebeforechange", (function Display__on_pagebeforechange (e, data) {
            if (typeof data.toPage !== "string") { return; }
            if (data.options.dataUrl) {
                data.options.dataUrl = data.options.dataUrl.replace('?', '!');
            }
            data.options.allowSamePageTransition = true;
            if (data.toPage == $.mobile.path.stripQueryParams(location.href.replace('!', '?'))) {
                data.options.transition = 'none';  // we stay on the same view
            }
            display.on_before_page_change(e, data);
        })); // pagebeforechange

        $(document).on("pagechange", (function Display__on_pagechange (e, data) {
            display.update_fullscreen_control();
            if ($.mobile.activePage && $.mobile.activePage.hasClass('current_page') && !$.mobile.activePage.hasClass('page_loaded')) {
                $.mobile.loading('show');
            }
            try {
                var page = display.pages[data.toPage.data('url')],
                    real_url = display['get_real_' + page.type + '_page'](page.name, display.controller[page.type]);
                page.nodes.main_menu.data('go-button-url', real_url);
                display.update_go_button(page, real_url);
            } catch(ex) {}
        })); // pagechange

        $('.nav-menu').on("popupafterclose", (function Display__on_navmenu_popupafterclose () {
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
        })); // popupafterclose

        $('.nav-menu').on("popupbeforeposition", (function Display__on_navmenu_popupbeforeposition () {
            var list = $(this).children('ul');
            if (!list.hasClass('ui-listview')) { list.listview(); }
        })); // nav-menu popupbeforeposition

        $('.main-nav-menu').on("popupbeforeposition", (function Display__on_mainmenu_popupbeforeposition () {
            var popup = $(this);
            if (!popup.children().length) {
                var template = display.get_template('main-nav-menu');
                popup.append(template.cloneNode(true));
                popup.trigger('create');
                var page = display.pages[$.mobile.activePage.data('url')];
                page.nodes.refresh_control = page.nodes.main_menu.find('.refresh-control');
                page.nodes.go_button = page.nodes.main_menu.find('.go-button');
                display.update_go_button(page, page.nodes.main_menu.data('go-button-url'));
            }
        })); // main-nav-menu popupbeforeposition

        $(document).on('click', '.list-events a.collapsible-trigger', (function Display__on_collapsible_trigger_click (e) {
            // open/close collapsible when clicking triggering links in list of events
            e.preventDefault();
            e.stopPropagation();
            var link = $(this),
                opened = link.hasClass('opened'),
                collapsible, ev_data, more, li;
            if (!link.hasClass('filled')) {
                link.addClass('filled');
                li = link.parents('li');
                ev_data = li[0].event_data;
                if (ev_data.provider['more_' + ev_data.event.type]) {
                    more = ev_data.provider['more_' + ev_data.event.type](ev_data.event, ev_data.source);
                    li.append(more);
                    collapsible =  li.children(':last');
                    collapsible.collapsible();
                    display.render_widgets(collapsible);
                    link.data('collapsible', collapsible);
                    setTimeout(function() {
                        collapsible.trigger(opened ? 'collapse' : 'expand');
                    }, 100);
                }
            } else {
                collapsible = link.data('collapsible');
                if (collapsible) { collapsible.trigger(opened ? 'collapse' : 'expand'); }
            }
            link.toggleClass('opened', !opened);
            return false;
        })); // collapsible-trigger.click

        $(document).on('click', '.list-events a.fetch-desc-trigger', (function Display__on_fetch_desc_trigger_click (e) {
            // fetch a repository to update its description when asked for
            e.preventDefault();
            e.stopPropagation();

            var link = $(this),
                repository_id = link.data('repository'),
                repository = App.Models.repository.get(repository_id, display.controller),

                set_content = (function Display__set_event_repo_desc_all(html) {
                    $('p.ui-li-desc[data-fetching-repository="' + repository_id + '"]').each((function Display__set_event_repo_desc_one () {
                        var desc = $(this);
                        desc.children().remove();
                        desc.append(html);
                    }));
                }), // set_content

                set_loading = (function Display__set_loading_repo_desc () {
                    var link = $(this),
                        desc = link.parent();
                    desc.children().remove();
                    desc.append('<em>loading...</em>').attr('data-fetching-repository', repository_id);
                }), // set loading

                on_success = (function Display__on_fetch_desc_success (data) {
                    var html;
                    repository.details = data;
                    if (repository.details.description) {
                        html = '<strong>' + display.escape_html(repository.details.description) + ' </strong>';
                    } else {
                        html = '<em>no description</em>';
                    }
                    set_content(html);
                }), // on_success

                on_failure = (function Display__on_fetch_desc_error (error) {
                    set_content('<em>Loading failed! (' + display.get_error_text(error) + ') </em><a href="#" class="fetch-desc-trigger" data-repository="' + repository.id + '">Retry ?</a>');
                }); // on_failure

            $('a.fetch-desc-trigger[data-repository="' + repository_id + '"]').each(set_loading);

            if (repository.details) {
                on_success();
            } else {
                repository.fetch( // type, success, failure, params, fail_if_404
                    'details',
                    on_success,
                    on_failure,
                    null,
                    'fail_if_404'
                );
            }
        })); // fetch-desc-trigger.click

        $(document).on('click', 'li.with-extension', (function Display__with_extension_click (e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).toggleClass('extended');
            return false;
        })); // with-extension.click

        $(document).on('click', '.refresh-control', (function Display__refresh_click (e) {
            e.preventDefault();
            e.stopPropagation();
            var page = display.pages[$.mobile.activePage.data('url')];
                options = page.view.accept_options ? page.view.get_options_from_form() : null;
            $.mobile.loading('show');
            display.ask_for_page(page.id, display.controller[page.type].id, options, 'force');
            page.nodes.main_menu.popup('close');
        })); // refresh-control.click

        if (screenfull.enabled) {
            $(document).on('change', '.fullscreen-control', (function Display__fullscreen_click (e) {
                $(this).parents('.main-nav-menu').popup('close');
                screenfull.toggle();
            })); // fullscreen.click
            screenfull.onchange = display.update_fullscreen_control;
        } else {
            var controls = $('.fullscreen-control');
            controls.parents('.ui-checkbox').add(controls.parents('label')).remove();
        }

    }); // init_events

    Display.prototype.update_fullscreen_control = (function Display__update_fullscreen_control () {
        $('.fullscreen-control')
            .attr("checked", screenfull.isFullscreen)
            .each(function() {
                    try {
                        $(this).checkboxradio("refresh");
                    } catch(ex) {}
            });
    }); // update_fullscreen_control

    Display.prototype.on_before_page_change = (function Display__on_before_page_change (e, data) {
        var url = $.mobile.path.parseUrl(data.toPage),
            page_id, page;

        if (url.hash && data.options) {
            page_id = url.hash.slice(1);

            if (this.pages[page_id]) {
                page = this.pages[page_id];
                if (data.options.pageData && data.options.pageData[page.type]) {
                    $.mobile.loading('show');
                    this.ask_for_page(page.id, data.options.pageData[page.type], _.omit(data.options.pageData, page.type));
                    return;
                }
            }
        }

        if (page || !$(url.hash).length) {
            $.mobile.changePage($('#home'));
            e.preventDefault();
        }

    }); // on_before_page_change

    Display.prototype.is_page_for = (function Display__is_page_for (page, obj, options) {
        var current_for = page.node.data('current-for');
        if (!current_for || current_for != obj.id) { return false; }
        if (page.view.accept_options && page.node.data('current-options') != $.param(options)) {
            return false;
        }
        return true;
    }); // is_page_for

    Display.prototype.ask_for_page = (function Display__ask_for_page (page_id, obj_id, url_params, force) {
        obj_id = obj_id.replace(':', '/');
        var display = this,
            page = this.pages[page_id],
            changed = this.controller.set_current_object(page.type, obj_id),
            obj = this.controller[page.type],
            options = page.view.accept_options ? page.view.manage_options(url_params) : {};

        $('.current_page, .page_loaded').removeClass('current_page page_loaded');
        page.node.addClass('current_page');

        page.node.data('title', page.nodes.header.text());

        if (!force && this.is_page_for(page, obj, options)) {
            this.post_render_page(page);
        } else {
            page.nodes.refresh_control.addClass('ui-disabled');
            page.view.reset();
            if (page.view.accept_options) {
                page.node.data('current-options', $.param(options));
            }
            page.node.data('current-for', obj.id);
            obj.fetch_full(page.method, (function Display__on_page_fetched () {
                display.render_page(page, obj, options, force);
            }), options, force);
        }
    }); // ask_for_page

    Display.prototype.ask_for_more = (function Display__ask_for_more (page) {
        var display = this,
            obj = this.controller[page.type],
            options = page.view.options;

        obj.fetch_more(page.method, (function Dislpay__on_more_fetched (data) {
            if (!display.is_page_for(page, obj, options)) { return; }
            page.view.complete(obj, data);
            page.view.update_load_buttons(obj);
            if (page.node.hasClass('current_page')) {
                $.mobile.loading('hide');
            }
        }), options, (function Display__on_ask_for_more_failed_and_canceled () {
            page.view.enable_load_buttons();
        }));
    }); // ask_for_more

    Display.prototype.ask_for_all = (function Display__ask_for_all (page) {
        var display = this,
            obj = this.controller[page.type],
            options = page.view.options;
        obj.fetch_all(page.method, (function Display__on_one_of_all_page_fetched (data) {
            if (!display.is_page_for(page, obj, options)) { return; }
            page.view.complete(obj, data);
        }), (function Display__on_all_pages_fetched () {
            if (!display.is_page_for(page, obj, options)) { return; }
            if (page.node.hasClass('current_page')) {
                page.view.hide_load_buttons();
                $.mobile.loading('hide');
            }
        }), options, (function Display__on_ask_for_all_failed_and_canceled () {
            page.view.enable_load_buttons();
        }));
    }); // ask_for_all

    Display.prototype.render_page = (function Display__render_page (page, obj, options, force) {
        if (!this.is_page_for(page, obj, options)) { return; }
        page.view.update(obj, force);
        if (page.node.hasClass('current_page')) {
            this['update_' + page.type + '_navbar'](obj);
            this.post_render_page(page);
        }
    }); // render_page

    Display.prototype.post_render_page = (function Display__post_render_page (page) {
        $.mobile.loading('hide');
        page.node.addClass('page_loaded');
        page.nodes.refresh_control.removeClass('ui-disabled ui-btn-active');
    }); // post_render_page

    Display.prototype.render_widgets = (function Display__render_widgets (node) {
        node.find(":jqmData(role=listview)").listview();
        node.find(":jqmData(role=collapsible-set)").collapsibleset();
        node.find(":jqmData(role=collapsible)").collapsible();
        node.find(":jqmData(role=button)").button();
        node.find(":jqmData(role=table)").table();
    }); // render_widgets

    Display.prototype.create_events_list_items = (function Display__create_events_list_items (events) {
        var day_template = this.get_template('event-list-day'),
            event_template = this.get_template('event-list-item'),
            items = [],
            cur_day = null,
            li, event;

        for (var i=0; i<events.length; i++) {
            event = events[i];
            if (event.day != cur_day) {
                li = day_template.cloneNode(true);
                li.innerHTML = event.day;
                cur_day = event.day;
                items.push(li);
            }

            li = event_template.cloneNode(true);
            li.innerHTML = event.html;
            li.event_data = {
                event: event.event,
                source: event.source,
                provider: event.provider
            };
            items.push(li);
        }

        return items;
    }); // create_events_list_items

    Display.prototype.get_error_text = (function Display__get_error_text (error) {
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
    }); // get_error_text

    Display.prototype.confirm_new_fech = (function Display__confirm_new_fech (mode, text, error, callback_error) {
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
    }); // confirm_new_fech

    Display.prototype.get_template = (function Display__get_template (name, consume, return_container) {
        var template_container, template;
        if (!this.templates[name]) {
            template_container = this.templates_container.find('[data-template-for=' + name + ']')[0];
            template = document.createElement('div');
            template.innerHTML = template_container.childNodes[0].nodeValue;
            if (!return_container) {
                template = template.removeChild(template.children[0]);
            }
            template_container.parentNode.removeChild(template_container);
            this.templates[name] = template;
        }
        template = this.templates[name];
        if (consume) {
            delete this.templates[name];
        }
        return template;
    }); // get_template


    Display.prototype.clear_listview = (function Display__clear_listview (node, failover, refresh) {
        node.children(':not(.ui-li-divider)').remove();
        if (failover) {
            node.append('<li class="failover">' + failover + '</li>');
        }
        if (refresh) {
            node.listview('refresh');
        }
    }); // clear_listview


    App.Display = Display;

})(Reposio);
