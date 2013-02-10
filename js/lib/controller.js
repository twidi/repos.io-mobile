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

    Controller.prototype.mapping = {};

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

    Controller.prototype.on_page_before_load = function(type, obj_id, page_name, force) {
        obj_id = obj_id.replace(':', '/');
        var that = this,
            changed = this.set_current_object(type, obj_id),
            obj = this[type],
            full_name = type + '_' + page_name,
            render = function() {
                that.display['update_' + type + '_navbar'](obj);
                that.display.render_page(type, page_name, obj, force);
            },
            fetch_type = this.mapping[type][page_name],
            page = $('#' + full_name);

        $('.current_page, .page_loaded').removeClass('current_page, page_loaded');
        page.addClass('current_page');
        if (!force && this.display.is_page_for(page, obj)) {
            this.display.post_render_page(page, type, full_name);
        } else {
            this.display.nodes[type][full_name].refresh_button.addClass('ui-disabled');
            this.display.reset_view(full_name);
            this[type].fetch_full(fetch_type, render, force);
        }
    };

    Controller.prototype.fetch_full_error = function(error, obj, fetch_type, original_callback) {
        if (this.display.confirm_new_fech_full(error)) {
            obj.fetch_full(fetch_type, original_callback);
        }
    };

    Controller.prototype.init_events = function() {
    };

    App.Controller = Controller;

})(Reposio);
