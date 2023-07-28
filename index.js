const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
const TOKEN_DIR = '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the YouTube API.
  authorize(JSON.parse(content), getChannel);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const clientSecret = credentials?.client_secret;
  const clientId = credentials?.client_id;
  const redirectUrl = credentials?.redirect_uris[0];
  const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function (err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function (code) {
    rl.close();
    oauth2Client.getToken(code, function (err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getChannel(auth) {
  const service = google.youtube('v3');

  // service.channels.list({
  //   auth: auth,
  //   part: 'snippet,contentDetails,statistics',
  //   forUsername: 'GoogleDevelopers'
  // }, function (err, response) {
  //   if (err) {
  //     console.log('The API returned an error: ' + err);
  //     return;
  //   }
  //   const channels = response.data.items;
  //   if (channels.length == 0) {
  //     console.log('No channel found.');
  //   } else {
  //     console.log('This channel\'s ID is %s. Its title is \'%s\', and ' +
  //       'it has %s views.',
  //       channels[0].id,
  //       channels[0].snippet.title,
  //       channels[0].statistics.viewCount);
  //   }
  // });

  service.activities.list({
    auth: auth,
    part: 'snippet,contentDetails',
    myRating: 'like',
    maxResults: 2000,
    mine: true,
  }, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    const liked = response.data.items;
    if (liked.length == 0) {
      console.log('No Liked found.');
    } else {
      liked.map((el) => { console.log(el.id, el.snippet) })

      // service.videos.rate({
      //   id, 
      //   ratting: 'none',
      //   auth,
      // }, (err, res) => {
      // })
    }
  });

  const subscriptionsList = (channelId) => {
    service.subscriptions.list({
      auth,
      part: 'snippet, contentDetails',
      mine: true,
      maxResults: 50,
    }, (err, res) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      const totalResults = response?.data?.pageInfo?.totalResults;
      const resultsPerPage = response?.data?.pageInfo?.resultsPerPage;
      const nextPageToken = response?.data?.nextPageToken;
      const subscribed = response.data.items;

      // {
      //   "kind": "youtube#SubscriptionListResponse",
      //   "etag": "QiFIVjrnwPEFV80QgffENBHeWgU",
      //   "nextPageToken": "CAUQAA",
      //   "pageInfo": {
      //     "totalResults": 108,
      //     "resultsPerPage": 5
      //   },
      //   "items": [
      //     {
      //       "kind": "youtube#subscription",
      //       "etag": "xWbBbqh_cDMnA3wiftM_CZFt0Zo",
      //       "id": "_1XSdAw6SiCQqPeFKpQJCRBAjfnrS1A43Wqn7Empa-Y",
      //       "snippet": {
      //         "publishedAt": "2023-07-28T16:34:31.77116Z",
      //         "title": "Google for Developers",
      //         "description": "Subscribe to join a community of creative developers and learn the latest in Google technology — from AI and cloud, to mobile and web.\n\nExplore more at developers.google.com",
      //         "resourceId": {
      //           "kind": "youtube#channel",
      //           "channelId": "UC_x5XG1OV2P6uZZ5FSM9Ttw"
      //         },
      //         "channelId": "UC-gKuyWUkRkcAuCrl-epMWg",
      //         "thumbnails": {
      //           "default": {
      //             "url": "https://yt3.ggpht.com/fca_HuJ99xUxflWdex0XViC3NfctBFreIl8y4i9z411asnGTWY-Ql3MeH_ybA4kNaOjY7kyA=s88-c-k-c0x00ffffff-no-rj"
      //           },
      //           "medium": {
      //             "url": "https://yt3.ggpht.com/fca_HuJ99xUxflWdex0XViC3NfctBFreIl8y4i9z411asnGTWY-Ql3MeH_ybA4kNaOjY7kyA=s240-c-k-c0x00ffffff-no-rj"
      //           },
      //           "high": {
      //             "url": "https://yt3.ggpht.com/fca_HuJ99xUxflWdex0XViC3NfctBFreIl8y4i9z411asnGTWY-Ql3MeH_ybA4kNaOjY7kyA=s800-c-k-c0x00ffffff-no-rj"
      //           }
      //         }
      //       },
      //       "contentDetails": {
      //         "totalItemCount": 5787,
      //         "newItemCount": 1,
      //         "activityType": "all"
      //       }
      //     },]
      //   }
    })
  };

  const addSubscription = (channelId) => {
    service.subscriptions.insert({
      auth,
      part: 'snippet',
      requestBody: {
        kind: 'youtube#channel',
        channelId,
      }
    }, (err, response) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      console.log(response?.data)
    })
  }

  const deleteSubscription = (subscriptionId) => {
    service.subscriptions.delete({ auth, id: subscriptionId }, (err, response) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      console.log(response?.data)
    })
  }

}
