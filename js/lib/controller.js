(function(App) {

    var Controller = function() {
        this.providers = {
            github: new Reposio.Providers.github(this)
        };
        this.account = null;
        this.repository = null;
        this.display = new Reposio.Display(this);
    };

    Controller.prototype.mapping = {
        account: {
            // page : object method
            home: 'details',
            repositories: 'repositories',
            stars: 'stars',
            activity: 'own_events',
            events: 'received_events',
            followers: 'followers',
            following: 'following'
        },
        repository: {
            home: 'details',
            activity: 'activity',
            forks: 'forks',
            stars: 'stars',
            contributors: 'contributors'
        }
    };

    Controller.prototype.init = function() {
        this.display.init();
        this.init_events();
    };

    Controller.prototype.set_account = function(account_id) {
        var changed = (this.account === null || this.account.id != account_id);
        if (changed) {
            this.account = Reposio.Models.Account.get(account_id, this);
            this.display.change_account();
        }
        this.display.update_account_navbar(this.account);
        return changed;
    };

    Controller.prototype.set_repository = function(repository_id) {
        var changed = (this.repository === null || this.repository.id != repository_id);
        if (changed) {
            this.repository = Reposio.Models.Repository.get(repository_id, this);
            this.display.change_repository();
        }
        this.display.update_repository_navbar(this.repository);
        return changed;
    };

    Controller.prototype.on_account_page_before_load = function(account_id, page_name) {
        var that = this,
            changed = this.set_account(account_id),
            account = this.account,
            render = function() {
                that.display.update_account_navbar(account);
                that.display.render_page('account', page_name, account);
            },
            fetch_type = this.mapping.account[page_name],
            page = $('#account_' + page_name);

        $('.current_page, .page_loaded').removeClass('current_page, page_loaded');
        page.addClass('current_page');
        if (this.display.is_page_for(page, account)) {
            this.display.post_render_page(page);
        } else {
            this.account.fetch(fetch_type, render);
        }
    };

    Controller.prototype.on_repository_page_before_load = function(repository_id, page_name) {
        repository_id = repository_id.replace(':', '/');
        var that = this,
            changed = this.set_repository(repository_id),
            repository = this.repository,
            render = function() {
                that.display.update_repository_navbar(repository);
                that.display.render_page('repository', page_name, repository);
            },
            fetch_type = this.mapping.repository[page_name],
            page = $('#repository_' + page_name);

        $('.current_page, .page_loaded').removeClass('current_page, page_loaded');
        page.addClass('current_page');
        if (this.display.is_page_for(page, repository)) {
            this.display.post_render_page(page);
        } else {
            this.repository.fetch(fetch_type, render);
        }
    };

    Controller.prototype.fetch_error = function(error, obj, fetch_type, original_callback, original_args) {
        if (this.display.confirm_new_fech(error.error)) {
            obj.fetch(fetch_type, original_callback, original_args);
        }
    };

    Controller.prototype.init_events = function() {
    };

    App.Controller = Controller;

})(Reposio);
