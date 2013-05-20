(function(App) {


    var Display = (function Display__constructor (controller) {
        this.controller = controller;
    }); // Display

    Display.prototype.init = (function Display__init () {
        var display = this;
        this.need_favorites_redraw = true;
        this.templates_container = $('#templates');

        this.nodes = {
            body: $('body'),
            home: {
                'favorites': $('#home-favorites'),
                'anonymous': $('#welcome-anonymous'),
                'username': $('#welcome span'),
                'login_button': $('#home-login-button'),
                'no_login_button': $('.home-hide-no-login-button')
            }
        };

        for (var obj_type in this.pages_list) {
            this.construct_pages(obj_type, this.pages_list[obj_type]);
        }

        $.mobile.initializePage();
        display.init_events();

        var pages = $('div[data-role=page]:not(.ui-page)'),
            start_screen = $('#start-screen'),
            loader = $('#progress-loader'),
            pages_length = pages.length,
            delay_init_pages = (function Display__delay_init_pages (pages, step) {
                if (step < pages.length) {
                    var done = Math.max(6, Math.min(Math.round(100 * (step + 1) / pages_length), 100));
                    loader.css({width: done + '%'});
                    setTimeout((function Display__init_next_page() {
                        var page = pages.eq(step);
                        page.page();
                        delay_init_pages(pages, step+1);
                    }), 10);
                    if (step==2) {
                        $('html').removeClass('loading');
                    }
                } else {
                    var already_seen = $.jStorage.get('start_screen_seen');
                    loader.parent().html('Enjoy !');
                    start_screen.fadeOut(already_seen ? 'fast' : 1200, function() {
                        start_screen.remove();
                    });
                    $.jStorage.set('start_screen_seen', true);
                }

            }); // delay_init_pages

        delay_init_pages(pages, 0);

        if (this.controller.can_login) {
            $('#welcome-anonymous-cannot-login').hide();
            $('#welcome-anonymous-can-login').show();
            $('.auth-menu').show();
            this.toggle_auth_infos();
        }
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

    Display.prototype.is_light_color = (function Display__is_light_color(color) {
        var r, g, b, yiq;
        try {
            color = color.replace('#', '');
            if (color.length == 3) {
                color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
            }
            r = parseInt(color.substr(0, 2), 16);
            g = parseInt(color.substr(2, 2), 16);
            b = parseInt(color.substr(4, 2), 16);
            yiq = ((r*299)+(g*587)+(b*114))/1000;
            return (yiq >= 128);
        } catch(ex) {
            return true;
        }
    }); // is_light_color

    Display.prototype.nodes = {};
    Display.prototype.template_sources = {};
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
            extended_navbar = (pages.length > 4),
            footer_template = {
                account: this.get_template_source('account-footer'),
                repository: this.get_template_source('repository-footer')
            };

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

                markup += '<div data-role="header" data-id="' + type + '_pages" data-position="fixed" data-theme="a" class="header">';
                    markup += '<h3></h3>';
                    markup += '<a href="#main_menu_' + cur_page.id + '" id="main_menu_' + cur_page.id + '_opener" data-icon="gear" data-iconpos="notext" data-rel="popup" class="ui-btn-right">Options</a>';
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

                markup += footer_template[pages[i].type];

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

        this.nodes.body.append(all_markup);

        for (var m=0; m<pages.length; m++) {
            var final_page = pages[m],
                page_node = $('#' + final_page.id),
                main_menu = $('#main_menu_' + final_page.id),
                footer = page_node.find('.footer'),
                template = this.get_template(final_page.id, true, true);

            // cache some page nodes
            final_page.nodes = {
                links: $('a.' + final_page.id + '-link'),
                page: page_node,
                header: page_node.children(':jqmData(role=header)').children('h3'),
                content: page_node.children(":jqmData(role=content)"),
                main_menu: main_menu,
                footer: footer,
                refresh_control: footer.find('.refresh-control'),
                go_provider_control: footer.find('.go-provider-control'),
                favorite_control: footer.find('.favorite-control'),
                star_control: footer.find('.star-control'),
                watch_control: footer.find('.watch-control'),
                follow_control: footer.find('.follow-control')
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

    Display.prototype.update_go_provider_control = (function Display__update_go_provider_control (page, url) {
        page.nodes.go_provider_control.find('.provider').text(this.controller[page.type].provider.name);
        page.nodes.go_provider_control.toggleClass('ui-disabled', !url);
        page.nodes.go_provider_control.attr('href', url || '');
    }); // update_go_provider_control

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
                var page = display.pages[data.toPage.data('url')], real_url,
                    obj = display.controller[page.type];
                display.update_favorite_control(page);
                real_url = display['get_real_' + page.type + '_page'](page.name, obj);
                display.update_go_provider_control(page, real_url);
                display.update_star_control(page, obj);
                display.update_watch_control(page, obj);
                display.update_follow_control(page, obj);
                display.load_visible_images();
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
            var popup = $(this), opener = $('#' + this.id + '_opener');
            opener.addClass('popup-opened');
            if (!popup.children().length) {
                var template = display.get_template('main-nav-menu');
                popup.append(template.cloneNode(true));
                popup.trigger('create');

                var page = display.pages[$.mobile.activePage.data('url')],
                    auth_menu = page.nodes.main_menu.find('.auth-menu');
                auth_menu.find('.ui-btn-text').text(display.controller.current_user ? 'Logout' : 'Login');
                if (display.controller.can_login) { auth_menu.show(); }
            }
        })); // main-nav-menu popupbeforeposition

        $('.main-nav-menu').on("popupafterclose", (function Display__on_mainmenu_popupafterclose () {
            var opener = $('#' + this.id + '_opener');
            opener.removeClass('popup-opened');
        })); // main-nav-menu popupafterclose

        $(document).on('click', '.collapsible-trigger', (function Display__on_collapsible_trigger_click (e) {
            // open/close collapsible when clicking triggering links in list of events, issues...
            e.preventDefault();
            e.stopPropagation();
            var link = $(this),
                li = link.parents('li'),
                opened, collapsible, type, more;
            if (!link.hasClass('filled')) {
                link.addClass('filled');
                type = li[0].more_type;
                if (display['render_' + type + '_collapsible']) {
                    more = display['render_' + type + '_collapsible'](li);
                    if (more !== null) {
                        li.append('<div data-role="collapsible" data-content-theme="d" data-corners="false" data-mini="true" class="more"><h3>More</h3>' + more + '</div>');
                        collapsible =  li.children(':last');
                        collapsible.collapsible();
                        display.render_widgets(collapsible);
                        link.data('collapsible', collapsible);
                        setTimeout(function() {
                            collapsible.trigger('expand');
                        }, 100);
                    }
                }
            } else {
                opened = li.hasClass('more-opened');
                collapsible = link.data('collapsible');
                if (collapsible) { collapsible.trigger(opened ? 'collapse' : 'expand'); }
            }
            li.toggleClass('more-opened', !opened);
            return false;
        })); // collapsible-trigger.click

        $(document).on('click', '.events-list a.fetch-desc-trigger', (function Display__on_fetch_desc_trigger_click (e) {
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
                    if (data) { repository.update_data('details', data); }
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

            if (repository.details_fetched) {
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
            var page = display.pages[$.mobile.activePage.data('url')],
                options = page.view.accept_options ? page.view.get_options_from_form() : null;
            setTimeout((function Display__refresh_page() {
                $.mobile.loading('show');
                display.ask_for_page(page.id, display.controller[page.type].id, options, 'force');
            }), 100);
        })); // refresh-control.click

        $(document).on('click', '.favorite-control', (function Display__favorite_click (e) {
            e.preventDefault();
            e.stopPropagation();
            var page = display.pages[$.mobile.activePage.data('url')],
                options = page.view.accept_options ? page.view.get_options_from_form() : null,
                obj = display.controller[page.type],
                favorited = display.controller.toggle_favorite(obj, page, options);
            display.update_favorite_control(page, !!favorited);
        })); // favorite-control.click

        $(document).on('click', '.flag-control', (function Display__flag_click (e) {
            e.preventDefault();
            e.stopPropagation();
            var page = display.pages[$.mobile.activePage.data('url')],
                obj = display.controller[page.type],
                flag_type = $(this).data('flag');
            display['toggle_' + flag_type](page, obj);
        })); // flag-control.click

        $(window).on('scrollstop', display.load_visible_images);
        $(window).on('resize', display.load_visible_images);

        $.jStorage.listenKeyChange('favorites', function(key, action){
            display.controller.favorites = $.jStorage.get('favorites', []);
            display.ask_for_favorites_redraw();
        });

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

        display.nodes.home.no_login_button.on('click', (function Display__no_login_click (e) {
            e.preventDefault();
            e.stopPropagation();
            display.nodes.home.anonymous.fadeOut();
        })); // no_login_button.click

        display.nodes.home.login_button.on('click', (function Display__login_click (e) {
            e.preventDefault();
            e.stopPropagation();
            display.login();
        })); // login_button.click

        $(document).on('click', '.auth-menu', (function Display__auth_menu_click (e) {
            e.preventDefault();
            e.stopPropagation();
            var page = display.pages[$.mobile.activePage.data('url')];
            (page ? page.nodes.main_menu : $.mobile.activePage.find('.main-nav-menu')).popup('close');
            if (display.controller.current_user) {
                display.controller.logout();
            } else {
                display.login();
            }
        })); // auth_menu_click

    }); // init_events

    Display.prototype.load_visible_images = (function Display__load_visible_images () {
        var img, unloaded_imgs = $('img[data-original]:in-viewport:visible');
        for (var i = 0; i < unloaded_imgs.length; i++) {
            img = unloaded_imgs[i];
            img.src = img.getAttribute('data-original');
            img.removeAttribute('data-original');
        }
    }); // load_visible_images

    Display.prototype.update_fullscreen_control = (function Display__update_fullscreen_control () {
        $('.fullscreen-control')
            .attr("checked", screenfull.isFullscreen)
            .each(function() {
                    try {
                        $(this).checkboxradio("refresh");
                    } catch(ex) {}
            });
    }); // update_fullscreen_control

    Display.prototype.update_favorite_control = (function Display__update_favorite_control (page, favorited) {
        if (favorited !== false && favorited !== true) {
            favorited = this.controller.is_favorited(this.controller[page.type], page, page.view.accept_options ? page.view.get_options_from_form() : null);
        }
        page.nodes.favorite_control.toggleClass("selected", favorited);
    }); // update_favorite_control

    Display.prototype.user_can_flag = (function Display__user_can_flag (flag_type, obj) {
        if (!this.controller.current_user) { return false; }

        if (!obj.can_have_flag(flag_type)) { return false; }

        switch (flag_type) {
            case 'star':
                break;
            case 'watch':
                break;
            case 'follow':
                // user can't follow itself
                if (obj.$class.model_name == 'account' && obj.username == this.controller.current_user.username) {
                    return false;
                }
                break;
        }
        return true;
    }); // user_can_flag

    Display.prototype.update_flag_control = (function Display__update_flag_control (flag_type, page, obj, confirm_retry) {
        var display = this,
            page_for_obj = this.is_page_for_obj(page, obj),
            control = page.nodes[flag_type + '_control'],
            can_flag = this.user_can_flag(flag_type, obj);

        if (!can_flag || !obj.is_flag_set(flag_type)) {
            if (page_for_obj) {
                control.removeClass("selected");
                control.addClass("ui-disabled");
            }
            if (can_flag) {
                this.controller['check_' + flag_type](obj,
                    function(flagged) { // check on success
                        display.update_flag_control(flag_type, page, obj, confirm_retry);
                    }, // check on success
                    function() { // check on error
                        if (confirm(confirm_retry + '"' + obj.ref + '". Retry ?')) {
                            display.update_flag_control(flag_type, page, obj, confirm_retry);
                        }
                    } // check on error
                ); // controller.check
            }
        } else {
            if (page_for_obj) {
                control.removeClass("ui-disabled");
                control.toggleClass("selected", obj.is_flagged(flag_type));
            }
        }
    }); // update_flag_control

    Display.prototype.toggle_flag = (function Display__toggle_flag (flag_type, page, obj, confirm_retry) {
        var display = this,
            page_for_obj = this.is_page_for_obj(page, obj),
            control = page.nodes[flag_type + '_control'],
            can_flag = this.user_can_flag(flag_type, obj);

        if (!can_flag) { return; }

        if (page_for_obj) {
            $.mobile.loading('show');
            control.addClass("ui-disabled");
        }
        this.controller['toggle_' + flag_type](obj,
            function() { // toggle on success
                if (page_for_obj) {
                    display.update_flag_control(flag_type, page, obj, confirm_retry);
                    $.mobile.loading('hide');
                }
            }, // toggle on success
            function() { // toggle on error
                if (confirm(confirm_retry + '"' + obj.ref + '". Retry ?')) {
                    display.toggle_flag(flag_type, page, obj, confirm_retry);
                } else {
                    if (page_for_obj) {
                        display.update_flag_control(flag_type, page, obj, confirm_retry);
                        $.mobile.loading('hide');
                    }
                }
            } // toggle on error
        ); // controller.toggle
    }); // toggle_flag

    Display.prototype.update_star_control = (function Display__update_star_control (page, obj) {
        this.update_flag_control('star', page, obj, 'Unable to check if you star the repository ');
    }); // update_star_control

    Display.prototype.toggle_star = (function Display__toggle_star (page, obj) {
        this.toggle_flag('star', page, obj, 'Unable to toggle your star of the repository ');
    }); // toggle_star

    Display.prototype.update_watch_control = (function Display__update_watch_control (page, obj) {
        this.update_flag_control('watch', page, obj, 'Unable to check if you watch the repository ');
    }); // update_watch_control

    Display.prototype.toggle_watch = (function Display__toggle_watch (page, obj) {
        this.toggle_flag('watch', page, obj, 'Unable to toggle your watching of the repository ');
    }); // toggle_watch

    Display.prototype.update_follow_control = (function Display__update_follow_control (page, obj) {
        this.update_flag_control('follow', page, obj, 'Unable to check if you follow ');
    }); // update_follow_control

    Display.prototype.toggle_follow = (function Display__toggle_follow (page, obj) {
        this.toggle_flag('follow', page, obj, 'Unable to toggle your following of ');
    }); // toggle_follow

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

        if (url.hash == '#home') {
            this.refresh_home_favorites();
        }

    }); // on_before_page_change

    Display.prototype.is_page_for_obj = (function Display__is_page_for_obj (page, obj) {
        var current_for = page.node.data('current-for');
        if (!current_for || current_for != obj.id) { return false; }
        return true;
    }); // is_page_for_obj

    Display.prototype.is_page_for = (function Display__is_page_for (page, obj, options) {
        if (!this.is_page_for_obj(page, obj)) { return false; }
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
            page.view.reset(obj);
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
            li.more_type = 'event';
            li.event_data = {
                event: event.event,
                source: event.source,
                provider: event.provider
            };
            items.push(li);
        }

        return items;
    }); // create_events_list_items

    Display.prototype.create_issues_list_items = (function Display__create_issues_list_items (issues) {
        var template = this.get_template('issue-list-item'),
            items = [],
            li, issue, classes,
            a, a_children, number_holder, state_holder, title_holder,
            created_children, creator_avatar_holder, creator_holder,
            created_at_holder, infos_children, comments_holder,
            last_status_holder, last_status_date_holder;

        for (var i=0; i<issues.length; i++) {
            issue = issues[i];

            li = template.cloneNode(true);
            a = li.getElementsByTagName('a')[0];
            a_children = a.children;
            number_holder = a_children[0];
            state_holder = a_children[1].children[1];
            title_holder = a_children[2];
            created_children = a_children[3].children;
            creator_avatar_holder = created_children[0];
            creator_holder = created_children[1];
            created_at_holder = created_children[2];
            infos_children = a_children[4].children;
            comments_holder = infos_children[0];
            last_status_holder = infos_children[1];
            last_status_date_holder = infos_children[2];

            classes = [];

            a.href = issue.html_url;

            number_holder.innerHTML = issue.number;
            title_holder.innerHTML = this.escape_html(issue.title);
            state_holder.innerHTML = issue.state;

            created_at_holder.innerHTML = this.format_date(issue.created_at, true);
            creator_holder.innerHTML = issue.user.login;
            if (issue.user.avatar_url) {
                creator_avatar_holder.setAttribute('data-original', issue.user.avatar_url);
            }

            if (issue.state == 'closed' || issue.comments) {
                comments_holder.innerHTML = (issue.comments || 'No') + ' comment' + (issue.comments == 1 ? '' : 's');
                if (issue.state == 'closed') {
                    last_status_holder.innerHTML = 'closed';
                    last_status_date_holder.innerHTML = this.format_date(issue.closed_at, true);
                } else {
                    last_status_holder.innerHTML = 'updated';
                    last_status_date_holder.innerHTML = this.format_date(issue.updated_at, true);
                }
            } else {
                classes.push('no-infos');
            }

            classes.push('issue-' + issue.state);
            if (!issue.pull_request || !issue.pull_request.html_url) {
                classes.push('no-pr');
            }

            if ((!issue.labels || !issue.labels.length) && !issue.body_html && (!issue.milestone && !issue.milestone.id)) {
                classes.push('no-details');
            } else {
                li.more_type = 'issue';
                li.issue_data = issue;
            }

            if (classes.length) {
                li.className +=  ' ' + classes.join(' ');
            }

            items.push(li);
        }

        return items;
    }); // create_issues_list_items

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

    Display.prototype.get_template_source = (function Display__get_template_source (name) {
        if (!this.template_sources[name]) {
            var template_container = this.templates_container.find('[data-template-for=' + name + ']')[0];
            this.template_sources[name] = template_container.childNodes[0].nodeValue;
            template_container.parentNode.removeChild(template_container);
        }
        return this.template_sources[name];
    }); // get_template_source

    Display.prototype.get_template = (function Display__get_template (name, consume, return_container) {
        var source, template;
        if (!this.templates[name]) {
            template = document.createElement('div');
            template.innerHTML = this.get_template_source(name);
            if (!return_container) {
                template = template.removeChild(template.children[0]);
            }
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

    Display.prototype.get_favorites_items = (function Display__list_favorites () {
        var items = [], i, favorite, obj, provider;
        if (!this.controller.favorites.length) {
            this.controller.favorites = [{
                hash: '#account_home!account=twidi@github',
                model: 'account',
                ref: 'twidi',
                avatar_url: 'https://secure.gravatar.com/avatar/4929cd99d0f54b7fa03081f9ab8bb0d4',
                provider: 'github'
            }, {
                hash: '#repository_home!repository=twidi:repos.io-mobile@github',
                model: 'repository',
                ref: 'twidi/repos.io-mobile',
                avatar_url: 'https://secure.gravatar.com/avatar/4929cd99d0f54b7fa03081f9ab8bb0d4',
                description: 'A mobile application for Github',
                provider: 'github'
            }];
            if (!$.jStorage.get('favorites-managed')) {
                $.jStorage.set('favorites', this.controller.favorites);
            }
        }
        for (i = 0; i < this.controller.favorites.length; i++) {
            favorite = this.controller.favorites[i];
            provider = {name: favorite.provider};
            switch (favorite.model) {
                case 'account':
                    obj = { login: favorite.ref };
                    if (favorite.title) {
                        obj.login += ' - ' + favorite.title;
                    }
                    if (favorite.avatar_url) {
                        obj.avatar_url = favorite.avatar_url;
                    }
                    items.push(this.create_account_list_item(obj, provider, favorite.hash));
                    break;
                case 'repository':
                    obj = {
                        full_name: favorite.ref,
                        is_fork: favorite.is_fork,
                        description: favorite.description
                    };
                    if (favorite.title) {
                        obj.full_name += ' - ' + favorite.title;
                    }
                    if (favorite.avatar_url) {
                        obj.user = { avatar_url: favorite.avatar_url };
                    }
                    items.push(this.create_repository_list_item(obj, provider, favorite.hash));
                    break;
            }
        }
        return items;
    }); // get_favorites_items

    Display.prototype.ask_for_favorites_redraw = (function Display__ask_for_favorites_redraw () {
        this.need_favorites_redraw = true;
        if ($.mobile.activePage && $.mobile.activePage.data('url') == 'home') {
            this.refresh_home_favorites();
        }
    }); // ask_for_favorites_redraw

    Display.prototype.refresh_home_favorites = (function Display__refresh_home_favorites () {
        if (!this.need_favorites_redraw) { return; }
        var display = this,
            items = this.get_favorites_items();
        this.clear_listview(this.nodes.home.favorites);
        this.nodes.home.favorites.append(items);
        this.need_favorites_redraw = false;
        setTimeout(display.load_visible_images, 500);
        setTimeout(display.load_visible_images, 1000);
        setTimeout(display.load_visible_images, 2000);
    }); // refresh_home_favorites

    Display.prototype.login = (function Display__login () {
        window.open(this.controller.providers.github.login_url($.mobile.path.makeUrlAbsolute('github_login.html')));
    }); // login

    Display.prototype.logout = (function Display__logout () {
        this.toggle_auth_infos();
        this.update_controls_needing_auth();
    }); // logout

    Display.prototype.toggle_auth_infos = (function Display__toggle_auth_infos () {
        if (!this.controller.can_login) { return; }
        var logged = !!this.controller.current_user;
        $('.auth-menu .ui-btn-text, .auth-menu:not(.ui-btn)').text(logged ? 'Logout' : 'Login');
        if (logged) {
            this.nodes.home.anonymous.fadeOut();
            this.nodes.home.username.html(', <strong>' + this.controller.current_user.username + '</strong>');
            this.nodes.home.username.show();
        } else {
            this.nodes.home.anonymous.fadeIn();
            this.nodes.home.username.hide();
            this.nodes.home.username.html('');
        }
    }); // toggle_auth_infos

    Display.prototype.update_controls_needing_auth = (function Display__update_controls_needing_auth () {
        try {
            // update the flags buttons to be disabled on logout, unabled and
            // fetched from github on login
            var page = this.pages[$.mobile.activePage.data('url')];
            if (page) {
                this.update_star_control(page, this.controller[page.type]);
                this.update_watch_control(page, this.controller[page.type]);
                this.update_follow_control(page, this.controller[page.type]);
            }
        } catch(ex) {}
    }); // update_controls_needing_auth

    Display.prototype.login_success = (function Display__login_success () {
        this.toggle_auth_infos();
        this.update_controls_needing_auth();
        alert('You are now identified as ' + this.controller.current_user.username);
    }); // login_success

    Display.prototype.login_fail = (function Display__login_fail () {
        alert("Something goes wrong and we couldn't complete the authentication.");
    }); // login_fail

    Display.prototype.render_event_collapsible = (function Display__render_event_collapsible(li) {
        var ev_data = li[0].event_data;
        if (ev_data.provider['more_' + ev_data.event.type]) {
            return ev_data.provider['more_' + ev_data.event.type](ev_data.event, ev_data.source);
        } else {
            return null;
        }
    }); // render_event_collapsible

    Display.prototype.render_issue_collapsible = (function Display__render_issue_collapsible(li) {
        var issue = li[0].issue_data,
            parts = [],
            labels_part, label, body_part, milestone_part, assignee_part;

        if (issue.milestone && issue.milestone.id) {
            milestone_part = '<div class="issue-milestone"><strong>Milestone: </strong>' + this.escape_html(issue.milestone.title) + '</div>';
            parts.push(milestone_part);
        }

        if (issue.labels && issue.labels.length) {
            labels_part = '<ul class="issue-labels">';
            for (var i = 0; i < issue.labels.length; i++) {
                label = issue.labels[i];
                labels_part += '<li style="background:#' + label.color + '" class="' + (this.is_light_color(label.color) ? 'light' : 'dark' )+ '-label">' + label.name + '</li>';
            }
            labels_part += '</ul>';
            parts.push(labels_part);
        }

        if (issue.assignee && issue.assignee.id) {
            assignee_part = '<div class="issue-assignee"><strong>Assigned to: </strong>';
            assignee_part += this.account_link(issue.assignee.login, this.controller.repository.provider.name, issue.assignee.avatar_url);
            assignee_part += '</div>';
            parts.push(assignee_part);
        }

        if (issue.body_html) {
            if (parts.length) {
                parts.push('<hr />');
            }
            body_part = '<div class="issue-body">';
            body_part += '<div><strong>Description</strong>, by ' + this.account_link(issue.user.login, this.controller.repository.provider.name, issue.user.avatar_url) + '</div>';
            body_part += '<div class="markup">' + issue.body_html + '</div>';
            body_part += '</div>';
            parts.push(body_part);
        }

        return parts.join('');
    }); // render_issue_collapsible

})(Reposio);
