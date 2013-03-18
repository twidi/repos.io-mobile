(function(App) {

    var Controller = (function Controller__constructor () {
        this.providers = {};
        for (var provider_name in App.Providers) {
            this.providers[provider_name] = new App.Providers[provider_name](this);
        }
        for (var model_name in App.Models) {
            this[model_name] = null;
        }
        this.display = new App.Display(this);
    }); // Controller

    Controller.prototype.init = (function Controller__init () {
        this.display.init();
    }); // init

    Controller.prototype.set_current_object = (function Controller__set_current_object (type, obj_id) {
        var changed = (this[type] === null || this[type].id != obj_id);
        if (changed) {
            this[type] = App.Models[type].get(obj_id, this);
            this.display['change_' + type]();
        }
        this.display['update_' + type + '_navbar'](this[type]);
        return changed;

    }); // set_current_object

    Controller.prototype.fetch_full_error = (function Controller__fetch_full_error (error, obj, fetch_type, original_callback, original_params, original_force, original_callback_error) {
        if (this.display.confirm_new_fech('full', 'this page', error, original_callback_error)) {
            obj.fetch_full(fetch_type, original_callback, original_params, original_force, original_callback_error);
        }
    }); // fetch_full_error

    Controller.prototype.fetch_more_error = (function Controller__fetch_more_error (error, obj, fetch_type, original_callback, original_params, original_callback_error) {
        if (this.display.confirm_new_fech('more', 'more', error, original_callback_error)) {
            obj.fetch_more(fetch_type, original_callback, original_params, original_callback_error);
        }
    }); // fetch_more_error

    Controller.prototype.fetch_all_error = (function Controller__fetch_all_error (error, obj, fetch_type, original_page_callback, original_callback, original_params, original_callback_error) {
        if (this.display.confirm_new_fech('all', 'all', error, original_callback_error)) {
            obj.fetch_all(fetch_type, original_page_callback, original_callback, original_params, original_callback_error);
        }
    }); // fetch_all_error

    App.Controller = Controller;

})(Reposio);
