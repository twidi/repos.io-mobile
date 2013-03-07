(function(App) {

    App.Models.repository = App.Models.base.$extend({

        __classvars__: {
            model_name: 'repository',
            fields: {
                details: {},
                readme: '',
                activity: [],
                forks: [],
                stars: [],
                contributors: []
            },
            default_params: {
                activity: {per_page: 30, max_pages: 10},
                forks: {per_page: 50},
                stars: {per_page: 50},
                contributors: {per_page: 100} // no pagination !?
            },
            fetchable_params: {
                forks: ['sort']
            },
            sort_and_filter_helpers: {
                forks: {
                    sort_field: {newest: 'created_at', oldest: 'created_at', watchers: 'watchers_count'}
                }
            }
        },

        __init__: function(id, controller) {
            this.$super(id, controller);
            this.path = this.ref;
            this.href_id = this.id.replace('/', ':');
        },

        sort_and_filter_forks: function(options, force_data) {
            var global = this.list_page_status.forks.__global__,
                helpers = this.$class.sort_and_filter_helpers.forks,
                data = force_data || this.forks[global.str_params];

            data = _.sortBy(data, helpers.sort_field[options.sort]);
            if (options.sort != 'oldest') {
                data.reverse();
            }

            return data;
        }

    });

})(Reposio);
