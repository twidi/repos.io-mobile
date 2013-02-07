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

        fetch: function(type, success, failure, fail_if_404) {
            var that = this;
            that.provider['get_' + that.$class.model_name + '_' + type](that.ref, function(err, data) {
                if (err && err.error == 404 && !fail_if_404) {
                    data = that.$class.fields[type];
                    err = null;
                }
                if (err) {
                    failure(err.error);
                } else {
                    success(data);
                }
            });
        },

        fetch_full: function(type, callback) {
            var that = this;
            if (type != 'details' && !that.details) {
                that.fetch_full('details', function() {
                    that.fetch_full(type, callback);
                });
                return;
            }
            if (that[type] === null) {
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
