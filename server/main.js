import { Meteor } from 'meteor/meteor';
import { Cookies } from 'meteor/ostrio:cookies';

Meteor.methods({
    
    'getAuthToken': function (code) {
        
        var url = "https://foursquare.com/oauth2/access_token?" + 
                    "client_id=" + Meteor.settings.public.foursquare.clientId + 
                    "&client_secret=" + Meteor.settings.private.foursquare.clientSecret + 
                    "&grant_type=authorization_code" + 
                    "&redirect_uri=" + Meteor.settings.public.foursquare.redirectUrl + 
                    "&code=" + code;      
        
        var result = HTTP.call('GET', url);
        return result.data.access_token;
    }
   
});