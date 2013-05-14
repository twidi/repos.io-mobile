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
            flags: ['star'],
            default_params: {
                activity: {per_page: 30, max_pages: 10},
                forks: {per_page: 50},
                stars: {per_page: 50},
                contributors: {per_page: 100} // no pagination !?
            },
            fetchable_params: {
                forks: ['sort'],
                activity: []
            },
            sort_and_filter_helpers: {
                forks: {
                    sort_field: {newest: 'created_at', oldest: 'created_at', watchers: 'watchers_count'},
                    filter_never_updated: (function Repository__forks_fiter_never_updated (repository) {return repository.pushed_at <= repository.created_at; })
                }
            },
            save_many: (function Repository__save_many (repositories, provider, controller) {
                var repository;
                for (var i = 0; i < repositories.length; i++) {
                    repository = App.Models.repository.get(repositories[i].full_name + '@' + provider.name, controller);
                    repository.update_data('details', repositories[i]);
                }
            }) // save_many
        }, // __classvars__

        __init__: (function Repository__constructor (id, controller) {
            this.$super(id, controller);
            this.path = this.ref;
            this.href_id = this.id.replace('/', ':');
            var parts = this.path.split('/');
            this.details = {
                name: parts[1],
                user: {
                    login: parts[0]
                }
            };
        }), // __init__

        update_data: (function Repository__update_data (type, data, str_params) {
            this.$super(type, data, str_params);
            switch (type) {
                case 'details':
                    var owner = App.Models.account.get(this.details.user.login + '@' + this.provider.name, this.controller);
                    if (data.user) {
                        owner.update_data('details', data.user);
                    }
                    break;
                case 'forks':
                    App.Models.repository.save_many(data, this.provider, this.controller);
                    break;
                case 'stars':
                case 'contributors':
                    App.Models.account.save_many(data, this.provider, this.controller);
                    break;
                case 'activity':
                    App.Models.base.save_many_from_events(data, this.provider, this.controller);
                    break;
            }
        }), // update_data

        sort_and_filter_forks: (function Repository__sort_and_filter_forks (options, force_data) {
            var global = this.list_page_status.forks.__global__,
                helpers = this.$class.sort_and_filter_helpers.forks,
                data = force_data || this.forks[global.str_params];

            if (options.never_updated == 'hide') {
                data = _.reject(data, helpers.filter_never_updated);
            }

            data = _.sortBy(data, helpers.sort_field[options.sort]);
            if (options.sort != 'oldest') {
                data.reverse();
            }

            return data;
        }), // sort_and_filter_forks

        sort_and_filter_activity: (function Repository__sort_and_filter_activity (options, force_data) {
            var global = this.list_page_status.activity.__global__,
                data = force_data || this.activity[global.str_params];
            return this.sort_and_filter_events(options, data);
        }) // sort_and_filter_activity

    }); // Repository

})(Reposio);
