(function(App) {

    App.Display.prototype.pages.account = ['home', 'activity', 'repositories', 'stars', 'events', 'following', 'followers'];

    App.Display.prototype.change_account = function() {
        $('.repos-count').hide();
        $('.followers-count').hide();
        $('.following-count').hide();
        for (var page_name in this.nodes.account) {
            var links = this.nodes.account[page_name].links;
            for (var i=0; i<links.length; i++) {
                var link = $(links[i]),
                    href = '#' + page_name + '!account=' + this.controller.account.id;
                link.attr('href', href);

            }
            this.nodes.account[page_name].header.html(this.controller.account.id);
            this.nodes.account[page_name].content.html(' ');
            this.nodes.account[page_name].page.removeData('current-for');
        }
    };


    App.Display.prototype.account_link = function(user_name, provider_name) {
        return '<a class="mini-button" data-role="button" data-inline="true" data-mini="true" data-theme="a" href="#account_home!account=' + user_name + '@' + provider_name + '">' + user_name + '</a>'        
    };

    App.Display.prototype.get_markup_for_accounts = function(accounts, provider) {
        var markup = "<ul data-role='listview' class='accounts-list'>";

        for (var i=0; i<accounts.length; i++) {
            var account = accounts[i];
            markup += '<li>';
            markup += '<a href="#account_home!account=' + account.login + '@' + provider.name +'">' ;
            markup += '<img src="' + account.avatar_url + '" />';
            markup += account.login;
            markup += '</a>';
            markup += '</li>';
        }

        markup += "</ul>";

        return markup;
    };

    App.Display.prototype.get_markup_for_account_home = function(account) {
        var markup = '<ul data-role="listview" data-theme="e" class="account-main"><li>';
        markup += '<img src="' + account.details.avatar_url + '" />';
        markup += '<h3>' + account.username + '</h3>';
        if (account.details.name) {
            markup += '<p>' + account.details.name + '</p>';
        }
        markup += '<p class="ui-li-aside ui-btn-up-c ui-btn-corner-all provider">' + account.provider.name + '</p>'
        markup += '</li></ul>';
        markup += '<ul data-role="listview" data-theme="d" class="account-details">';
        if (account.details.company) {
            markup += '<li class="ui-li-has-icon"><span class="ui-li-icon ui-icon ui-icon-gear ui-icon-shadow"></span>' + account.details.company + '</li>'
        }
        if (account.details.location) {
            markup += '<li class="ui-li-has-icon"><span class="ui-li-icon ui-icon ui-icon-mappin ui-icon-shadow"></span>' + account.details.location + '</li>'
        }
        if (account.details.email && account.details.email.indexOf('@') !== -1) {
            markup += '<li class="ui-li-has-icon"><span class="ui-li-icon ui-icon ui-icon-email ui-icon-shadow"></span>' + account.details.email + '</li>'
        }
        markup += '<li class="ui-li-has-icon"><span class="ui-li-icon ui-icon ui-icon-calendar ui-icon-shadow"></span>Since ' + this.format_date(account.details.created_at) + '</li>'
        if (account.details.blog) {
            markup += '<li class="ui-li-has-icon"><span class="ui-li-icon ui-icon ui-icon-link ui-icon-shadow"></span><a href="' + account.details.blog + '">' + account.details.blog + '</a></li>'
        }
        markup += '</ul>'
        return markup;
    };

    App.Display.prototype.get_markup_for_account_repositories = function(account) {
        var markup = this.get_markup_for_repositories(account.repositories, account.provider);
        return markup;
    };

    App.Display.prototype.get_markup_for_account_stars = function(account) {
        var markup = this.get_markup_for_repositories(account.stars, account.provider);
        return markup;
    };

    App.Display.prototype.get_markup_for_account_activity = function(account) {
        var events = [];
        for (var i=0; i<account.own_events.length; i++) {
            var event = account.provider.formatter.format(account.own_events[i], account);
            if (event) { events.push(event); }
        }
        return this.get_markup_for_events(events);
    };

    App.Display.prototype.get_markup_for_account_events = function(account) {
        var events = [];
        for (var i=0; i<account.received_events.length; i++) {
            var event = account.provider.formatter.format(account.received_events[i], account);
            if (event) { events.push(event); }
        }
        return this.get_markup_for_events(events);
    };

    App.Display.prototype.get_markup_for_account_followers = function(account) {
        var markup = this.get_markup_for_accounts(account.followers, account.provider);
        return markup;
    };

    App.Display.prototype.get_markup_for_account_following = function(account) {
        var markup = this.get_markup_for_accounts(account.following, account.provider);
        return markup;
    };

    App.Display.prototype.update_account_navbar = function(account) {
        $('.repos-count').html(account.details ? account.details.public_repos : '?').show();
        $('.followers-count').html(account.details ? account.details.followers : '?').show();
        $('.following-count').html(account.details ? account.details.following : '?').show();
    };

})(Reposio);
