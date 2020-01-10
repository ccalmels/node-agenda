const express = require('express');
const bodyParser = require("body-parser")
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const assert = require('assert');

const app = express();
const port = 3000;
const uri = 'mongodb://127.0.0.1:27017/';

function express_start(events) {
    app.use(express.static('public'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true })); //extended:true to encode objects and arrays  https://github.com/expressjs/body-parser#bodyparserurlencodedoptions

    app.get('/data', function(req, res) {
	events.find({
	    "end_date": { "$gt": req.query.from },
	    "start_date": { "$lt": req.query.to }
	}).toArray(function (err, data) {
	    //set the id property for all client records to the database records, which are stored in ._id field
	    for (var i = 0; i < data.length; i++){
		data[i].id = data[i]._id;
		delete data[i]["!nativeeditor_status"];
	    }
	    //output response
	    res.send(data);
	});
    });

    app.post('/data', function (req, res) {
        var data = req.body;
        var mode = data["!nativeeditor_status"];
        var sid = data.id;
        var tid = sid;

        function update_response(err) {
            if (err)
                mode = "error";
            else if (mode == "inserted") {
                tid = data._id;
            }
            res.setHeader("Content-Type", "application/json");
            res.send({ action: mode, sid: sid, tid: String(tid) });
        }

        if (mode == "updated") {
            events.updateOne({"_id": ObjectId(tid)}, {$set: data}, update_response);
        } else if (mode == "inserted") {
            events.insertOne(data, update_response);
        } else if (mode == "deleted") {
            events.deleteOne({"_id": ObjectId(tid)}, update_response)
        } else
            res.send("Not supported operation");
    });

    app.listen(port, function() {
	console.log("Server is running on port " + port + "...");
    });
}

MongoClient.connect(uri, { useUnifiedTopology: true }, function(err, client) {
    assert.equal(null, err);
    console.log("Connected successfully to mongoDB server");

    return express_start(client.db('Agenda').collection('events'));
});
