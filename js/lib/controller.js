(function(App) {

    var Controller = (function Controller__constructor () {
        this.providers = {};
        this.can_login = false;

        for (var provider_name in App.Providers) {
            this.providers[provider_name] = new App.Providers[provider_name](this);
            if (!this.can_login && this.providers[provider_name].can_login()) {
                this.can_login = true;
            }
        }


        for (var model_name in App.Models) {
            this[model_name] = null;
        }
        this.current_user = null; // assume only one provider for now

        this.favorites = $.jStorage.get('favorites', []);

        this.display = new App.Display(this);
    }); // Controller

    Controller.prototype.init = (function Controller__init () {
        this.get_current_user();
        this.display.init();
    }); // init

    Controller.prototype.set_current_object = (function Controller__set_current_object (type, obj_id) {
        var changed = (this[type] === null || this[type].id != obj_id);
        if (changed) {
            this[type] = App.Models[type].get(obj_id, this);
            this.display['change_' + type]();
        }
        this.display['update_' + type + '_navbar'](this[type]);
        return changed;

    }); // set_current_object

    Controller.prototype.fetch_full_error = (function Controller__fetch_full_error (error, obj, fetch_type, original_callback, original_params, original_force, original_callback_error) {
        if (this.display.confirm_new_fech('full', 'this page', error, original_callback_error)) {
            obj.fetch_full(fetch_type, original_callback, original_params, original_force, original_callback_error);
        }
    }); // fetch_full_error

    Controller.prototype.fetch_more_error = (function Controller__fetch_more_error (error, obj, fetch_type, original_callback, original_params, original_callback_error) {
        if (this.display.confirm_new_fech('more', 'more', error, original_callback_error)) {
            obj.fetch_more(fetch_type, original_callback, original_params, original_callback_error);
        }
    }); // fetch_more_error

    Controller.prototype.fetch_all_error = (function Controller__fetch_all_error (error, obj, fetch_type, original_page_callback, original_callback, original_params, original_callback_error) {
        if (this.display.confirm_new_fech('all', 'all', error, original_callback_error)) {
            obj.fetch_all(fetch_type, original_page_callback, original_callback, original_params, original_callback_error);
        }
    }); // fetch_all_error

    Controller.prototype.make_page_hash = (function Controller__make_page_hash (obj, page, options) {
        var hash = '#' + page.id + '!' + obj.$class.model_name + '=' + obj.ref.replace('/', ':') + '@' + obj.provider.name;
        // if (options) {
        //     hash += '&' + $.param(options);
        // }
        return hash;
    }); // make_page_hash

    Controller.prototype.toggle_favorite = (function Controller__add_favorite (obj, page, options, before) {
        var hash = this.make_page_hash(obj, page, options),
            len = this.favorites.length,
            favorite, favorited = false;
        this.favorites = _.reject($.jStorage.get('favorites', []), function(fav) { return fav.hash == hash; } );
        if (len == this.favorites.length) {
            // same length = not removed = add favorite
            favorite = this.create_favorite(hash, obj, page.title, options);
            this.favorites[before ? 'unshift' : 'push'](favorite);
            favorited = true;
        }
        $.jStorage.set('favorites', this.favorites);
        $.jStorage.set('favorites-managed', true);
        this.display.ask_for_favorites_redraw();
        return favorited;
    }); // add_favorite

    Controller.prototype.create_favorite = (function Controller__create_favorite (hash, obj, title, options) {
        var favorite = {
            hash: hash,
            model: obj.$class.model_name,
            ref: obj.ref,
            provider: obj.provider.name
        };
        if (title != 'Details') {
            favorite.title = title;
        }
        if (options && _.size(options) > 0) {
            favorite.options = options;
        }
        switch (obj.$class.model_name) {
            case 'account':
                if (obj.details && obj.details.avatar_url) {
                    favorite.avatar_url = obj.details.avatar_url;
                }
                break;
            case 'repository':
                if (obj.details.user && obj.details.user.avatar_url) {
                    favorite.avatar_url = obj.details.user.avatar_url;
                }
                if (obj.details.is_fork) {
                    favorite.is_fork = true;
                }
                if (obj.details.description) {
                    favorite.description = obj.details.description;
                }
                break;
            }
        return favorite;
    }); // create_favorite

    Controller.prototype.is_favorited = (function Controller__is_favorited (obj, page, options) {
        var hash = this.make_page_hash(obj, page, options);
        return !!(_.find(this.favorites, function(fav) { return fav.hash == hash; } ));
    });

    Controller.prototype.get_current_user = (function Controller__get_current_user () {
        this.current_user = $.jStorage.get('logged-user', null);
        if (!this.current_user) { return; }

        if (this.current_user.provider && this.providers[this.current_user.provider]) {
            if (!this.providers[this.current_user.provider].init_auth(this.current_user)) {
                this.current_user = null;
            }
        } else {
            this.current_user = null;
        }

        if (!this.current_user) {
            setTimeout(function() { controller.logout(); }, 500);
        }
    }); // get_current_user

    Controller.prototype.login = (function Controller__login (username, auth_data, provider) {
        this.current_user = auth_data;
        this.current_user.username = username;
        this.current_user.provider = provider;
        $.jStorage.set('logged-user', this.current_user);
        this.display.login_success();
    }); // logout

    Controller.prototype.logout = (function Controller__logout () {
        this.current_user = null;
        $.jStorage.deleteKey('logged-user');
        this.display.logout();
    }); // logout

    Controller.prototype.check_login = (function Controller__check_login (params) {
        var controller = this;
        setTimeout(function() {
            if (!params.provider || !controller.providers[params.provider]) {
                return controller.display.login_fail();
            }
            controller.providers[params.provider].check_login(
                params,
                (function Controller__check_login__success (user_data, auth_data) {

                    // cache the user
                    var current_user = App.Models.account.get(user_data.login+'@'+params.provider, controller);
                    current_user.update_data('details', user_data);
                    current_user.details_fetched = true;

                    // add a favorite if not already present
                    if (!controller.is_favorited(current_user, controller.display.pages.account_home)) {
                        var hash = controller.make_page_hash(current_user, controller.display.pages.account_home),
                            favorite = controller.create_favorite(hash, current_user, 'Details');
                        this.favorites = $.jStorage.get('favorites', []);
                        this.favorites.unshift(favorite);
                        $.jStorage.set('favorites', this.favorites);
                        controller.display.ask_for_favorites_redraw();
                    }

                    // log user !
                    controller.login(user_data.login, auth_data, params.provider);

                }), // Controller__check_login__success
                function() { controller.display.login_fail(); }
            );
        }, 1);
    }); // check_login

    App.Controller = Controller;

})(Reposio);
