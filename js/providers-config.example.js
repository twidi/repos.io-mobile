var providers_config = {
    github: {
        auth: 'oauth',
        client_id: 'foobar', // you must create an app on github
        token_script: 'http://path.to/git_token.py' // careful of CORS !
    }
};
