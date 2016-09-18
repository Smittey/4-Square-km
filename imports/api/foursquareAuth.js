/*Foursquare = {};

OAuth.registerService('foursquare', 2, null, function(query) {

    debugger;

    var accessToken = getAccessToken(query);
    var identity = getIdentity(accessToken);
    var serviceData = [
      'id','firstName','lastName','bio','gender','photo','contact','homeCity'
    ];

    return {
        serviceData: _.extend(
          _.pick(identity, serviceData),
          { accessToken: OAuth.sealSecret(accessToken) }
        ),
        options: {
            profile: {}
        }
    };
});

var getAccessToken = function (query) {
    
    debugger;
    
    var config = ServiceConfiguration.configurations.findOne({service: 'foursquare'});
    if (!config)
        throw new ServiceConfiguration.ConfigError();

    var response;
    try {
        response = HTTP.post(
            "https://foursquare.com/oauth2/access_token", {
                headers: {
                    Accept: 'application/json'
                },
                params: {
                    client_id: config.clientId,
                    client_secret: OAuth.openSecret(config.secret),
                    grant_type: 'authorization_code',
                    redirect_uri: Meteor.absoluteUrl('_oauth/foursquare'),
                    code: query.code,
                    state: query.state
                }
            });
    } catch (err) {
        throw _.extend(new Error("Failed to complete OAuth handshake with Foursquare. " + err.message),
            {response: err.response});
    }
    if (response.data.errorType) { // if the http response was a json object with an errorType attribute
        throw new Error("Failed to complete OAuth handshake with Foursquare. " + response.data);
    } else {
        return response.data.access_token;
    }
};

var getIdentity = function (accessToken) {
    
    debugger;
    
    try {
        return HTTP.get(
            "https://api.foursquare.com/v2/users/self", {
                params: {
                    oauth_token: accessToken,
                    v: '20141106'
                }
            }).data.response.user;
    } catch (err) {
        throw _.extend(new Error("Failed to fetch identity from Foursquare. " + err.message),
            {response: err.response});
    }
};


Foursquare.retrieveCredential = function(credentialToken, credentialSecret) {
    
    debugger;
    
    return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
*/