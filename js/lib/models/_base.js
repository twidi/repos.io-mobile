(function(App) {

    App.Models = {};

    App.Models.base = Class.$extend({

        __classvars__: {
            model_name: null,
            fields: {},
            cache: {},
            default_params: {},
            fetchable_params: {},
            get: (function Model__class__get (id, controller) {
                if (!this.cache[this.model_name]) {
                    this.cache[this.model_name] = {};
                }
                if (!this.cache[this.model_name][id]) {
                    this.cache[this.model_name][id] = new this(id, controller);
                }
                return this.cache[this.model_name][id];
            }), // get
            save_many_from_events: (function Model__save_many_from_events (events, provider, controller) {
                var event, account, repository, name;
                for (var i = 0; i < events.length; i++) {
                    event = events[i];
                    // create a user object only if avatar, useless if not
                    if (event.actor && event.actor.login && event.actor.avatar_url) {
                        account = App.Models.account.get(event.actor.login + '@' + provider.name, controller);
                        account.update_data('details', event.actor);
                    }
                    // create a repository only if at least desc and or last push date, useless if not
                    if (event.repository && event.repository.full_name && (event.repository.description || event.repository.pushed_at)) {
                        if (event.repository.full_name.indexOf('/') != -1) {
                            repository = App.Models.repository.get(event.repository.full_name + '@' + provider.name, controller);
                            repository.update_data('details', event.repository);
                        }
                    }
                    // in case of a fork, the forkee maybe a repository
                    if (event.type == 'ForkEvent' && event.forkee) {
                        repository = App.Models.repository.get(event.forkee.full_name + '@' + provider.name, controller);
                        repository.update_data('details', event.forkee);
                    }
                }
            }) // save_many_from_events
        }, // __classvars__

        __init__: (function Model__constructor (id, controller) {
            var parts = id.split('@');
            this.id = id;
            this.ref = parts[0];
            this.provider = controller.providers[parts[1]];
            this.controller = controller;
            this.list_page_status = {};
            this.details_fetched = false;
            this.flags = {};

            // create fields
            for (var field_name in this.__classvars__.fields) {
                if (this.__classvars__.fields[field_name] instanceof Array) {
                    this[field_name] = {};
                    this.list_page_status[field_name] = {__global__: {all:false}};
                } else {
                    this[field_name] = null;
                }
            }
        }), // __init__

        is_flag_set: (function Model__is_flag_set (flag_type) {
            return (typeof this.flags['flag_' + flag_type] != 'undefined');
        }), // is_flag_set

        is_flagged: (function Model__is_flagged (flag_type) {
            return !!this.flags['flag_' + flag_type];
        }), // is_flagged

        can_have_flag: (function Model__can_have_flag (flag_type) {
            return (this.$class.flags.indexOf(flag_type) !== -1);
        }), // can_have_flag

        set_flag: (function Model__set_flag (flag_type, value) {
            this.flags['flag_' + flag_type] = !!value;
        }), // set_flag

        is_type_list: (function Model__is_type_list (type) {
            return (this.$class.fields[type] instanceof Array);
        }), // is_type_list

        is_type_string: (function Model__is_type_string (type) {
            return (this.$class.fields[type] === '');
        }), // is_type_string

        update_data: (function Model__update_data (type, data, str_params) {
            if (this.is_type_list(type)) {
                this[type][str_params || ''] = data;
            } else if (this.is_type_string(type)) {
                this[type] = data;
            } else {
                if (this[type] === null) {
                    this[type] = {};
                }
                this[type] = $.extend(this[type], data);
            }
        }), // update_data

        get_list: (function Model__get_list (type, options, force_data) {
            var fetchable_params = this.filter_fetchable_params(type, options);
            if (this['sort_and_filter_' + type]) {
                var sort_and_filter = this.list_page_status[type].__global__.all;
                if (!sort_and_filter) {
                    var unfetchable_params = this.filter_unfetchable_params(type, options);
                    if (!_.isEmpty(unfetchable_params)) {
                        force_data = force_data || this[type][$.param(fetchable_params)];
                        sort_and_filter = true;
                    }
                }
                if (sort_and_filter) {
                    var result = this['sort_and_filter_' + type](options, force_data);
                    if (result !== null) { return result; }
                }
            }
            return force_data || this[type][$.param(fetchable_params)];
        }), // get_list

        filter_fetchable_params: (function Model__filter_fetchable_params (type, params) {
            params = params || {};
            if (this.$class.fetchable_params[type]) {
                return _.pick(params, this.$class.fetchable_params[type]);
            } else {
                return params;
            }
        }), // filter_fetchable_params

        filter_unfetchable_params: (function Model__filter_unfetchable_params (type, params) {
            params = params || {};
            if (this.$class.fetchable_params[type]) {
                return _.omit(params, this.$class.fetchable_params[type]);
            } else {
                return {};
            }
        }), // filter_unfetchable_params

        fetch: (function Model__fetch (type, success, failure, params, fail_if_404) {
            var model = this;
            params = params || {};
            if (this.$class.default_params[type]) {
                params = $.extend({}, this.$class.default_params[type], params);
                delete params.max_pages;
            }
            model.provider['get_' + model.$class.model_name + '_' + type](model.ref, function(err, data) {
                if (err && err.status == 404 && !fail_if_404) {
                    data = model.$class.fields[type];
                    err = null;
                }
                if (err) {
                    if (failure) { failure(err); }
                } else {
                    if (success) { success(data); }
                }
            }, params);
        }), // fetch

        fetched: (function Model__fetched (type, str_params) {
            if (this.is_type_list(type)) {
                if (this.list_page_status[type].__global__.all) { return true; }
                return (typeof this[type][str_params] != 'undefined');
            } else if (type == 'details') {
                return this.details_fetched;
            } else {
                return (this[type] !== null);
            }
        }), // fetched

        fetch_full: (function Model__fetch_full (type, callback, params, force, callback_error) {
            var model = this,
                str_params;

            params = this.filter_fetchable_params(type, params);
            str_params = $.param(params);

            if (type != 'details' && !model.fetched('details', '')) {
                model.fetch_full('details', function() {
                    model.fetch_full(type, callback, params, force);
                });
                return;
            }

            if (force && this.list_page_status[type]) {
                model.list_page_status[type].__global__ = {all: false};
            }

            if (force || !model.fetched(type, str_params)) {
                model.fetch(type,
                    function(data) {  // success
                        if (type == 'details') {
                            model.details_fetched = true;
                        }
                        model.update_data(type, data, str_params);
                        if (model.is_type_list(type)) {
                            model.update_list_page_status(type, params, 1, data ? data.length || 0 : 0);
                        }
                        callback();
                    },
                    function(err) {  // failure
                        model.controller.fetch_full_error(err, model, type, callback, params, force, callback_error);
                    },
                    params,
                    'fail_if_404'
                );
            } else {
                callback();
            }
        }), // fetch_full

        update_list_page_status: (function Model__update_list_page_status (type, params, page_number, last_length) {
            var default_params = this.$class.default_params[type] || {},
                str_params = $.param(params),
                max_pages = default_params.max_pages || null,
                per_page = default_params.per_page || null,
                maybe_more = true;
            if (!last_length) { maybe_more = false; }
            else if (max_pages && page_number >= max_pages) { maybe_more = false; }
            else if (per_page && last_length < per_page) { maybe_more = false; }
            this.list_page_status[type][str_params] = {
                last_page: page_number,
                maybe_more: maybe_more
            };
            if (maybe_more) {
                this.list_page_status[type].__global__ = {all: false};
            } else {
                this.list_page_status[type].__global__ = {
                    all: true,
                    params: params,
                    str_params: str_params
                };
                if (this['manage_global_for_' + type]) {
                    this['manage_global_for_' + type]();
                }
            }
        }), // update_list_page_status

        _fetch_more: (function Model___fetch_more (type, params, success, failure) {
            var model = this, str_params, final_params;
            params = this.filter_fetchable_params(type, params);
            str_params = $.param(params);
            final_params = $.extend({}, params, {
                page: model.list_page_status[type][str_params].last_page + 1
            });

            model.fetch(type,
                function(data) { //success
                    model[type][str_params] = model[type][str_params].concat(data);
                    model.update_list_page_status(type, params, final_params.page, data ? data.length || 0 : 0);
                    success(data);
                },
                failure,
                final_params
            );

        }), // _fetch_more

        fetch_more: (function Model__fetch_more (type, callback, params, callback_error) {
            var model = this;
            this.list_page_status[type].__global__ = {all: false};
            this._fetch_more(type, params, callback, function(err) {
                model.controller.fetch_more_error(err, model, type, callback, params, callback_error);
            });
        }), // fetch_more

        fetch_all: (function Model__fetch_all (type, page_callback, callback, params, callback_error) {
            var model = this, str_params;
            params = this.filter_fetchable_params(type, params);
            str_params = $.param(params);

            model.list_page_status[type].__global__ = {all: false};

            var one_fetch_success = function(data) {
                page_callback(data);
                if (model.list_page_status[type][str_params].maybe_more) {
                    one_fetch();
                } else {
                    callback();
                }
            };
            var one_fetch_error = function(err) {
                model.controller.fetch_all_error(err, model, type, page_callback, callback, params, callback_error);
            };
            var one_fetch = function() {
                model._fetch_more(type, params, one_fetch_success, one_fetch_error);
            };
            one_fetch();
        }), // fetch_all

        sort_and_filter_events: (function Model__sort_and_filter_events (options, data) {
            var display = options.mode === 'display',
                type_method, choices;
            if (!options.type) {
                return display ? data : [];
            }
            type_method = display ? _.filter : _.reject;
            choices = options.type.split(',');
            return type_method(data, function(event) { return (choices.indexOf(event.type) !== -1); });
        }) // sort_and_filter_events

    }); // Model

})(Reposio);
