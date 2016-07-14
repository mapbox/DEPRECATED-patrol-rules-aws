var AWS = require('aws-sdk');
var d3 = require('d3-queue');
var util = require('util');

var iam = new AWS.IAM();
var roles = [];
var rolePolicies = {};

var policyProcessor = module.exports = returnPolicies;

function listRoles(marker, next) {
  if (marker) {
    var params = {
      Marker: marker
    };
  }
  iam.listRoles(params, function(err, data) {
    if (err) {
      return next(err);
    } else {
      data.Roles.forEach(function(role) {
        roles.push(role);
      });
      if (data.IsTruncated) {
        listRoles(data.Marker, next);
      } else {
        return next();
      }
    }
  });
}

function getRoleInlinePolicies(role, marker, next) {
  var params = {
    RoleName: role
  };
  if (marker) {
    params.Marker = marker;
  }
  iam.listRolePolicies(params, function(err, data) {
    if (err) {
      return next(err);
    } else {
      data.PolicyNames.forEach(function(policy) {
        rolePolicies[role].inline.push(policy);
      });
      if (data.IsTruncated) {
        getRoleInlinePolicies(role,data.Marker,next);
      } else {
        return next();
      }
    }
  });
}

function getRoleManagedPolicies(role, marker, next) {
  var params = {
    RoleName: role
  };
  if (marker) {
    params.Marker = marker;
  }
  iam.listAttachedRolePolicies(params, function(err,data) {
    if (err) {
      return next(err);
    } else {
      data.AttachedPolicies.forEach(function(policy) {
        rolePolicies[role].managed.push(policy);
      });
      if (data.IsTruncated) {
        getRoleManagedPolicies(role, data.Marker, next);
      } else {
        return next();
      }
    }
  });
}

function compileInlinePolicyDocuments(role, next) {
  var q = d3.queue();
  if (rolePolicies[role].policies == undefined) {
    rolePolicies[role].policies = {};
  };

  var getPolicyDocument = function(params,cb) {
    iam.getRolePolicy(params, function(err, data) {
      if (err) {
        return cb(err);
      } else {
        rolePolicies[params.RoleName].policies[params.PolicyName] = (decodeURIComponent(data.PolicyDocument.replace(/"/g,'\"')).replace(/\n/g,''));
        try {
          var doc = JSON.parse(rolePolicies[params.RoleName].policies[params.PolicyName]);
        } catch(err) {
          return cb(err);
        }
        return cb();
      }
    });
  };

  rolePolicies[role].inline.forEach(function(policy) {
    var params = {
      RoleName: role,
      PolicyName: policy
    };
    q.defer(getPolicyDocument,params);
  });
  q.awaitAll(function(err, data) {
    if (err) {
      return next(err);
    } else {
      next();
    }
  });
}

function compileManagedPolicyDocuments(role,next) {
  var q = d3.queue();

  var getPolicyDoc = function(params, cb) {
    iam.listPolicyVersions(params, function(err, data) {
      if (err) {
        return cb(err);
      } else {
        data.Versions.forEach(function(policy) {
          if (policy.IsDefaultVersion) {
            var p = {
              PolicyArn: params.PolicyArn,
              VersionId: policy.VersionId
            };
            iam.getPolicyVersion(p,function(err,data) {
              rolePolicies[role].policies[p.PolicyArn] = (decodeURIComponent(data.PolicyVersion.Document.replace(/"/g,'\"')).replace(/\n/g,''));
              try {
                var doc = JSON.parse(rolePolicies[role].policies[p.PolicyArn]);
              } catch(err) {
                return cb(err);
              }
              return cb();
            });
          }
        });
        if (data.IsTruncated) {
          params.Marker = data.Marker;
          getPolicyDoc(params, cb);
        }
      }
    });
  };

  rolePolicies[role].managed.forEach(function(policy) {
    var params = {
      PolicyArn: policy.PolicyArn
    };
    q.defer(getPolicyDoc,params);
  });
  q.awaitAll(function(err, data) {
    if (err) {
      return next(err);
    } else {
      next();
    }
  });
}


function getAllRolePolicies(next) {
  var q = d3.queue();
  roles.forEach(function(role) {
    if (rolePolicies[role.RoleName] == undefined) {
      rolePolicies[role.RoleName] = {
        inline: [],
        managed: []
      };
    }
    q.defer(getRoleInlinePolicies,role.RoleName,false);
    q.defer(getRoleManagedPolicies,role.RoleName,false);

  });
  q.awaitAll(function(err, data) {
    if (err) {
      return next(err);
    } else {
      return next();
    }
  });
}

function compileAllPolicyDocuments(next) {
  var q = d3.queue();
  roles.forEach(function(role) {
    q.defer(compileInlinePolicyDocuments,role.RoleName);
    q.defer(compileManagedPolicyDocuments,role.RoleName);
  });
  q.awaitAll(function(err, data) {
    if (err) {
      return next(err);
    } else {
      return next();
    }
  });

}

function returnPolicies(callback) {
  var q = d3.queue(1);
  q.defer(listRoles, false);
  q.defer(getAllRolePolicies);
  q.defer(compileAllPolicyDocuments);

  q.awaitAll(function(err, data) {
    if (err) return callback(err);
    else {
      return callback(null, rolePolicies);
    }
  });
};
