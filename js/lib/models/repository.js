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
            }
        },

        __init__: function(id, controller) {
            this.$super(id, controller);
            this.path = this.ref;
            this.href_id = this.id.replace('/', ':');
        }

    });

})(Reposio);
