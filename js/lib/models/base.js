(function(App) {

    App.Models = {};

    App.Models.base = Class.$extend({

        __classvars__: {
            model_name: null,
            fields: {},
            cache: {},
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

            // create fields
            for (var field_name in this.__classvars__.fields) {
                this[field_name] = null;
            }
        },

        fetch: function(type, success, failure, fail_if_404, params) {
            var that = this;
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

        fetch_all: function(type, page_success, success, failure, params) {
            var that = this,
                error = null,
                end = false,
                all_data = [],
                options = $.extend({}, params || {}, {page: 0}),
                one_fetch_success = function(data) {
                    if (!data || !data.length) {
                        // we're done
                        if (success) { success(all_data); }
                    } else {
                        // ask for another page (async)
                        one_fetch();
                        // add new fetched data
                        all_data = all_data.concat(data);
                        // launch the one page callback
                        if (page_success) { page_success(data, options.page); }
                    }
                },
                one_fetch = function() {
                    options.page += 1;
                    that.fetch(type, one_fetch_success, failure, false, options);
                };
            one_fetch();
        },

        fetch_full: function(type, callback, force) {
            var that = this;
            if (type != 'details' && !that.details) {
                that.fetch_full('details', function() {
                    that.fetch_full(type, callback);
                });
                return;
            }
            if (that[type] === null || force) {
                that.fetch(type,
                    function(data) {  // success
                        that[type] = data;
                        callback();
                    },
                    function(err) {  // failure
                        that.controller.fetch_full_error(err, that, type, callback);
                    },
                    'fail_if_404'
                );
            } else {
                callback();
            }
        }

    });

})(Reposio);
