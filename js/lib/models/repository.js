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
            }
        },

        __init__: function(id, controller) {
            this.$super(id, controller);
            this.path = this.ref;
            this.href_id = this.id.replace('/', ':');
        }

    });

})(Reposio);
