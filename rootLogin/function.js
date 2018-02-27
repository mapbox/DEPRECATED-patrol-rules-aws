const message = require('@mapbox/lambda-cfn').message;

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode) return callback(null, event.detail.errorMessage);

  if (event.detail.userIdentity.type === 'Root') {
    let notif = {
      subject: 'Root user logged into the console.',
      summary: 'Patrol detected that the root AWS user logged into the console',
      event: event
    };
    message(notif, (err, result) => {
      console.log(JSON.stringify(notif));
      callback(err, result);
    });
  } else {
    callback(null, event.detail.userIdentity.userName + ' user logged into the console.');
  }
};
