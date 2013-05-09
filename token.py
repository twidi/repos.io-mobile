"""
This script must be called via UWSGI. It waits for a "code" argument in the
query string, which, combined with two environment variables (GITHUB_CLIENT_ID
and GITHUB_CLIENT_SECRET), are passed to Github to get a final token to use
for the Github API for the user which generated the given code.
"""

import os
from urlparse import parse_qs
from urllib import urlencode
from urllib2 import urlopen, URLError, HTTPError

github_token_url = "https://github.com/login/oauth/access_token"
response_headers = [('Content-Type', 'application/json')]


def application(env, start_response):

    # get and check our own github identifiers
    github_client_id = os.environ.get('GITHUB_CLIENT_ID', None)
    github_client_secret = os.environ.get('GITHUB_CLIENT_SECRET', None)

    if not github_client_id or not github_client_secret:
        start_response('500 Internal Server Error', response_headers)
        return '{"error": "Server badly configured"}'

    # get and check the given code
    code = parse_qs(env.get('QUERY_STRING', {})).get('code')

    if not code or len(code) != 1:
        start_response('400 Bad Request', response_headers)
        return '{"error": "Code not found or erroneous"}'

    # prepare parameters for the call to github
    params = {
        'client_id': github_client_id,
        'client_secret': github_client_secret,
        'code': code[0]
    }
    encoded_params = urlencode(params)

    # make a post (data="" forces the method to be a POST)
    try:
        response = urlopen('%s?%s' % (github_token_url, encoded_params), data="", timeout=10)
    except HTTPError, e:
        start_response('%s' % e.code, response_headers)
        return '{"error": "%s"}' % e.reason
    except URLError, e:
        start_response('500 Internal Server Error', response_headers)
        return '{"error": "%s"}' % e.reason
    except:
        start_response('500 Internal Server Error', response_headers)
        return '{"error": "Something bad happened"}'

    # we have a response, parse it
    parsed_response = parse_qs(response.read() or '')

    # if no token
    if 'error' in parsed_response or 'access_token' not in parsed_response:
        start_response('401 Unauthorized', response_headers)
        if 'error' in parsed_response:
            return '{"error": "%s"}' % parsed_response['error'][0]
        else:
            return '{"error": "undefined_error"}'

    # we have a token, return it !
    start_response('200 OK', response_headers)
    return '{"token":"%s"}' % parsed_response['access_token'][0]
