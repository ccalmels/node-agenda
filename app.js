const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const app = express();
const port = 3000;

const uri = 'mongodb://127.0.0.1:27017/';

MongoClient.connect(uri, { useUnifiedTopology: true }, function(err, client) {
    assert.equal(null, err);
    console.log("Connected successfully to mongoDB server");

    const events = client.db('Agenda').collection('events');

    app.use(express.static('public'));

    app.get('/data', function(req, res) {
	events.find().toArray(function (err, data) {
            //set the id property for all client records to the database records, which are stored in ._id field
            for (var i = 0; i < data.length; i++){
		data[i].id = data[i]._id;
		delete data[i]["!nativeeditor_status"];
            }
            //output response
            res.send(data);
	});
    });

    app.listen(port, function() {
	console.log("Server is running on port " + port + "...");
    });
});
