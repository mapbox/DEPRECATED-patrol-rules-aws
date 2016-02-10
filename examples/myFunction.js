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
  ]
};

module.exports.fn = function(event, callback) {
  console.log(process.env.githubToken);
  console.log(event);
  this.succeed('SUCCESS');
};
