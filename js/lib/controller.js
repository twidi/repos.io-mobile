(function(App) {

    var Controller = function() {
        this.providers = {};
        for (var provider_name in App.Providers) {
            this.providers[provider_name] = new App.Providers[provider_name](this);
        }
        for (var model_name in App.Models) {
            this[model_name] = null;
        }
        this.display = new App.Display(this);
    };

    Controller.prototype.init = function() {
        this.display.init();
        this.init_events();
    };

    Controller.prototype.set_current_object = function(type, obj_id) {
        var changed = (this[type] === null || this[type].id != obj_id);
        if (changed) {
            this[type] = App.Models[type].get(obj_id, this);
            this.display['change_' + type]();
        }
        this.display['update_' + type + '_navbar'](this[type]);
        return changed;

    };

    Controller.prototype.fetch_full_error = function(error, obj, fetch_type, original_callback, original_params, original_force) {
        if (this.display.confirm_new_fech_full(error)) {
            obj.fetch_full(fetch_type, original_callback, original_params, original_force);
        }
    };

    Controller.prototype.init_events = function() {
    };

    App.Controller = Controller;

})(Reposio);
