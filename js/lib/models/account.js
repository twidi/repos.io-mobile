(function(App) {

    App.Models.account = App.Models.base.$extend({

        __classvars__: {
            model_name: 'account',
            fields: {
                details: {},
                repositories: [],
                stars: [],
                own_events: [],
                received_events: [],
                followers: [],
                following: [],
                org_members: [],
                orgs: null
            },
            default_params: {
                repositories: {per_page: 50},
                stars: {per_page: 50},
                own_events: {per_page: 30, max_pages: 10},
                received_events: {per_page: 30, max_pages: 10},
                followers: {per_page: 50},
                following: {per_page: 50},
                org_members: {per_page: 50}
            },
            fetchable_params: {
                repositories: ['direction', 'sort', 'type'],
                stars: ['direction', 'sort'],
                own_events: [],
                received_events: []
            },

            sort_and_filter_helpers: {
                repositories: {
                    filter_type: function(repository) {return (repository.user.login == this.username); },
                    filter_type_method: {member: _.reject, owner: _.filter},
                    filter_forks: function(repository) { return repository.is_fork; },
                    filter_forks_method: {no: _.reject, yes: _.filter},
                    sort_field: {created: 'created_at', pushed: 'pushed_at', updated: 'updated_at', full_name: 'full_name'}
                },
                stars: {
                    sort_field: {created: 'starred_order', updated: 'pushed_at'},
                    filter_forks: function(repository) { return repository.is_fork; },
                    filter_forks_method: {no: _.reject, yes: _.filter}
                }
            }
        },

        __init__: function(id, controller) {
            this.$super(id, controller);
            this.username = this.ref;
        },

        manage_global_for_repositories: function() {
            var global = this.list_page_status.repositories.__global__;
            if (global.params.type != 'all') {
                global.all = false;
            }
        },

        sort_and_filter_repositories: function(options, force_data) {
            var global = this.list_page_status.repositories.__global__,
                helpers = this.$class.sort_and_filter_helpers.repositories,
                data = force_data || this.repositories[global.str_params];

            if (options.type && options.type != 'all') {
                data = helpers.filter_type_method[options.type](data, helpers.filter_type, this);
            }
            if (options.forks && options.forks != 'all') {
                data = helpers.filter_forks_method[options.forks](data, helpers.filter_forks, this);
            }
            if (force_data || options.sort != global.params.sort) {
                data = _.sortBy(data, helpers.sort_field[options.sort]);
                if (options.direction == 'desc') {
                    data.reverse();
                }
            } else {
                if (options.direction != global.params.direction) {
                    data.reverse();
                    if (options.type == 'all') {
                        global.params.direction = options.direction;  // change the saved direction because we update real data
                    }
                }
            }
            return data;
        }, // sort_and_filter_repositories

        manage_global_for_stars: function() {
            var global = this.list_page_status.stars.__global__;
            if (global.params.sort != 'created') {
                global.all = false;
            }
        },

        sort_and_filter_stars: function(options, force_data) {
            var global = this.list_page_status.stars.__global__,
                helpers = this.$class.sort_and_filter_helpers.stars,
                data = force_data || this.stars[global.str_params];

            // hard stuff to keep starred order
            if ((!global.all && options.sort == 'created') || (global.all && !global.default_order_saved)) {
                if (global.all) {
                    global.default_order_saved = true;
                }

                if ((global.all ? global.params : options).direction == 'desc') {
                    data.reverse();
                    if (global.all) { global.params.direction = 'asc'; }
                }
                var incr_base = global.all ? '' : _.uniqueId();
                _.each(data, function(repository, index) {
                    repository.starred_order = incr_base + index;
                });
                if (!global.all && options.direction == 'desc') {
                    data.reverse();
                }
            }

            if (options.forks && options.forks != 'all') {
                data = helpers.filter_forks_method[options.forks](data, helpers.filter_forks, this);
            }

            if (force_data || options.sort != global.params.sort) {
                data = _.sortBy(data, helpers.sort_field[options.sort]);
                if (options.direction == 'desc') {
                    data.reverse();
                }
            } else {
                if (options.direction != global.params.direction) {
                    data.reverse();
                    global.params.direction = options.direction;  // change the saved direction because we update real data
                }
            }
            return data;
        }, // sort_and_filter_stars

        sort_and_filter_own_events: function(options, force_data) {
            var global = this.list_page_status.own_events.__global__,
                data = force_data || this.own_events[global.str_params];
            return this.sort_and_filter_events(options, data);
        },

        sort_and_filter_received_events: function(options, force_data) {
            var global = this.list_page_status.received_events.__global__,
                data = force_data || this.received_events[global.str_params];
            return this.sort_and_filter_events(options, data);
        }

    });

})(Reposio);
