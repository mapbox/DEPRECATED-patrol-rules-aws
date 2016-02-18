module.exports.config = {
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
  ],
  eventRule: {
    eventPattern:{
      "detail-type": [
        "AWS API Call via CloudTrail"
      ],
      "detail": {
        "eventSource": [
          "cloudfront.amazonaws.com"
        ],
        "eventName": [
          "UpdateDistribution",
          "DeleteDistribution",
          "UpdateDistribution2016_01_28",
          "DeleteDistribution2016_01_28"
        ]
      }
    }
  }
};

module.exports.fn = function(event, callback) {
  console.log(process.env.githubToken);
  console.log(event);
  callback(null, 'myFunction was called');
};
