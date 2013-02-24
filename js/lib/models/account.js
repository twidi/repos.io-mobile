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
            }
        },

        __init__: function(id, controller) {
            this.$super(id, controller);
            this.username = this.ref;
        }

    });

})(Reposio);
