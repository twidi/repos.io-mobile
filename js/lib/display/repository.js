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
            this.nodes.repository[page_name].content.html(' ');
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

    App.Display.prototype.get_markup_for_repository_home = function(repository) {
        var markup = '<ul data-role="listview" data-theme="e" class="repo-main"><li>';
        markup += '<div>';
        markup += '<strong>' + repository.details.name + '</strong>';
        markup += ' by ';
        markup += this.account_link(repository.details.owner.login, repository.provider.name);
        markup += '</strong></div>';
        if (repository.details.fork) {
            markup += '<div>Fork of <span class="repo-links">';
            markup += this.repository_link(repository.details.parent.full_name, repository.details.parent.name, repository.provider.name);
            markup += '<span> by <strong>' + repository.details.parent.owner.login + '</strong></span>';
            markup += '</span></div>';
        }
        markup += '<p class="last-push">Last push: ' + (repository.details.pushed_at ? this.format_date(repository.details.pushed_at, true) : 'never !') + '</p>';
        markup += '<p class="ui-li-aside ui-btn-up-c ui-btn-corner-all provider">' + repository.provider.name + '</p>';
        markup += '</li></ul>';

         markup += '<div data-role="collapsible-set" data-corners="false" data-theme="c" data-content-theme="d" data-inset="false" data-mini="true">';
        if (repository.details.description) {
            markup += '<div data-role="collapsible" data-collapsed="false"><h3>Description</h3><p>' + repository.details.description + '</p></div>';
        }
        if (repository.details.readme) {
            markup += '<div data-role="collapsible"' + (repository.details.description ? '' : ' data-collapsed="false"') + '><h3>Readme</h3><div class="readme-container">' + repository.details.readme + '</div></div>';
        }
        markup += '</div>';
        return markup;
    };

    App.Display.prototype.get_markup_for_repository_activity = function(repository) {
        var events = [];
        for (var i=0; i<repository.activity.length; i++) {
            var event = repository.provider.formatter.format(repository.activity[i], repository);
            if (event) { events.push(event); }
        }
        return this.get_markup_for_events(events);
    };

    App.Display.prototype.get_markup_for_repository_forks = function(repository) {
        var markup = this.get_markup_for_repositories(repository.forks, repository.provider);
        return markup;
    };

    App.Display.prototype.get_markup_for_repository_stars = function(repository) {
        var markup = this.get_markup_for_accounts(repository.stars, repository.provider);
        return markup;
    };

    App.Display.prototype.get_markup_for_repository_contributors = function(repository) {
        var aside_callback = function(account) {
                return '<p class="ui-li-aside count">' + account.contributions + '</p>';
            },
            markup = this.get_markup_for_accounts(repository.contributors, repository.provider, aside_callback);
        return markup;
    };

    App.Display.prototype.update_repository_navbar = function(repository) {
        $('.repository_forks-count').html(repository.details ? repository.details.forks_count : '?').show();
        $('.repository_stars-count').html(repository.details ? repository.details.watchers_count : '?').show(); };

})(Reposio);
