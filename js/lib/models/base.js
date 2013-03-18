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
            }) // get
        }, // __classvars__

        __init__: (function Model__constructor (id, controller) {
            var parts = id.split('@');
            this.id = id;
            this.ref = parts[0];
            this.provider = controller.providers[parts[1]];
            this.controller = controller;
            this.list_page_status = {};

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
            var that = this;
            params = params || {};
            if (this.$class.default_params[type]) {
                params = $.extend({}, this.$class.default_params[type], params);
                delete params.max_pages;
            }
            that.provider['get_' + that.$class.model_name + '_' + type](that.ref, function(err, data) {
                if (err && err.status == 404 && !fail_if_404) {
                    data = that.$class.fields[type];
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
            if (this.$class.fields[type] instanceof Array) {
                if (this.list_page_status[type].__global__.all) { return true; }
                return (typeof this[type][str_params] != 'undefined');
            } else {
                return (this[type] !== null);
            }
        }), // fetched

        fetch_full: (function Model__fetch_full (type, callback, params, force, callback_error) {
            var that = this,
                is_list = (that.$class.fields[type] instanceof Array),
                str_params;

            params = this.filter_fetchable_params(type, params);
            str_params = $.param(params);

            if (type != 'details' && !that.details) {
                that.fetch_full('details', function() {
                    that.fetch_full(type, callback, params, force);
                });
                return;
            }

            if (force && this.list_page_status[type]) {
                that.list_page_status[type].__global__ = {all: false};
            }

            if (force || !that.fetched(type, str_params)) {
                that.fetch(type,
                    function(data) {  // success
                        if (is_list) {
                            that[type][str_params] = data;
                            that.update_list_page_status(type, params, 1, data ? data.length || 0 : 0);
                        } else {
                            that[type] = data;
                        }
                        callback();
                    },
                    function(err) {  // failure
                        that.controller.fetch_full_error(err, that, type, callback, params, force, callback_error);
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
            var that = this, str_params, final_params;
            params = this.filter_fetchable_params(type, params);
            str_params = $.param(params);
            final_params = $.extend({}, params, {
                page: that.list_page_status[type][str_params].last_page + 1
            });

            that.fetch(type,
                function(data) { //success
                    that[type][str_params] = that[type][str_params].concat(data);
                    that.update_list_page_status(type, params, final_params.page, data ? data.length || 0 : 0);
                    success(data);
                },
                failure,
                final_params
            );

        }), // _fetch_more

        fetch_more: (function Model__fetch_more (type, callback, params, callback_error) {
            var that = this;
            this.list_page_status[type].__global__ = {all: false};
            this._fetch_more(type, params, callback, function(err) {
                that.controller.fetch_more_error(err, that, type, callback, params, callback_error);
            });
        }), // fetch_more

        fetch_all: (function Model__fetch_all (type, page_callback, callback, params, callback_error) {
            var that = this, str_params;
            params = this.filter_fetchable_params(type, params);
            str_params = $.param(params);

            that.list_page_status[type].__global__ = {all: false};

            var one_fetch_success = function(data) {
                page_callback(data);
                if (that.list_page_status[type][str_params].maybe_more) {
                    one_fetch();
                } else {
                    callback();
                }
            };
            var one_fetch_error = function(err) {
                that.controller.fetch_all_error(err, that, type, page_callback, callback, params, callback_error);
            };
            var one_fetch = function() {
                that._fetch_more(type, params, one_fetch_success, one_fetch_error);
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
