var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
const path = require('path');
const dbUrl = process.env.NODE_ENV == "development" ? "mongodb://localhost:27017/febp" : "mongodb://heroku_2l5qrfnd:bm3ve3469v2or4vpb1c2ajq0rm@ds151909.mlab.com:51909/heroku_2l5qrfnd";
var app = express();
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

var sortAlpha = (a, b) => {
  let A = a.name.toLowerCase(),
    B = b.name.toLowerCase();

  if (A < B){
    return -1;
  } else if (A > B){
    return  1;
  } else {
    return 0;
  }
}

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(dbUrl, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 3000, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/api/state-list', (req, res) => {
  db.collection('states_students').find({}, { name: 1, path: 1 }).toArray(function(err, docs) {
    docs.sort(sortAlpha);
    if (err) {
      handleError(res, err.message, "Failed to get states.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get('/api/institution-list', (req, res) => {
  db.collection('inst_students').find({}, { name: 1, path: 1 }).toArray(function(err, docs) {
    docs.sort(sortAlpha);
    if (err) {
      handleError(res, err.message, "Failed to get institutions.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get('/api/indicator-list', (req, res) => {
  db.collection('indicators').find({}, { name: 1, path: 1 }).toArray(function(err, docs) {
    docs.sort(sortAlpha);
    if (err) {
      handleError(res, err.message, "Failed to get indicators.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get('/api/state/:path/:sheet', (req, res) => {
  console.log(req.params.sheet)
  db.collection('states_' + req.params.sheet).findOne({path:req.params.path}, function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get state.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get('/api/institution/:path/:sheet', (req, res) => {
  db.collection('inst_' + req.params.sheet).findOne({path:req.params.path}, function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get institution.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get('/api/indicator/:path', (req, res) => {
  db.collection('indicators').findOne({path:req.params.path}, function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get indicators.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post('/api/update_indicator', (req, res) => {
  var id = new mongodb.ObjectId(req.body._id);
  delete req.body._id

  db.collection('indicators').updateOne({_id: id}, { $set: req.body}, function(err, docs) {
    console.log(err, docs);
    if (err) {
      handleError(res, err.message, "Failed to set indicators.");
    } else {
      res.status(200).json(docs);
    }
  });
});

// app.get('/api/data-download/:collection/:type', (req, res) => {
//   const { collection, type } = req.params;
//   let whichField = {};
//   whichField[type] = 1;
//   console.log(whichField);
//   console.log(collection, type);

//   console.log(req.params.collection);
//   db.collection('febp').find({}, whichField).toArray(function(err, docs) {
//     docs = docs.map((d) => {
//       return d[type][0];
//     })
//     // docs.sort(sortAlpha);
//     if (err) {
//       handleError(res, err.message, "Failed to get");
//     } else {
//       res.status(200).json(docs);
//     }
//   });
// });
