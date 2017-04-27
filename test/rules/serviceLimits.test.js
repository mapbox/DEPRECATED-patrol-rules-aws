var test = require('tape');

var rule = require('../../rules/serviceLimits');
var fn = rule.fn;
var name = rule.config.name;

var nock = require('nock');

var event = {};

nock('https://support.us-east-1.amazonaws.com:443', {"encodedQueryParams":true})
  .post('/', {"checkId":"eW7HH0l7J9"})
  .reply(200,{
    "result": {
         "flaggedResources": [
            {
                 "status": "ok"
            }
       ]
    }
  }
);

test('No services limit warnings found', function(t) {
  fn(event, {}, function(err, message) {
    t.error(err, 'No error when calling ' + name);
    t.equal(message,'No service limit warning found');
    t.end();
  });
});

nock('https://support.us-east-1.amazonaws.com:443', {"encodedQueryParams":true})
  .post('/', {"checkId":"eW7HH0l7J9"})
  .reply(200,{
    "result": {
      "flaggedResources": [
        {
          "metadata": [
            "us-west-1",
            "AutoScaling",
            "Auto Scaling groups",
            "20",
            "3",
            "Green"
          ],
          "region": "us-west-1",
          "resourceId": "D6t7gRjnfyfSCP-VE2wzAvvRxQfNm9ofQBFuQKfhE4Q",
          "status": "warning"
        }
      ]
    }
  }
);

test('Single service limit warning found', function(t) {
  fn(event, {}, function(err,message) {
    t.error(err, 'No error when calling ' + name);
    t.equal(message.subject,'Service limit warning for AutoScaling in us-west-1');
    t.end();
  });
});

nock('https://support.us-east-1.amazonaws.com:443', {"encodedQueryParams":true})
  .post('/', {"checkId":"eW7HH0l7J9"})
  .reply(200,{
    "result": {
      "flaggedResources": [
        {
          "metadata": [
            "us-west-1",
            "AutoScaling",
            "Auto Scaling groups",
            "20",
            "3",
          ],
          "region": "us-west-1",
          "resourceId": "D6t7gRjnfyfSCP-VE2wzAvvRxQfNm9ofQBFuQKfhE4Q",
          "status": "warning"
        },
        {
          "metadata": [
            "us-east-1",
            "EC2",
            "On-Demand instances - r3.xlarge ",
            "600",
            "2",
          ],
          "region": "us-east-1",
          "resourceId": "PKWkxXSFD8iToF9gK97U19t1F8HxqU_lzGDyjCBvGio",
          "status": "warning"
        }
      ]
    }
  }
        );

test('Ignored service found', function(t) {
  process.env.ignoredResources = 'D6t7gRjnfyfSCP-VE2wzAvvRxQfNm9ofQBFuQKfhE4Q';
  fn(event, {}, function(err,message) {
    t.equal(message.subject,'Service limit warning for EC2 in us-east-1');
    t.end();
  });
});

nock('https://support.us-east-1.amazonaws.com:443', {"encodedQueryParams":true})
  .post('/', {"checkId":"eW7HH0l7J9"})
  .reply(200,{
    "result": {
      "flaggedResources": [
        {
          "metadata": [
            "us-west-1",
            "AutoScaling",
            "Auto Scaling groups",
            "20",
            "3",
          ],
          "region": "us-west-1",
          "resourceId": "D6t7gRjnfyfSCP-VE2wzAvvRxQfNm9ofQBFuQKfhE4Q",
          "status": "warning"
        },
        {
          "metadata": [
            "us-east-1",
            "EC2",
            "On-Demand instances - r3.xlarge ",
            "600",
            "2",
          ],
          "region": "us-east-1",
          "resourceId": "PKWkxXSFD8iToF9gK97U19t1F8HxqU_lzGDyjCBvGio",
          "status": "warning"
        }
      ]
    }
  }
);

test('Multiple services in warning', function(t) {
  process.env.ignoredResources = '';
  fn(event, {}, function(err,message) {
    t.equal(message.subject,'Service limit warning for multiple services');
    t.end();
  });
});
