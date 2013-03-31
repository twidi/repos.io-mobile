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

    App.Display.prototype.repository_link = (function Display__repository_link (full_name, repo_name, provider_name) {
        full_name = full_name.replace('/', ':');
        return '<a class="repo-link" href="#repository_home!repository=' + full_name + '@' + provider_name + '">' + repo_name + '</a>';
    }); // repository_link

    App.Display.prototype.create_repositories_list_items = (function Display__create_repositories_list_items (repositories, provider) {
        var template = this.get_template('repository-list-item'),
            items = [];

        for (var i=0; i<repositories.length; i++) {
            var repository = repositories[i],
                path = repository.full_name || repository.name,
                href = '#repository_home!repository=' + path.replace('/', ':') + '@' + provider.name,
                li = template.cloneNode(true),
                a = li.getElementsByTagName('a')[0],
                a_children = a.children,
                path_holder = a_children[1],
                desc_holder = a_children[2],
                push_holder = a_children[3],
                classes = [];

            a.href = href;
            path_holder.innerHTML = path;

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
            items.push(li);
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
