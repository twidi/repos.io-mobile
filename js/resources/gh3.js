/*
    gh3.js
    Created : 2012.07.25 by k33g

    TODO :
        - Repositories for an organization
        - Search : http://developer.github.com/v3/search/
        - ...

    History :
        - 2012.07.25 : '0.0.1' : first version
        - 2012.07.26 : '0.0.2' : fixes
        - 2012.07.26 : '0.0.3' : gists pagination
        - 2012.07.28 : '0.0.4' :
            * refactoring : Gh3.Helper
            * gists filtering
            * gist comments filtering
            * file commits filtering
            * commits sorting
            * new Type : Gh3.Repositories (with pagination)
        - 2012.07.29 : '0.0.5' :
            * Gh3.Repositories : add search ability
            * add Gh3.Users : search user ability
        - 2012.07.29 : '0.0.6' :
            * async.js compliant
        - 2012.08.02 : '0.0.7' :
            * Node compliant for the future ... becareful to dependencies
*/

(function () {

    //var Gh3 = this.Gh3 = {}
    var root = this
    ,    Gh3
    ,    Kind
    ,    Collection
    ,    ItemContent
    ,    SingleObject
    ,    Fetchable
    ,    ReadmeFetcher
    ,    Base64;

    if (typeof exports !== 'undefined') {
        Gh3 = exports;
    } else {
        Gh3 = root.Gh3 = {};
    }

    Gh3.VERSION = '0.0.7'; //2012.08.02

    //Object Model Tools (helpers) like Backbone
    Kind = function(){};

    Kind.inherits = function (parent, protoProps, staticProps) {
        var child
            , ctor = function(){}
            , merge = function (destination, source) {
                for (var prop in source) {
                    destination[prop] = source[prop];
                }
        };
        //constructor ....
        if (protoProps && protoProps.hasOwnProperty('constructor')) {
            child = protoProps.constructor;
        } else {
            child = function(){ parent.apply(this, arguments); };
        }

        //inherits from parent
        merge(child, parent);

        ctor.prototype = parent.prototype;
        child.prototype = new ctor();

        //instance properties
        if(protoProps) { merge(child.prototype, protoProps); }

        //static properties
        if(staticProps) { merge(child, staticProps); }

        // Correctly set child's `prototype.constructor`.
        child.prototype.constructor = child;

        // Set a convenience property in case the parent's prototype is needed later.
        child.__super__ = parent.prototype;

        return child;

    };
    Kind.extend = function (protoProps, staticProps) {
        var child = Kind.inherits(this, protoProps, staticProps);
        child.extend = this.extend;
        return child;
    };


    if (!root.Base64) {
        Base64 = { //http://www.webtoolkit.info/javascript-base64.html

            // private property
            _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

            // public method for decoding
            decode : function (input) {
                var output = "";
                var chr1, chr2, chr3;
                var enc1, enc2, enc3, enc4;
                var i = 0;

                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                while (i < input.length) {

                    enc1 = this._keyStr.indexOf(input.charAt(i++));
                    enc2 = this._keyStr.indexOf(input.charAt(i++));
                    enc3 = this._keyStr.indexOf(input.charAt(i++));
                    enc4 = this._keyStr.indexOf(input.charAt(i++));

                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;

                    output = output + String.fromCharCode(chr1);

                    if (enc3 != 64) {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 != 64) {
                        output = output + String.fromCharCode(chr3);
                    }

                }

                output = Base64._utf8_decode(output);

                return output;

            },

            encode : function (input) {
                    var output = "";
                    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                    var i = 0;

                    input = Base64._utf8_encode(input);

                    while (i < input.length) {

                            chr1 = input.charCodeAt(i++);
                            chr2 = input.charCodeAt(i++);
                            chr3 = input.charCodeAt(i++);

                            enc1 = chr1 >> 2;
                            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                            enc4 = chr3 & 63;

                            if (isNaN(chr2)) {
                                    enc3 = enc4 = 64;
                            } else if (isNaN(chr3)) {
                                    enc4 = 64;
                            }

                            output = output +
                            this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                            this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

                    }

                    return output;
            },

            // private method for UTF-8 decoding
            _utf8_decode : function (utftext) {
                var string = "";
                var i = 0;
                var c = c1 = c2 = 0;

                while ( i < utftext.length ) {

                    c = utftext.charCodeAt(i);

                    if (c < 128) {
                        string += String.fromCharCode(c);
                        i++;
                    }
                    else if((c > 191) && (c < 224)) {
                        c2 = utftext.charCodeAt(i+1);
                        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                        i += 2;
                    }
                    else {
                        c2 = utftext.charCodeAt(i+1);
                        c3 = utftext.charCodeAt(i+2);
                        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                        i += 3;
                    }

                }

                return string;
            },

            // private method for UTF-8 encoding
            _utf8_encode : function (string) {
                    string = string.replace(/\r\n/g,"\n");
                    var utftext = "";

                    for (var n = 0; n < string.length; n++) {

                            var c = string.charCodeAt(n);

                            if (c < 128) {
                                    utftext += String.fromCharCode(c);
                            }
                            else if((c > 127) && (c < 2048)) {
                                    utftext += String.fromCharCode((c >> 6) | 192);
                                    utftext += String.fromCharCode((c & 63) | 128);
                            }
                            else {
                                    utftext += String.fromCharCode((c >> 12) | 224);
                                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                                    utftext += String.fromCharCode((c & 63) | 128);
                            }

                    }

                    return utftext;
            }

        };

        root.Base64 = Base64;
    }

    Gh3.Base64 = root.Base64;

    if (window.XDomainRequest) {
        try {
            new XDomainRequest();
            $.support.cors = true;
            $.ajaxSetup.xhr = function() { return new XDomainRequest(); };
        } catch (e) {}
    }

    Gh3.Helper = Kind.extend({

    },{
        protocol : "https",
        domain : "api.github.com",
        headers: {
            Origin: location.host,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json'
        },
        dataType: 'json',
        cache: true,
        callHttpApi : function (apiParams) {
            apiParams.url = Gh3.Helper.protocol + "://" + Gh3.Helper.domain + "/" + apiParams.service;
            if ($.support.cors) {
                apiParams.headers = $.extend({}, Gh3.Helper.headers, apiParams.headers || {});
                if (!apiParams.dataType) { apiParams.dataType = Gh3.Helper.dataType; }
                if (!apiParams.cache && apiParams.cache !== false) { apiParams.cache = Gh3.Helper.cache; }
                var success = apiParams.success;
                if ($.isFunction(success)) {
                    apiParams.success = function (data, textStatus, jqXHR) {
                        success.call(this, {data: data}, textStatus, jqXHR);
                    };
                }
            } else {
                //delete apiParams.service;
                apiParams.dataType = 'jsonp';
            }

            $.ajax(apiParams);
        }
    });


    /* Base objects */

    Fetchable = Kind.extend({
        /* Base class for all Github stuff (SingleObject and Collection).
         * This base class define base methods to fetch data and manage result
         * or errors.
         */
        constructor: function () {
            /* By default the object is not yet fetched
             */
            this.fetched = false;
        },
        _setData: function(data) {
            /* Take an object/hash of data and save properties in self.
             */
            if (!data) { return; }
            for(var prop in data) {
                this[prop] = data[prop];
            }
        },
        _onFetchSuccess: function(callback, result) {
            /* Called when a fetch call was successful, with the callback
             * to run, and the result got from the api call.
             * By default set the fetched flag to true, and call the callback
             * with err=null and result=this
             */
            this.fetched = true;
            if (callback) { callback(null, this); }
        },
        _onFetchError: function(callback, error) {
            /* Called when a fetch call resulted in an error, with the callback
             * to run and the given error.
             * By default call the callback with the error set.
             */
            if (callback) { callback(error); }
        },
        _service: function() {
            /* Must return the url to use by the fetch method. The url is
             * relative to the domain of the api. Ex: return 'users/k33g';
             */
            throw('Undefined service');
        },
        _defaultFetchCallParams: function() {
            /* Must return an object that will be used to enhance the fields
             * passed to "callHttpApi". Some stuff that can be updated:
             * - data
             * - dataType
             * - headers (Accept, Content-Type)
             */
            return {};
        },
        _preFetch: function(callback, querystring_args) {
            /* Called in the fetch method before really make the call to the
             * api.
             */
        },
        fetch: function(callback, querystring_args) {
            /* Make a call to the api then call the callback.
             * Start by calling _preFetch, then get default params with a call
             * to _defaultFetchCallParams. It's "data" field will be extended
             * with the given querystring_args.
             * Finally call callHttpApi with the url got from _service, and
             * callback defined around _onFetchSuccess and _onFetchError
             */
            var that = this,
                default_params, call_params, call_args;

            that._preFetch(callback, querystring_args);

            call_params = {
                service : that._service(),
                success : function(res) {
                    that._onFetchSuccess(callback, res);
                },
                error : function (res) {
                    that._onFetchError(callback, res);
                }
            };

            default_params = that._defaultFetchCallParams();

            if (querystring_args) {
                default_params.data = $.extend({}, default_params.data || {}, querystring_args);
            }

            Gh3.Helper.callHttpApi($.extend({}, default_params, call_params));
        } // fetch
    }); // Fetchable

    SingleObject = Fetchable.extend({
        /* This base class is used to fetch and manage single objects: a user, a
         * repository...
         * It's a simple extension of the main Fetchable class, by simply adding
         * a call to _setData on the constructor and when a fetch is successful
         */
        constructor : function (data) {
            SingleObject.__super__.constructor.call(this);
            this._setData(data);
        },
        _onFetchSuccess: function(callback, result) {
            this._setData(result.data);
            SingleObject.__super__._onFetchSuccess.call(this, callback, result);
        }
    });

    Collection = {}; // Simple container for all Collection classes

    Collection._Base = Fetchable.extend({
        /* The base of all collections, defining what to do with data when a
         * fetch is successful, with many overridable methods.
         * This class also provides many util methods based on underscore.
         */
        constructor: function (parent) {
            /* All collections take a parent as argument, which is the
             * SingleObject that hold the collections. For example, the
             * repository for a list of forks.
             */
            this.parent = parent;
            this.list = [];
            Collection._Base.__super__.constructor.call(this);
        },
        length: function() {
            /* Simple wrapper to get the length of the saved list
             */
            return this.list.length;
        },
        reverse: function () {
            /* Simple wrapper to reverse the list of saved items.
             * WARNING: it will update the internal list !
             */
            this.list.reverse();
        },
        sort: function(comparison_func) {
            /* Simple wrapper to sort the list of saved items using the
             * given callback as a comparison function.
             */
            if (comparison_func) {
                this.list.sort(comparison_func);
            } else {
                this.list.sort();
            }
        },
        getAll: function() {
            /* Return the whole list of saved items
             */
            return this.list;
        },
        filterBy: function(field, value) {
            /* Filter the list on the given field, with the given value.
               Return a list with matching items
             */
            return _.filter(this.list, function(item) {
                return item[field] == value;
            }, this);
        },
        getBy: function(field, value) {
            /* Filter the list on the given field, with the given value.
               Return the first matching item.
             */
            return _.find(this.list, function(item) {
                return item[field] == value;
            }, this);
        },
        getByName: function(name) {
            /* A wrapper arround getBy to quickly get an item based on its
             * "name" field
             */
            return this.getBy('name', name);
        },
        each: function(callback) {
            /* Call the callback for each item in the list
             */
            _.each(this.list, callback);
        },
        _onFetchSuccess: function(callback, result) {
            /* Called when a fetch is successful, to save items, via a call to
             * _setItems with result.data, before calling the callback with the
             * parent (the repository if a list of forks, for example)
             */
            this.fetched = true;
            this._setItems(result.data);
            if (callback) { callback(null, this.parent); }
        },
        _prepareItem: function(item) {
            /* Take a raw item (generally from the api) and prepare it
             * to make it usable (for example to add it to the internal list)
             * Used in the _addItem method
             */
            return item;
        },
        _addItem: function(item) {
            /* Add the given item to the list after passing it through the
             * _prepareItem method
            */
            this.list.push(this._prepareItem(item));
        },
        _addItems: function(items) {
            /* Add some items to the internal list, by calling _addItem on each
             */
            var that = this;
            _.each(items, function (item) {
                that._addItem(item);
            });
        },
        _setItems: function(items) {
            /* Reset the list and save it with each of the given items, by
             * calling _addItems
             */
            this.list = [];
            this._addItems(items);
        }

    }); // Collection._base


    /* Users */

    Gh3.User = SingleObject.extend({
        /* This class represent a Github user
         */
        constructor : function (login, user_infos) {
            /* The constructor take a mandatory login, which is the identifier
             * of a user on the Github side.
             * Other fields are passed to the super constructor to be passed to
             * the _setData method
             * Then, a lot of lists are defined.
             */

            if (login) {
                this.login = login;
            } else {
                throw "login !";
            }

            Gh3.User.__super__.constructor.call(this, user_infos);

            this.repositories = new Collection.UserRepositories(this);
            this.members = new Collection.OrganizationMembers(this);
            this.orgs = new Collection.UserOrganizations(this);
            this.followers = new Collection.UserFollowers(this);
            this.following = new Collection.UserFollowing(this);
            this.starred = new Collection.UserStarredRepositories(this);
            this.events = new Collection.UserEvents(this);
            this.received_events = new Collection.UserReceivedEvents(this);
            this.gists = new Collection.UserGists(this);
        },
        _service: function() {
            return "users/" + this.login;
        },
        _setData: function(data) {
            /* Rename the "followers" and "following" fields into "followers_count"
             * and "following_count" to leave room for our own "followers" and
             * "following" objects
             * And call the super _setData to save normal fields
             */

            if (data) {
                if (typeof data.followers !== 'undefined') {
                    data.followers_count = data.followers;
                    delete data.followers;
                }
                if (typeof data.following !== 'undefined') {
                    data.following_count = data.following;
                    delete data.following;
                }
            }

            Gh3.User.__super__._setData.call(this, data);

        }
    }); // Gh3.User

    Collection._UsersList = Collection._Base.extend({
        /* Base class representing a collection of Gh3.User objects
         */
        _prepareItem: function(item) {
            /* Simply create a Gh3.User with raw data from the api
             */
            return new Gh3.User(item.login, item);
        },
        getByLogin: function(login) {
            /* A wrapper arround getBy to quickly get an item based on its
             * login
             */
            return this.getBy('login', login);
        }
    }); // Collection._UsersList

    Collection.OrganizationMembers = Collection._UsersList.extend({
        /* List of an organization's members
         */
        _service: function() { return "orgs/" + this.parent.login + "/members"; }
    });
    Collection.UserOrganizations = Collection._UsersList.extend({
        /* List of organizations a user belongs to
         */
        _service: function() { return this.parent._service() + "/orgs"; }
    });
    Collection.UserFollowers = Collection._UsersList.extend({
        /* List of a user's followers
         */
        _service: function() { return this.parent._service() + "/followers"; }
    });
    Collection.UserFollowing = Collection._UsersList.extend({
        /* List of a user's following
         */
        _service: function() { return this.parent._service() + "/following"; }
    });
    Collection.RepositoryContributors = Collection._UsersList.extend({
        /* List of a repository's contributors
         */
        _service: function() { return this.parent._service() + "/contributors"; }
    });
    Collection.RepositoryStargazers = Collection._UsersList.extend({
        /* List of a repository's stargazers
         */
        _service: function() { return this.parent._service() + "/stargazers"; }
    });


    Gh3.CurrentUser = Gh3.User.extend({
        constructor: function() {
            // this.login will be set on fetch
            Gh3.CurrentUser.__super__.constructor.call(this, 'logged-user');
        },
        _service: function() {
            return "user";
        }
    });


    /*Events*/

    Gh3.Event = SingleObject.extend({
        /* This class represent a Github event, but does nothing specific
         * As an event is not specifically fetchable, this object as no "_service"
         * method.
         */
        _setData: function(data) {
            /* Save the actor and repo, then normal fields
             */
            if (data) {
                if (data.actor) {
                    if (data.actor.id && data.actor.login) {
                        if (!this.actor) {
                            this.actor = new Gh3.User(data.actor.login);
                        }
                        this.actor._setData(data.actor);
                    }
                    delete data.actor;
                }
                if (data.repo) {
                    if (data.repo.id && data.repo.name) {
                        if (!this.repository) {
                            var parts = data.repo.name.split('/');
                            this.repository = new Gh3.Repository(parts[1], new Gh3.User(parts[0]));
                        }
                        this.repository._setData(data.repo);
                    }
                    delete data.repo;
                }
            }
            Gh3.Event.__super__._setData.call(this, data);
        }
    });
    Collection._EventsList = Collection._Base.extend({
        /* Base class representing a collection of Gh3.Event objects
         */
        _prepareItem: function(item) {
            /* Simply create a Gh3.Event with raw data from the api
             */
            return new Gh3.Event(item);
        }
    });
    Collection.UserEvents = Collection._EventsList.extend({
        /* List of events emitted by a user
         */
        _service: function() { return this.parent._service() + "/events"; }
    });
    Collection.UserReceivedEvents = Collection._EventsList.extend({
        /* List of events received by a user
         */
        _service: function() { return this.parent._service() + "/received_events"; }
    });
    Collection.RepositoryEvents = Collection._EventsList.extend({
        /* List of events emitted by a repository
         */
        _service: function() { return this.parent._service() + "/events"; }
    });


    /* Gists */

    Gh3.Gist = SingleObject.extend({
        /* This class represent a Github Gist
         */
        // TODO: manage history
        constructor : function (gistData, ghUser, ghParent, version) {
            /* The constructor define two lists, to hold files and comments,
             * then call the super constructor to save given data with _setData
             */

            this.user = ghUser || null;
            this.parent = ghParent || null;
            this.version = version || null;

            this.files = new Collection.GistFiles(this);
            this.comments = new Collection.GistComments(this);
            this.forks = new Collection.GistForks(this);
            this.history = new Collection.GistHistory(this);

            Gh3.Gist.__super__.constructor.call(this, gistData);
        },
        _setData: function(data) {
            /* Extract files from data to save them in the files list. Also
             * rename the "comments" field into "comment_count" to not override
             * the comments list.
             * Save also forks, parent and history
             * And call the super _setData to save normal fields
             */
            if (data.user) {
                if (!this.user) { this.user = new Gh3.User(data.user.login); }
                this.user._setData(data.user);
                delete data.user;
            }
            if (data.files) {
                this.files._setItems(data.files);
                delete data.files;
            }
            if (data.fork_of) {
                if (!this.parent) {
                    this.parent = new Gh3.Gist({id: data.fork_of.id}, new Gh3.User(data.fork_of.user.login, data.fork_of.user));
                }
                this.parent._setData(data.fork_of);
                delete data.fork_of;
            }
            if (data.forks) {
                this.history._setItems(data.forks);
                delete data.forks;
            }
            if (data.history) {
                this.history._setItems(data.history);
                delete data.history;
            }

            data.comment_count = data.comments;
            delete data.comments;

            Gh3.Gist.__super__._setData.call(this, data);

        }, // _setData
        _baseService: function() {
            /* Service to use for other objects, because the normal _service
             * method add the version if any (but comments and forks) are
             * linked to the gist, not a specific version
             */
            return "gists/" + this.id;
        },
        _service: function() {
            /* Add the version if any. Use _baseService for linked objects
             */
            var service = this._baseService();
            if (this.version) {
                service += "/" + this.version;
            }
            return service;
        }
    }); // Gh3.Gist

    Gh3.GistComment = SingleObject.extend({
        /* This class represent a Github gist comment, but does nothing specific
         */
        constructor : function (gistCommentData, ghGist) {
            /* Save the parent gist then call the super constructor to save
             * given data with _setData
             */
            this.gist = ghGist;
            Gh3.GistComment.__super__.constructor.call(this, gistCommentData);
        },
        _service: function() {
            return this.gist._baseService() + "/comments/" + this.id;
        },
        _setData: function(data) {
            /* Save the commenter as a Gh3.User
             */
            if (data.user) {
               if (!this.user) {
                   this.user = new Gh3.User(data.user.login);
               }
               this.user._setData(data.user);
               delete data.user;
            }
            Gh3.GistComment.__super__._setData.call(this, data);
        }
    });

    Collection.GistComments = Collection._Base.extend({
        /* A collection to hold the list of all comments of a gist
         */
        _prepareItem: function(item) {
            /* Simply create a Gh3.GistComment with raw data from the api
             */
            return new Gh3.GistComment(item, this.parent);
        },
        _service: function() {
            return this.parent._baseService() + "/comments";
        }
    }); // Collection.GistComments

    Collection.GistForks = Collection._Base.extend({
        /* A collection to hold the list of all forks of a gist
         */
        _prepareItem: function(item) {
            /* Simply create a Gh3.Gist with raw data from the api
             */
            var user;
            if (item.user) {
                user = new Gh3.User(item.user.login, item.user);
            }
            return new Gh3.Gist(item, user, this.parent);
        },
        _service: function() {
            return this.parent._baseService() + "/forks";
        }

    });

    Collection.UserGists = Collection._Base.extend({
        /* A collection to hold the list of all gists of a user
         */
        _prepareItem: function(item) {
            /* Simply create a Gh3.Gist with raw data from the api
             */
            return new Gh3.Gist(item, this.parent);
        },
        _service: function() {
            return this.parent._service() + "/gists";
        }
    }); // Collection.UserGists

    Gh3.GistFile = SingleObject.extend({
        /* This class represent a Github Gist file
         * As a gist file is not specifically fetchable, this object as no "_service"
         * method.
         */
        constructor : function (gistFileData, ghGist) {
            /* Save the parent gist then call the super constructor to save
             * given data with _setData
             */
            this.gist = ghGist;
            Gh3.GistFile.__super__.constructor.call(this, gistFileData);
        }
    });

    Collection.GistFiles = Collection._Base.extend({
        /* A collection to hold the list of all files of a gist
         */
        _prepareItem: function(item) {
            /* Simply create a Gh3.GistComment with raw data from the api
             */
            return new Gh3.GistFile(item, this.parent);
        },
        getByName: function(name) {
            /* Override the getByName default method, because a GistFile has a
             * "filename" field instead of a "name" field.
             */
            return this.getBy('filename', name);
        }
    }); // Collection.GistFiles

    Gh3.GistVersion = SingleObject.extend({
        /* This class represent a version of a Github file.
         * A version is linked to two gists: the main gist, and the versionned one
         */
        constructor: function(version, historyData, ghGist) {
            this.parent = ghGist;
            this.version = version;
            this.gist = new Gh3.Gist({id: this.parent.id}, this.parent.user, null, this.version);
            Gh3.GistVersion.__super__.constructor.call(this, historyData);
        }
    }); // Gh3.GistVersion

    Collection.GistHistory = Collection._Base.extend({
        /* A collection to hold the list of all versions of a gist
         */
        _prepareItem: function(item) {
            return new Gh3.GistVersion(item.version, item, this.parent);
        }
    }); // Collection.GistHistory


    /* ItemContents: files and dirs */

    ItemContent = SingleObject.extend({
        /* A base class to hold "content" items of a repository: files and
         * directories.
         * A content item belongs to a branch of a repository.
         */
        constructor : function (contentItem, ghBranch) {
            /* Save the branch then call the super constructor to save default
             * fields defined in contentItem
             */
            this.branch = ghBranch;
            ItemContent.__super__.constructor.call(this, contentItem);
        },
        _service: function() {
            return this.branch.repository._service() + "/contents/" + this.path;
        }
    }); // ItemContent

    Gh3.File = ItemContent.extend({
        /* This class represent a file in a repository.
         */
        constructor : function (contentItem, ghBranch) {
            /* Save the branch and the fields defined in contentItem, and create
             * a list to hold the file's commits
             */
            Gh3.File.__super__.constructor.call(this, contentItem, ghBranch);
            this.commits = new Collection.FileCommits(this);
        },
        _service: function() {
            return this.branch.repository._service() + "/contents/" + this.path;
        },
        _defaultFetchCallParams: function() {
            /* Override the data used to call the api by passing the branch as
             * the "ref" argument
             */
            var params = Collection.ItemContents.__super__._defaultFetchCallParams.call(this);
            params.data = $.extend({}, params.data || {}, {
                ref: this.branch.name
            });
            return params;
        },
        _onFetchSuccess: function(callback, result) {
            /* When a fetch is successful, decode the content of the file for
             * easy access of its readable version
             */
            if (result.data.content) {
                result.data.content = Base64.decode(result.data.content);
            }
            Gh3.File.__super__._onFetchSuccess.call(this, callback, result);
        }
    }); // Gh3.File

    Gh3.Dir = ItemContent.extend({
        /* This class represent a directory in a repository.
         */
        constructor : function (contentItem, ghBranch) {
            /* Save the branch and the fields defined in contentItem, and create
             * a list to hold the directory's content (fields and sub-directories)
             */
            Gh3.Dir.__super__.constructor.call(this, contentItem, ghBranch);
            this.contents = new Collection.ItemContents(this);
        }
    }); // Gh3.Dir

    Collection.ItemContents = Collection._Base.extend({
        /* A collection to hold a list of "ItemContents" (a list of files and
         * directories). Used to hold content of a Gh3.Branch and a Gh3.Dir
         */
        _prepareItem: function(item) {
            /* Create either a Gh3.File or a Gh3.Dir depending of the "type"
             * field of the given item.
             */
            return new Gh3[item.type == "file" ? 'File' : 'Dir'](item, this.parent);
        },
        _service: function() {
            return this.parent.branch.repository._service() + "/contents/" + this.parent.path;
        },
        _defaultFetchCallParams: function() {
            /* Override the data used to call the api by passing the branch as
             * the "ref" argument
             */
            var params = Collection.ItemContents.__super__._defaultFetchCallParams.call(this);
            params.data = $.extend({}, params.data || {}, {
                ref: this.parent.branch.name
            });
            return params;
        },
        files : function (comparator) {
            /* An utility method to retrieve only files
             */
            return _.filter(this.list, function(item) {
                return item.type == "file";
            }, this);
        },
        dirs : function (comparator) {
            /* An utility method to retrieve only directories
             */
            return _.filter(this.list, function(item) {
                return item.type == "dir";
            }, this);
        },
        getFileByName : function (name) {
            /* An utility method to get a file by its name
             */
            return _.find(this.list, function (item) {
                return item.name == name && item.type == "file";
            });
        },
        getDirByName : function (name) {
            /* An utility method to get a directory by its name
             */
            return _.find(this.list, function (item) {
                return item.name == name && item.type == "dir";
            });
        }
    }); // Collection.ItemContents


    /* Commits */

    Gh3.Commit = SingleObject.extend({
        /* This class represent a Github Commit
         * A commit belongs to a branch of a repository.
         */
        constructor : function (commitInfos, ghBranch) {
            /* Save the branch then call the super constructor to save default
             * fields defined in commitInfos. And create a list to hold files
             * managed by this commit.
             */
            this.branch = ghBranch;
            this.files = new Collection.CommitFiles(this);
            Gh3.Commit.__super__.constructor.call(this, commitInfos);
        },
        _setData: function(data) {
            /* Extract author, commiter and files from data to save them in
             * lists.
             * And call the super _setData to save normal fields
             */
            if (data.author) {
                if (!this.author) { this.author = new Gh3.User(data.author.login); }
                this.author._setData(data.author);
                delete data.author;
            }
            if (data.commiter) {
                if (!this.author || data.commiter.login != this.author.login) {
                    if (!this.commiter) { this.commiter = new Gh3.User(data.commiter.login); }
                    this.commiter._setData(data.commiter);
                } else {
                    this.commiter = this.author;
                }
                delete data.commiter;
            }
            if (data.files) {
                this.files._setItems(data.files);
                delete data.files;
            }
            Gh3.Commit.__super__._setData.call(this, data);
        } // _setData
    }); // Gh3.Commit

    Gh3.CommitFile = SingleObject.extend({
        /* This class represent a reference to a file managed by a commit.
         * Each reference store the status of the file (deleted, created,
         * modified), some stats (additions, deletions, changes), the pach, and
         * a link to the real Gh3.File
         */
        constructor: function(commitFileData, ghCommit) {
            /* Save the commit and call the super constructor to save fields
             * defined in commitFileData
             */
            this.commit = ghCommit;
            Gh3.CommitFile.__super__.constructor.call(this, commitFileData);
        },
        _setData: function(data) {
            /* Save the file fields as a Gh3File, based on the filename
             */
            var file_data = {
                sha: data.sha,
                filename: data.filename
            };
            if (!this.file) {
                this.file = new Gh3.File(file_data, this.commit.branch);
            } else {
                this.file._setData(file_data);
            }
            Gh3.CommitFile.__super__._setData.call(this, data);
        }
    }); // CommitFile

    Collection.CommitFiles = Collection._Base.extend({
        /* A collection to hold the files managed by a commit (the *references*
         * to the files)
         */
        _prepareItem: function(item) {
            /* Simply create a Gh3.CommitFile with raw data from the api
             */
            return new Gh3.CommitFile(item, this.parent);
        },
        getByName: function(name) {
            /* Override the getByName default method, because a CommitFile has a
             * "filename" field instead of a "name" field.
             */
            return this.getBy('filename', name);
        }
    }); // Collection.CommitFiles

    Collection._Commits = Collection._Base.extend({
        /* Base class representing a collection of Gh3.Commit objects
         */
        _service: function() {
            return this.parent.branch.repository._service() + "/commits";
        },
        _prepareItem: function(item) {
            /* Simply create a Gh3.Commit with raw data from the api
             */
            return new Gh3.Commit(item, this.parent.branch);
        },
        last: function() {
            /* Utility to return the last commit of the list
             */
            return this.list[0];
        },
        first: function() {
            /* Utility to return the first commit of the list
             */
            return this.list[this.list.length-1];
        }
    }); // Collection._Commits

    Collection.FileCommits = Collection._Commits.extend({
        /* A collection of commits managing a file
         */
        _defaultFetchCallParams: function(callback, querystring_args) {
            /* Override the data used to call the api by passing the file's path
             * the "path" argument
             */
            var params = Collection.FileCommits.__super__._defaultFetchCallParams.call(this, callback, querystring_args);
            params.data = $.extend({}, params.data || {}, {
                path: this.parent.path
            });
            return params;
        }
    }); // Collection.FileCommits

    Collection.BranchCommits = Collection._Commits.extend({
        /* A collection of commits in a branch
         */
        _defaultFetchCallParams: function(callback, querystring_args) {
            /* Override the data used to call the api by passing the branch as
             * the "ref" argument
             */
            var params = Collection.FileCommits._defaultFetchCallParams.call(this, callback, querystring_args);
            params.data = $.extend({}, params.data || {}, {
                ref: this.parent.name
            });
            return params;
        }
    }); // Collection.BranchCommits


    /* Branches */

    Gh3.Branch = SingleObject.extend({
        /* This class represent a branch of a repository
         * As a branch is used like a Dir to hold contents, we define two
         * fields, "branch" (this) and "path" (empty) to act as a Dir when
         * needed.
         */
        constructor: function(branchData, ghRepository) {
            /* Save the repository, create branch and path to act as a Dir,
             * create a list to hold contents, and save fields defined in
             * branchData
             */
            this.repository = ghRepository;
            this.branch = this;  // used for contents
            this.path = '';  // used for contents
            Gh3.Branch.__super__.constructor.call(this, branchData);
            this.contents = new Collection.ItemContents(this);
        },
        _service: function() {
            return this.parent._service() + "/branches/" + this.name;
        },
        _setData: function(data) {
            /* Extract the "commit" field of the data from the api to save it
             * as a "head_commit" field defined as a Gh3.Commit
             */
            if (data.commit) {
                if (!this.head_commit || this.head_commit.sha != data.commit.sha) {
                    this.head_commit = new Gh3.Commit({sha: data.commit.sha}, this);
                }
                this.head_commit._setData(data.commit);
                delete data.commit;
            }
            Gh3.Branch.__super__._setData.call(this, data);
        }
    }); // Gh3.branch

    Collection.RepositoryBranches = Collection._Base.extend({
        /* A collection to hold branches of a repository
         */
        _service: function() {
            return this.parent._service() + "/branches";
        },
        _prepareItem: function(item) {
            /* Simply create a Gh3.Branch with raw data from the api
             */
            return new Gh3.Branch(item, this.parent);
        }
    }); // Collection.RepositoryBranches


    /* Repositories */

    Gh3.Repository = SingleObject.extend({
        /* This class represent a Github repository, belonging to a user
         */
        constructor : function (name, ghUser, infos, ghParent) {
            /* Save mandatory name and user, call the super constructor, create
             * a link to fetch the readme later, and some lists
             */

            if (name && ghUser) {
                this.name = name;
                this.user = ghUser;
            } else {
                throw "name && user !";
            }

            this.parent = ghParent || null;

            Gh3.Repository.__super__.constructor.call(this, infos);

            this.readme = '';
            this.readmeFetcher = new ReadmeFetcher(this);

            this.contributors = new Collection.RepositoryContributors(this);
            this.forks = new Collection.RepositoryForks(this);
            this.stargazers = new Collection.RepositoryStargazers(this);
            this.events = new Collection.RepositoryEvents(this);
            this.branches = new Collection.RepositoryBranches(this);

        },
        _service: function() {
            return "repos/" + this.user.login + "/" + this.name;
        },
        fetchReadme: function (callback, querystring_args) {
            /* A simple wrapper arroud the readme fetcher to fetch the readme
             * and then call the given callback
             */
            this.readmeFetcher.fetch(callback, querystring_args);
        },
        _setData: function(data) {
            /* Update the user, source and parent, and set normal fields
             */
            if (data) {
                if (data.owner) {
                    this.user._setData(data.owner);
                    delete data.owner;
                }
                if (data.source) {
                    if (!this.source) {
                        this.source = new Gh3.Repository(data.source.name, new Gh3.User(data.source.owner.login, data.source.owner));
                    }
                    this.source._setData(data.source);
                delete data.source;
                }
                if (data.parent) {
                    if (!this.parent) {
                        this.parent = new Gh3.Repository(data.parent.name, new Gh3.User(data.parent.owner.login, data.parent.owner));
                    }
                    this.parent._setData(data.parent);
                    delete data.parent;
                }
            }

            Gh3.Repository.__super__._setData.call(this, data);
        }
    }); // Gh3.Repository

    ReadmeFetcher = Fetchable.extend({
        /* This class is a helper to fetch the readme of a repository. It's not
         * not a SingleObject as it has no real existence as an object.
         */
        constructor: function(ghRepo) {
            /* Save the repository to set the readme when fetched
             */
            this.repository = ghRepo;
            ReadmeFetcher.__super__.constructor.call(this);
        },
        _service: function() {
            return this.repository._service() + "/readme";
        },
        _onFetchSuccess: function(callback, result) {
            /* When the fetch is successful, save the readme in the repository
             * and call the callback passing the repository, and not this, as
             * the result data
             */
            this.repository.readme = result.data;
            this.fetched = true;
            if (callback) { callback(null, this.repository); }
        },
        _defaultFetchCallParams: function() {
            /* Update the default params as we don't want a json response, but
             * the full readme in its html version to use it directly
             */
            var params = ReadmeFetcher.__super__._defaultFetchCallParams.call(this);
            params.dataType = 'html';
            params.headers = $.extend({}, params.headers || {}, {
                Accept: 'application/vnd.github.html+json',
                'Content-Type': 'text/html'
            });
            return params;
        }
    }); // ReadmeFetcher

    Collection._RepositoriesList = Collection._Base.extend({
        /* Base class representing a collection of Gh3.Repository objects
         */
        _prepareItem: function(item) {
            /* Simply create a Gh3.Repository with raw data from the api
             */
            var owner = new Gh3.User(item.owner.login, item.owner);
            return new Gh3.Repository(item.name, owner, item);
        }
    });
    Collection.UserRepositories = Collection._RepositoriesList.extend({
        /* List of a user's repositories
         */
        _service: function() { return this.parent._service() + "/repos"; }
    });
    Collection.UserStarredRepositories = Collection._RepositoriesList.extend({
        /* List of a user's starred repositories
         */
        _service: function() { return this.parent._service() + "/starred"; }
    });
    Collection.RepositoryForks = Collection._RepositoriesList.extend({
        /* List of a repsitory's forks
         */
        _prepareItem: function(item) {
            /* Simply create a Gh3.Repository with raw data from the api, with
             * the parent set
             */
            var owner = new Gh3.User(item.owner.login, item.owner);
            return new Gh3.Repository(item.name, owner, item, this.parent);
        },
        _service: function() { return this.parent._service() + "/forks"; }
    });


    /* Search */

    Collection.Search = Collection._Base.extend({
        /* Base collection to manage search. Accept a keyword as init argument
         * but provides a search method to set the keywork and fetch data in a
         * single call.
         * Used by Gh3.Repository.Search and Gh3.User.Search.
         */
        constructor: function(keyword) {
            /* Save the optional given keyword
             */
            this.keyword = keyword || null;
            Collection.Search.__super__.constructor.call(this, null);
        },
        search: function(keyword, callback, querystring_args) {
            /* Simple method that reset the list, set the keyword to search and
             * call the fetch method
             */
            this.list = [];
            this.keyword = keyword;
            this.fetch(callback, querystring_args);
        }
    }); // Collection.Search

    Gh3.Repository.Search = Collection.Search.extend({
        _service: function() {
            return "legacy/repos/search/" + this.keyword;
        },
        _prepareItem: function(item) {
            /* Create a Gh3.Repository with raw data from the api.
             */
            // Owner is not an object, we just have the login in the main object
            var owner = new Gh3.User(item.owner);
            delete item.owner;
            delete item.username;
            return new Gh3.Repository(item.name, owner, item);
        },
        _onFetchSuccess: function(callback, result) {
            /* Called when a fetch is successful to save the repositories from
             * the result
             */
            this.fetched = true;
            this._setItems(result.data.repositories);
            if (callback) { callback(null, this); }
        }
    }); // Collection.RepositorySearch

    Gh3.User.Search = Collection.Search.extend({
        _service: function() {
            return "legacy/user/search/" + this.keyword;
        },
        _prepareItem: function(item) {
            /* Simply create a Gh3.User with raw data from the api
             */
            return new Gh3.User(item.login, item);
        },
        getByLogin: function(login) {
            /* A wrapper arround getBy to quickly get an item based on its
             * login
             */
            return this.getBy('login', login);
        },
        _onFetchSuccess: function(callback, result) {
            /* Called when a fetch is successful to save the users from
             * the result
             */
            this.fetched = true;
            this._setItems(result.data.users);
            if (callback) { callback(null, this); }
        }
    }); // Collection.UserSearch


}).call(this);
