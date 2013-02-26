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

            sort_and_filter_helpers: {
                repositories: {
                    filter: function(item) {return (item.user.login == this.username); },
                    filter_method: {member: _.reject, owner: _.filter},
                    sort_field: {created: 'created_at', pushed: 'pushed_at', updated: 'updated_at', full_name: 'full_name'}
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

        sort_and_filter_repositories: function(options) {
            var global = this.list_page_status.repositories.__global__,
                helpers = this.$class.sort_and_filter_helpers.repositories,
                data = this.repositories[global.str_params];

            if (options.type != 'all') {
                data = helpers.filter_method[options.type](data, helpers.filter, this);
            }
            if (options.sort != global.params.sort) {
                data = _.sortBy(data, helpers.sort_field[options.sort]);
                if (options.direction == 'desc') {
                    data.reverse();
                }
            } else {
                if (options.direction != global.params.direction) {
                    data.reverse();
                    if (options.type == 'all') {
                        global.params.direction = options.direction;  // change the saved dir because we update real data
                    }
                }
            }
            return data;
        }

    });

})(Reposio);
