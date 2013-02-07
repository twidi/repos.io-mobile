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
                orgs: []
            }
        },

        __init__: function(id, controller) {
            this.$super(id, controller);
            this.username = this.ref;
        }

    });

})(Reposio);
