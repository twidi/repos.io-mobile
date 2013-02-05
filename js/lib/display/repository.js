(function(App) {

    App.Display.prototype.pages.repository = [
        { id: 'home', name: 'Details',  method: 'details' },
        { id: 'activity' },
        { id: 'contributors' },
        { id: 'forks', count: true },
        { id: 'stars', count: true }
    ];

    App.Display.prototype.change_repository = function() {
        $('.repository_forks-count').hide();
        $('.repository_stars-count').hide();
        for (var page_name in this.nodes.repository) {
            var links = this.nodes.repository[page_name].links;
            for (var i=0; i<links.length; i++) {
                var link = $(links[i]),
                    href = '#' + page_name + '!repository=' + this.controller.repository.href_id;
                link.attr('href', href);

            }
            this.nodes.repository[page_name].header.html(this.controller.repository.id);
            this.nodes.repository[page_name].page.removeData('current-for');
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

    App.Display.prototype.get_markup_for_repositories = function(repositories, provider) {
        var markup = "<ul data-role='listview' class='repos-list'>";

        for (var i=0; i<repositories.length; i++) {
            var repository = repositories[i],
                path = repository.full_name || repository.name;
            markup += '<li>';
            markup += '<a href="#repository_home!repository=' + path.replace('/', ':') + '@' + provider.name +'">' ;
            markup += '<h4>' + path + '</h4>';
            if (repository.description) {
                markup += '<p class="repo-desc">' + repository.description + '</p>';
            }
            if (repository.fork) {
                markup += '<p class="ui-li-aside ui-btn-up-e ui-btn-corner-all fork">fork</p>';
            }
            if (repository.pushed_at) {
                markup += '<p class="last-push">Last push: ' + this.format_date(repository.pushed_at, true) + '</p>';
            }
            markup += '</a>';
            markup += '</li>';
        }

        markup += "</ul>";

        return markup;
    };

    App.Display.prototype.update_repository_navbar = function(repository) {
        $('.repository_forks-count').html(repository.details ? repository.details.forks_count : '?').show();
        $('.repository_stars-count').html(repository.details ? repository.details.watchers_count : '?').show(); };

})(Reposio);
