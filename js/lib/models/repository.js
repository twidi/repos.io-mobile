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
                contributors: [],
                issues: []
            },
            flags: ['star', 'watch'],
            default_params: {
                activity: {per_page: 30, max_pages: 10},
                forks: {per_page: 50},
                stars: {per_page: 50},
                contributors: {per_page: 100}, // no pagination !?
                issues: {per_page: 50}
            },
            fetchable_params: {
                forks: ['sort'],
                activity: [],
                issues: ['direction', 'sort', 'state' ]
            },
            sort_and_filter_helpers: {
                forks: {
                    sort_field: {newest: 'created_at', oldest: 'created_at', watchers: 'watchers_count'},
                    filter_never_updated: (function Repository__forks_fiter_never_updated (repository) {return repository.pushed_at <= repository.created_at; })
                },
                issues: {
                    sort_field: {created: 'created_at', updated: 'updated_at', comments: 'comments'},
                    filter_state: (function Repository__issues_filter_state (issue) { return issue.state == this; })
                }
            },
            save_many: (function Repository__save_many (repositories, provider, controller) {
                var repository;
                for (var i = 0; i < repositories.length; i++) {
                    repository = App.Models.repository.get(repositories[i].full_name + '@' + provider.name, controller);
                    repository.update_data('details', repositories[i]);
                }
            }), // save_many
            save_many_from_issues: (function Repository__save_many_from_issues (issues, provider, controller) {
                var issue, account, name;
                for (var i = 0; i < issues.length; i++) {
                    issue = issues[i];
                    // create a user object only if avatar, useless if not
                    if (issue.user && issue.user.login && issue.user.avatar_url) {
                        account = App.Models.account.get(issue.user.login + '@' + provider.name, controller);
                        account.update_data('details', issue.user);
                    }
                    // idem for the assigne
                    if (issue.assignee && issue.assignee.login && issue.assignee.avatar_url) {
                        account = App.Models.account.get(issue.assignee.login + '@' + provider.name, controller);
                        account.update_data('details', issue.assignee);
                    }
                }
            }) // save_many_from_issues
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
                case 'issues':
                    App.Models.repository.save_many_from_issues(data, this.provider, this.controller);
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
        }), // sort_and_filter_activity

        manage_global_for_issues: (function Repository__manage_global_for_issues () {
            var global = this.list_page_status.issues.__global__;
            // we may want to find a way to detect all for open AND all for closed
            // but currently we can't so we consider we never have all data
            // (or a way to consider global for open AND a global for closed)
            global.all = false;
        }), // manage_global_for_issues

        sort_and_filter_issues: (function Repository__sort_and_filter_issues (options, force_data) {
            var global = this.list_page_status.issues.__global__,
                helpers = this.$class.sort_and_filter_helpers.issues,
                data = force_data || this.issues[global.str_params];

            data = _.filter(data, helpers.filter_state, options.state);

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
        }) // sort_and_filter_issues

    }); // Repository

})(Reposio);
