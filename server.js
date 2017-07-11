var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var Mongonaut = require("mongonaut");
var json2csv = require('json2csv');
var fs = require('fs');
var dataProcessingFunctions = require("./processUploadedData.js")
const path = require('path');
const dbUrl = process.env.NODE_ENV == "development" ? "mongodb://localhost:27017/febp" : "mongodb://heroku_2l5qrfnd:bm3ve3469v2or4vpb1c2ajq0rm@ds151909.mlab.com:51909/heroku_2l5qrfnd";
var app = express();
app.use(bodyParser.json({limit: '50mb'}));

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
let db;

var sortAlpha = (a, b) => {
  let A = a.name ? a.name.toLowerCase() : null,
    B = b.name ? b.name.toLowerCase() : null;

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
      res.status(500)
      res.render('error', {error:err.message});
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get('/api/institution-list', (req, res) => {
  db.collection('inst_students').find({}, { name: 1, path: 1 }).toArray(function(err, docs) {
    docs.sort(sortAlpha);
    if (err) {
      res.status(500)
      res.render('error', {error:err.message});
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

app.get('/api/data-info', (req, res) => {
  db.collection('data_info').find({}).toArray(function(err, docs) {
    if (err) {
      res.status(500)
      res.render('error', {error:err.message});
    } else {
      res.status(200).json(docs);
    }
  });
});


let fetchCollection = (collection, path) => {
  return new Promise((resolve, reject) => {
    db.collection(collection).findOne({path:path}, function(err, docs) {
      if (err) {
        reject(err);
      } else {
        console.log("finished " + collection);
        resolve(docs);
      }
    })
  })
}

app.get('/api/state/:path', (req, res) => {
  Promise.all([
      fetchCollection("states_grants", req.params.path),
      fetchCollection("states_loans", req.params.path),
      fetchCollection("states_outcomes", req.params.path),
      fetchCollection("states_schools", req.params.path),
      fetchCollection("states_students", req.params.path),
    ])
    .then(([grants, loans, outcomes, schools, students]) => {
      let responseObject = {
        name: grants.name,
        path: grants.path,
        grants: grants,
        loans: loans,
        outcomes: outcomes,
        schools: schools,
        students: students
      } 
      res.status(200).json(responseObject); 
    })
    .catch(function(err) {
      // Will catch failure of first failed promise
      console.log("Failed:", err);
    });
});

app.get('/api/institution/:path', (req, res) => {
  Promise.all([
      fetchCollection("inst_grants", req.params.path),
      fetchCollection("inst_loans", req.params.path),
      fetchCollection("inst_outcomes", req.params.path),
      fetchCollection("inst_schools", req.params.path),
      fetchCollection("inst_students", req.params.path),
    ])
    .then(([grants, loans, outcomes, schools, students]) => {
      let responseObject = {
        name: grants.name,
        path: grants.path,
        grants: grants,
        loans: loans,
        outcomes: outcomes,
        schools: schools,
        students: students
      } 
      res.status(200).json(responseObject); 
    })
    .catch(function(err) {
      // Will catch failure of first failed promise
      console.log("Failed:", err);
    });
});

app.get('/api/indicator/:path', (req, res) => {
  db.collection('indicators').findOne({path:req.params.path}, function(err, docs) {
    if (err) {
      res.status(500)
      res.render('error', {error:err})
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post('/api/update_data/:collection', (req, res) => {
  db.collection(req.params.collection).drop();
  // console.log(req.body);

  var processedData = dataProcessingFunctions.processData(req.body);
  console.log(processedData);

  db.collection(req.params.collection).insertMany(processedData, function(err, docs) {
    console.log(err, docs);
    if (err) {
      res.status(500)
      res.render('error', {error:err})
    } else {
      console.log("success!");
      db.collection("data_info").updateOne({collection: req.params.collection}, { $set: {last_updated: new Date()}})
      res.status(200).json({});
    }
  });


});

app.post('/api/update_indicator/', (req, res) => {
  console.log(req.body);
  var action = req.body.action;
  delete req.body.action;

  if (action == "update") {
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
  } else if (action == "insert") {
     db.collection('indicators').insert(req.body, function(err, docs) {
      console.log(err, docs);
      if (err) {
        handleError(res, err.message, "Failed to set indicators.");
      } else {
        res.status(200).json(docs);
      }
    });
  } else {
    var id = new mongodb.ObjectId(req.body._id);
    delete req.body._id

    db.collection('indicators').deleteOne({_id: id}, function(err, docs) {
      console.log(err, docs);
      if (err) {
        handleError(res, err.message, "Failed to set indicators.");
      } else {
        res.status(200).json(docs);
      }
    });
  }
});

app.get('/api/download_data/:collection', (req, res) => {
  const { collection } = req.params;
  
  db.collection(collection).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get");
    } else {
      json2csv({ data:docs, flatten:true}, function(err, csv) {
        if (err) return console.log(err);
        
        fs.writeFile(collection + '.csv', csv, function(err) {
          if (err) throw err;
          
          res.download(collection + '.csv');
        });
      });
    }
  });
});
