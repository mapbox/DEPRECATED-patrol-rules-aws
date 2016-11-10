var test = require('tape');
var rule = require('../../rules/certificateExpiration');

test('Multiple Expired Certificates', function(t) {
	rule.getExpiringCertificates(list1.ServerCertificateMetadataList, function(err, listCert) {
		t.equal(listCert.length, 4, 'Detect Multiple Expired Certificates');
		t.end();
	});
});

test('No Expired Certificates', function(t) {
	rule.getExpiringCertificates(list2.ServerCertificateMetadataList, function(err, listCert) {
		t.equal(listCert.length, 0, 'No Expired Certificates');
		t.end();
	});
});

test('One Expired Certificates', function(t) {
	rule.getExpiringCertificates(list3.ServerCertificateMetadataList, function(err, listCert) {
		t.equal(listCert.length, 1, 'Detect One Expired Certificates');
		t.end();
	});
});


var list1 = {
	"ServerCertificateMetadataList": [{
			"Arn": "arn:aws:",
			"UploadDate": "2014-01-11T21:24:08Z",
			"ServerCertificateName": "as",
			"ServerCertificateId": "asa1",
			"Path": "/",
			"Expiration": "2016-01-12T04:40:59Z"
		}, {
			"Arn": "arn:aws:",
			"UploadDate": "2016-07-22T14:55:54Z",
			"ServerCertificateName": "asaa",
			"ServerCertificateId": "swdsdw",
			"Path": "/",
			"Expiration": "2016-11-06T12:00:00Z"
		}, {
			"Arn": "arn:aws:",
			"UploadDate": "2016-07-07T13:45:21Z",
			"ServerCertificateName": "sfss",
			"ServerCertificateId": "Aswdsd",
			"Path": "/",
			"Expiration": "2016-12-02T12:00:00Z"
		}, {
			"Arn": "arn:aws:iaa",
			"UploadDate": "2015-05-28T00:00:11Z",
			"ServerCertificateName": "aaqw2",
			"ServerCertificateId": "sxsxx",
			"Path": "/",
			"Expiration": "2016-12-03T12:00:00Z"
		}

	]
}


var list2 = {
	"ServerCertificateMetadataList": [{
		"Arn": "arn:aws:iam::6",
		"UploadDate": "2016-01-11T21:24:08Z",
		"ServerCertificateName": "routerw",
		"ServerCertificateId": "ASssss4",
		"Path": "/",
		"Expiration": "2018-01-12T04:40:59Z"
	}, {
		"Arn": "assssqqqqqqq",
		"UploadDate": "2015-04-24T03:34:19Z",
		"ServerCertificateName": "gddddd",
		"ServerCertificateId": "ASCefaaa",
		"Path": "/cloudfront/",
		"Expiration": "2017-04-27T12:00:00Z"
	}, {
		"Arn": "arn:aws:iam::234858wwwwww",
		"UploadDate": "2016-05-26T13:28:51Z",
		"ServerCertificateName": "aaaaaaafgfdbgb",
		"ServerCertificateId": "ASCAINCB5YRT2GYSLN4VC",
		"Path": "/cloudfront/",
		"Expiration": "2018-05-31T12:00:00Z"
	}]
}

  var list3 = {
    "ServerCertificateMetadataList": [
        {
            "Arn": "arn:aws:iam::6",
            "UploadDate": "2016-01-11T21:24:08Z",
            "ServerCertificateName": "routerw",
            "ServerCertificateId": "ASssss4",
            "Path": "/",
            "Expiration": "2016-11-20T04:40:59Z"
        },
        {
            "Arn": "asssqqqqeeerr",
            "UploadDate": "2015-04-24T03:34:19Z",
            "ServerCertificateName": "gddddd",
            "ServerCertificateId": "ASCefaaa",
            "Path": "/cloudfront/",
            "Expiration": "2017-05-30T12:00:00Z"
        },
        {
            "Arn": "arn:aws:iam::234858wwwwww",
            "UploadDate": "2016-05-26T13:28:51Z",
            "ServerCertificateName": "aaaaaaafgfdbgb",
            "ServerCertificateId": "ASCAINCB5YRT2GYSLN4VC",
            "Path": "/cloudfront/",
            "Expiration": "2018-05-31T12:00:00Z"
        },
        {
            "Arn": "assssqqqqqqq",
            "UploadDate": "2015-04-24T03:34:19Z",
            "ServerCertificateName": "gddddd",
            "ServerCertificateId": "ASCefaaa",
            "Path": "/cloudfront/",
            "Expiration": "2017-04-27T12:00:00Z"
        }
        
    ]
} 