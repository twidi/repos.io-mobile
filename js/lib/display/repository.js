(function(App) {

    App.Display.prototype.pages_list.repository = [
        { id: 'home', title: 'Details',  method: 'details' },
        { id: 'activity' },
        { id: 'contributors' },
        { id: 'forks', count: true },
        { id: 'stars', count: true }
    ];

    App.Display.prototype.change_repository = function() {
        $('.repository_forks-count').hide();
        $('.repository_stars-count').hide();

        for (var i=0; i<this.pages_list.repository.length; i++) {
            var page = this.pages_list.repository[i];
            for (var j=0; j<page.nodes.links.length; j++) {
                page.nodes.links[j].href = '#' + page.id + '!repository=' + this.controller.repository.id;
            }
            page.nodes.header.html(this.controller.repository.id + ' - ' + page.title);
            page.nodes.page.removeData('current-for');
        }

    };

    App.Display.prototype.repository_link = function(full_name, repo_name, provider_name) {
        full_name = full_name.replace('/', ':');
        return '<a class="mini-button" data-role="button" data-inline="true" data-mini="true" data-theme="b" href="#repository_home!repository=' + full_name + '@' + provider_name + '">' + repo_name + '</a>';
    };

    App.Display.prototype.create_repositories_list_items = function(repositories, provider) {
        var template = this.get_template('repository-list-item'),
            items = [];
        for (var i=0; i<repositories.length; i++) {
            var repository = repositories[i],
                path = repository.full_name || repository.name,
                href = '#repository_home!repository=' + path.replace('/', ':') + '@' + provider.name,
                li = template.clone(),
                a = li.children('a'),
                path_holder = a.children('h4'),
                desc_holder = a.children('.repo-desc'),
                fork_holder = a.children('.repo-is-fork'),
                push_holder = a.children('.repo-last-push');

            a.attr('href', href);
            path_holder.html(path);

            if (repository.description) {
                desc_holder.html(repository.description);
            } else {
                desc_holder.remove();
            }

            if (!repository.fork) {
                fork_holder.remove();
            }

            if (repository.pushed_at) {
                push_holder.children('span').html(this.format_date(repository.pushed_at, true));
            } else {
                push_holder.remove();
            }

            items.push(li);
        }

        return items;
    };

    App.Display.prototype.update_repository_navbar = function(repository) {
        $('.go-button').find('.provider').html(repository.provider.name);
        $('.repository_forks-count').html(repository.details ? repository.details.forks_count : '?').show();
        $('.repository_stars-count').html(repository.details ? repository.details.watchers_count : '?').show();
    };

    App.Display.prototype.get_real_repository_page = function(page_name, repository) {
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
    };

})(Reposio);
