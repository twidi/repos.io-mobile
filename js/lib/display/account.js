(function(App) {

    App.Display.prototype.pages_list.account = [
        { id: 'home', title: 'Details',  method: 'details' },
        { id: 'repositories', title: 'Repos', count: true },
        { id: 'activity', method: 'own_events' },
        { id: 'members', method: 'org_members' },
        { id: 'stars' },
        { id: 'following', count: true },
        { id: 'followers', count: true },
        { id: 'events', method: 'received_events' }
    ];

    App.Display.prototype.change_account = (function Display__change_account () {
        $('.account_repositories-count').hide();
        $('.account_followers-count').hide();
        $('.account_following-count').hide();

        for (var i=0; i<this.pages_list.account.length; i++) {
            var page = this.pages_list.account[i];
            for (var j=0; j<page.nodes.links.length; j++) {
                page.nodes.links[j].href = '#' + page.id + '!account=' + this.controller.account.id;
            }
            page.nodes.header.html(this.controller.account.id + ' - ' + page.title);
            page.node.removeData('current-for');
        }
    }); // change_account

    App.Display.prototype.account_link = (function Display__account_link (user_name, provider_name) {
        return '<a class="account-link" href="#account_home!account=' + user_name + '@' + provider_name + '">' + user_name + '</a>';
    }); // account_link

    App.Display.prototype.create_accounts_list_items = (function Display__create_accounts_list_items (accounts, provider) {
        var template = this.get_template('account-list-item'),
            items = [];
        for (var i=0; i<accounts.length; i++) {
            var account = accounts[i],
                href = '#account_home!account=' + account.login + '@' + provider.name,
                li = template.cloneNode(true),
                a = li.getElementsByTagName('a')[0],
                a_children = a.children,
                img = a_children[0],
                username_holder = a_children[1],
                classes = [];

            a.href = href;
            username_holder.innerHTML = account.login;
            img.src = account.avatar_url;

            if (account.html_prepend) {
                $(a).prepend(account.html_prepend);
            }

            items.push(li);
        }

        return items;
    }); // create_accounts_list_items

    App.Display.prototype.update_account_navbar = (function Display__update_account_navbar (account) {
        var is_org = (account.details && account.details.type.toLowerCase() == 'organization');
        $('.go-button').find('.provider').html(account.provider.name);
        $('.account_members-link').closest('li').toggle(is_org);
        $('.account_repositories-count').html(account.details ? account.details.repos_count : '?').show();
        $('.account_followers-count').html(account.details ? account.details.followers_count : '?').show();
        $('.account_following-count').html(account.details ? account.details.following_count : '?').show();
    }); // update_account_navbar

    App.Display.prototype.get_real_account_page = (function Display__get_real_account_page (page_name, account) {
        var is_org = (account.details && account.details.type.toLowerCase() == 'organization');
        switch(page_name) {
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
    }); // get_real_account_page

})(Reposio);
