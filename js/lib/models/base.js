(function(App) {

    App.Models = {};

    App.Models.base = Class.$extend({

        __classvars__: {
            model_name: null,
            fields: {},
            cache: {},
            default_params: {},
            get: function(id, controller) {
                if (!this.cache[this.model_name]) {
                    this.cache[this.model_name] = {};
                }
                if (!this.cache[this.model_name][id]) {
                    this.cache[this.model_name][id] = new this(id, controller);
                }
                return this.cache[this.model_name][id];
            }
        },

        __init__: function(id, controller) {
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
                    this.list_page_status[field_name] = {};
                } else {
                    this[field_name] = null;
                }
            }
        },

        get_list: function(type, options) {
            return this[type][$.param(options)];
        },

        fetch: function(type, success, failure, params, fail_if_404) {
            var that = this;
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
        },

        fetched: function(type, params) {
            if (this.$class.fields[type] instanceof Array) {
                return (typeof this[type][params] != 'undefined');
            } else {
                return (this[type] !== null);
            }
        },

        fetch_full: function(type, callback, params, force, callback_error) {
            var that = this,
                is_list = (that.$class.fields[type] instanceof Array),
                str_params;

            params = params || {};
            str_params = $.param(params);

            if (type != 'details' && !that.details) {
                that.fetch_full('details', function() {
                    that.fetch_full(type, callback, params, force);
                });
                return;
            }

            if (force || !that.fetched(type, str_params)) {
                that.fetch(type,
                    function(data) {  // success
                        if (is_list) {
                            that[type][str_params] = data;
                            that.update_list_page_status(type, str_params, 1, data ? data.length || 0 : 0);
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
        },

        update_list_page_status: function(type, str_params, page_number, last_length) {
            var default_params = this.$class.default_params[type] || {},
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
        },

        _fetch_more: function(type, params, success, failure) {
            var that = this, str_params, final_params;
            params = params || {};
            str_params = $.param(params);
            final_params = $.extend({}, params, {
                page: this.list_page_status[type][str_params].last_page + 1
            });

            if (!this.list_page_status[type][str_params].maybe_more) {
                success([]);
                return;
            }

            that.fetch(type,
                function(data) { //success
                    that[type][str_params] = that[type][str_params].concat(data);
                    that.update_list_page_status(type, str_params, final_params.page, data ? data.length || 0 : 0);
                    success(data);
                },
                failure,
                final_params
            );

        },

        fetch_more: function(type, callback, params, callback_error) {
            var that = this;
            this._fetch_more(type, params, callback, function(err) {
                that.controller.fetch_more_error(err, that, type, callback, params, callback_error);
            });
        },

        fetch_all: function(type, page_callback, callback, params, callback_error) {
            var that = this, str_params;
            params = params || {};
            str_params = $.param(params);

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
        }

    });

})(Reposio);
