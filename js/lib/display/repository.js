(function(App) {

    App.Display.prototype.pages_list.repository = [
        { id: 'home', title: 'Details',  method: 'details' },
        { id: 'activity' },
        { id: 'contributors' },
        { id: 'forks', count: true },
        { id: 'stars', count: true }
    ];

    App.Display.prototype.change_repository = (function Display__change_repository () {
        $('.repository_forks-count').hide();
        $('.repository_stars-count').hide();

        for (var i=0; i<this.pages_list.repository.length; i++) {
            var page = this.pages_list.repository[i];
            for (var j=0; j<page.nodes.links.length; j++) {
                page.nodes.links[j].href = '#' + page.id + '!repository=' + this.controller.repository.id.replace('/', ':');
            }
            page.nodes.header.html(this.controller.repository.path + ' - ' + page.title);
            page.node.removeData('current-for');
        }

    }); // change_repository

    App.Display.prototype.repository_link = (function Display__repository_link (name, provider_name, hide_owner) {
        var ref = name.replace('/', ':'),
            display_name = hide_owner ? ref.split(':')[1] : name;
        return '<a class="repo-link" href="#repository_home!repository=' + ref + '@' + provider_name + '">' + display_name + '</a>';
    }); // repository_link

    App.Display.prototype.create_repository_list_item = (function Display__create_repositorie_list_item (repository, provider, href) {
        var template = this.get_template('repository-list-item'),
            path = repository.full_name || repository.name,
            li = template.cloneNode(true),
            a = li.getElementsByTagName('a')[0],
            a_children = a.children,
            h_children = a_children[1].children,
            avatar_holder = h_children[0],
            path_holder = h_children[1],
            desc_holder = a_children[2],
            push_holder = a_children[3],
            classes = [];

        a.href = href || '#repository_home!repository=' + path.replace('/', ':') + '@' + provider.name,
        path_holder.innerHTML = path;

        if (repository.user && repository.user.avatar_url) {
            avatar_holder.setAttribute('data-original', repository.user.avatar_url);
        }

        if (repository.description) {
            desc_holder.innerHTML = repository.description;
        } else {
            classes.push('no-desc');
        }

        if (!repository.is_fork) {
            classes.push('no-fork');
        }

        if (repository.pushed_at) {
            push_holder.getElementsByTagName('span')[0].innerHTML = this.format_date(repository.pushed_at, true);
        } else {
            classes.push('no-date');
        }

        if (classes.length) {
            li.className +=  ' ' + classes.join(' ');
        }

        return li;
    }); // create_repository_list_item

    App.Display.prototype.create_repositories_list_items = (function Display__create_repositories_list_items (repositories, provider) {
        var items = [];
        for (var i=0; i<repositories.length; i++) {
            items.push(this.create_repository_list_item(repositories[i], provider));
        }
        return items;
    }); // create_repositories_list_items

    App.Display.prototype.update_repository_navbar = (function Display__update_repository_navbar (repository) {
        $('.go-button').find('.provider').html(repository.provider.name);
        $('.repository_forks-count').html(repository.details ? repository.details.forks_count : '?').show();
        $('.repository_stars-count').html(repository.details ? repository.details.watchers_count : '?').show();
    }); // update_repository_navbar

    App.Display.prototype.get_real_repository_page = (function Display__get_real_repository_page (page_name, repository) {
        switch(page_name) {
            case 'home':
            case 'activity':
                return 'https://github.com/' + repository.path;
            case 'contributors':
                return 'https://github.com/' + repository.path + '/contributors';
            case 'forks':
                return 'https://github.com/' + repository.path + '/network';
            case 'stars':
                return 'https://github.com/' + repository.path + '/stargazers';
        }
        return null;
    }); // get_real_repository_page

})(Reposio);
