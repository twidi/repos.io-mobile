(function(App) {

    App.Display.prototype.pages.account = [
        { id: 'home', name: 'Details',  method: 'details' },
        { id: 'repositories', name: 'Repos', count: true },
        { id: 'activity', method: 'own_events' },
        { id: 'members', method: 'org_members' },
        { id: 'stars' },
        { id: 'following', count: true },
        { id: 'followers', count: true },
        { id: 'events', method: 'received_events' }
    ];

    App.Display.prototype.change_account = function() {
        $('.account_repositories-count').hide();
        $('.account_followers-count').hide();
        $('.account_following-count').hide();
        for (var page_name in this.nodes.account) {
            var links = this.nodes.account[page_name].links;
            for (var i=0; i<links.length; i++) {
                var link = $(links[i]),
                    href = '#' + page_name + '!account=' + this.controller.account.id;
                link.attr('href', href);

            }
            this.nodes.account[page_name].header.html(this.controller.account.id);
            this.nodes.account[page_name].page.removeData('current-for');
        }
    };


    App.Display.prototype.account_link = function(user_name, provider_name) {
        return '<a class="mini-button" data-role="button" data-inline="true" data-mini="true" data-theme="a" href="#account_home!account=' + user_name + '@' + provider_name + '">' + user_name + '</a>';
    };

    App.Display.prototype.create_accounts_list_items = function(accounts, provider) {
        var template = this.get_template('account-list-item'),
            items = [];
        for (var i=0; i<accounts.length; i++) {
            var account = accounts[i],
                href = '#account_home!account=' + account.login + '@' + provider.name,
                li = template.clone(),
                a = li.children('a'),
                img = a.children('img'),
                username_holder = a.children('.account-username');

            a.attr('href', href);
            username_holder.html(account.login);
            img.attr('src', account.avatar_url);

            if (account.html_extended) {
                a.append(account.html_extended);
            }

            items.push(li);
        }

        return items;
    };

    App.Display.prototype.update_account_navbar = function(account) {
        var is_org = (account.details && account.details.type.toLowerCase() == 'organization');
        $('.go-button').find('.provider').html(account.provider.name);
        $('.account_members-link').closest('li').toggle(is_org);
        $('.account_repositories-count').html(account.details ? account.details.public_repos : '?').show();
        $('.account_followers-count').html(account.details ? account.details.followers : '?').show();
        $('.account_following-count').html(account.details ? account.details.following : '?').show();
    };

    App.Display.prototype.get_real_account_page = function(page, account) {
        var is_org = (account.details && account.details.type.toLowerCase() == 'organization');
        switch(page) {
            case 'home':
                return 'https://github.com/' + account.username;
            case 'repositories':
                return 'https://github.com/' + account.username + '?tab=repositories';
            case 'activity':
                return is_org ? null : 'https://github.com/' + account.username + '?tab=activity';
            case 'followers':
                return 'https://github.com/' + account.username + '/followers';
            case 'stars':
            case 'following':
                return 'https://github.com/' + account.username + '/following';
            case 'members':
                return is_org ? 'https://github.com/' + account.username + '?tab=members' : null;
        }
        return null;
    };

})(Reposio);
