module.exports.config = {
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
};

module.exports.fn = function(event, callback) {
  console.log('called otherFunction');
};
