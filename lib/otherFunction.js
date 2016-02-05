var lambdaCfn = require('./lambda-cfn');

module.exports.fn = function(event, context) {
    console.log('called otherFunction');
};

module.exports = lambdaCfn.build({
    name: 'otherFunction',
    parameters: {
      'Ports': {
        'Type': 'String',
        'Description': 'List of whitelisted ports',
      }
    },
    statements: [
      {
        "Effect": "Allow",
        "Action": [
          "s3:ListBucket"
        ],
        "Resource": "arn:aws:s3:::sillyBucket"
      }
    ]
});
