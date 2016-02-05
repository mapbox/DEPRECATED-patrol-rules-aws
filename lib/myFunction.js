var lambdaCfn = require('./lambda-cfn');

module.exports = lambdaCfn.build({
    name: 'myFunction',
    parameters: {
      'githubToken': {
        'Type': 'String',
        'Description': 'Github API token with users scope',
      },
      'myBucket': {
        'Type': 'String',
        'Description': 'Bucket where to store'
      }
    },
    statements: [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject"
        ],
        "Resource": "arn:aws:s3:::mySuperDuperBucket"
      }
    ]
});

module.exports.fn = function(event, context) {
    console.log('called myFunction');
};
