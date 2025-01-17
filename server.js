var express = require("express");
var helmet = require('helmet')
var cors = require('cors')
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var Mongonaut = require("mongonaut");
var json2csv = require('json2csv');
var fs = require('fs');
var dataProcessingFunctions = require("./processUploadedData.js")
const path = require('path');

const dbUrl = process.env.NODE_ENV == "development" ? "mongodb://localhost:27017/febp" : process.env.MONGODB_URI;
// const dbUrl = process.env.MONGODB_URI

var app = express();

const statesList = ["AK","AL","AR","AZ","CA","CO","CT","DC","DE","FL","GA","HI","IA","ID","IL","IN","KS","KY","LA","MA","MD","ME","MI","MN","MO","MS","MT","NC","ND","NE","NH","NJ","NM","NV","NY","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VA","VT","WA","WI","WV","WY"];

app.use(helmet())
app.use(bodyParser.json({limit: '100mb'}));

var corsOptions = {
  origin: 'http://higheredindex.newamerica.org',
  optionsSuccessStatus: 200
}

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

function getProfileName(collections) {
  let profileName;
  collections.forEach((d) => {
    if (d && d.name) {
      profileName = d.name;
      return;
    }
  })

  return profileName;
}

function isFiftyState(abbrev) {
  if (!abbrev) { return false; }
  console.log(abbrev)
  if (statesList.indexOf(abbrev) > -1) {
    console.log("true")
    return true;
  } else {
    console.log("false")
    return false;
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

app.get('/api/state-list/', (req, res) => {
  db.collection('states_students').find({}, { name: 1, path: 1 }).toArray(function(err, docs) {
    docs.sort(sortAlpha);
    if (err) {
      res.status(500)
      res.json({
        message: err.message,
        error: err
      });
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get('/api/institution-list', (req, res) => {
  db.collection('inst_students').find({}, { name: 1, path: 1, sector: 1, state: 1 }).toArray(function(err, docs) {
    docs.sort(sortAlpha);
    if (err) {
      res.status(500)
      res.json({
        message: err.message,
        error: err
      });
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
      res.json({
        message: err.message,
        error: err
      });
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
        console.log("finished fetching " + collection);
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
      fetchCollection("states_schools_all", req.params.path),
      fetchCollection("states_schools_public4", req.params.path),
      fetchCollection("states_schools_public2", req.params.path),
      fetchCollection("states_schools_nonprofit", req.params.path),
      fetchCollection("states_schools_forprofit", req.params.path),
      fetchCollection("states_students", req.params.path),
    ])
    .then((collections) => {
      var [grants, loans, outcomes, schools_all, schools_public4, schools_public2, schools_nonprofit, schools_forprofit, students] = collections;
      let responseObject = {
        name: getProfileName(collections),
        path: req.params.path,
        grants: grants,
        loans: loans,
        outcomes: outcomes,
        schools: {
          all: schools_all,
          public4: schools_public4,
          public2: schools_public2,
          nonprofit: schools_nonprofit,
          forprofit: schools_forprofit,
        },
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
    .then((collections) => {
      var [grants, loans, outcomes, schools, students] = collections;
      let responseObject = {
        name: getProfileName(collections),
        path: req.params.path,
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
      res.json({
        message: err.message,
        error: err
      });
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get('/api/methodology', (req, res) => {
  db.collection('methodology').findOne({}, function(err, docs) {
    if (err) {
      res.status(500)
      res.json({
        message: err.message,
        error: err
      });
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post('/api/update_methodology/', cors(corsOptions), (req, res) => {
  if (req.body && req.body.text) {
    db.collection('methodology').updateOne({}, { $set: {"text" : req.body.text } }, { upsert: true } , function(err, docs) {
      if (err) {
        handleError(res, err.message, "Failed to set methodology.");
      } else {
        res.status(200).json(docs);
      }
    });
  }
});

app.get('/api/get-ranking/:collection/:direction/:variable/:year/:value', (req, res) => {
  var variable = req.params.variable + "." + req.params.year;
  var queryVal;
  var query = {};
  console.log("getting ranking")

  if (req.params.direction == "lowest") {
    queryVal = { $lt : Number(req.params.value)};
  } else {
    queryVal = { $gt : Number(req.params.value)};
  }
  
  query[variable] = queryVal;

  db.collection(req.params.collection).find(query, {state : 1}).toArray(function(err, docs) {
    if (err) {
      res.status(500)
      res.json({
        message: err.message,
        error: err
      });
    } else {
      
      res.status(200).json(docs.filter((d) => { return isFiftyState(d.state); }).length);
    }
  });
});

app.get('/api/full-collection/:collection', (req, res) => {
  if (req.params.collection.indexOf("-") > -1) {
    let collections = req.params.collection.split("-")
    Promise.all([
      new Promise((resolve, reject) => {
        db.collection(collections[0]).find({}).toArray(function(err, docs) {
          if (err) {
            reject(err);
          } else {
            console.log("finished fetching " + collections[0]);
            resolve(docs);
          }
        })
      }),
      new Promise((resolve, reject) => {
        db.collection(collections[1]).find({}).toArray(function(err, docs) {
          if (err) {
            reject(err);
          } else {
            console.log("finished fetching " + collections[1]);
            resolve(docs);
          }
        })
      }),
    ])
    .then((collections) => {
      var [coll1, coll2] = collections;
      var responseArray = []

      console.log(coll1, coll2)

      responseArray = coll1.map((coll1Object) => {
        let retObject = {};
        Object.assign(retObject, coll1Object)
        let state = coll1Object.state;

        coll2.forEach((coll2Object) => {
          if (coll2Object.state === state) {
            Object.assign(retObject, coll2Object)
          }
        })

        return retObject
      })

      console.log(responseArray)
      
      res.status(200).json(responseArray.filter((d) => { return isFiftyState(d.state); })) 
    })
    .catch(function(err) {
      // Will catch failure of first failed promise
      console.log("Failed:", err);
    });
  } else {
    db.collection(req.params.collection).find({}).toArray(function(err, docs) {
      if (err) {
        res.status(500)
        res.json({
          message: err.message,
          error: err
        });
      } else {
        res.status(200).json(docs.filter((d) => { return isFiftyState(d.state); }));
      }
    });
  }
});

app.get('/api/us-data/:collection', (req, res) => {
  if (req.params.collection.indexOf("-") > -1) {
    let collections = req.params.collection.split("-")
    Promise.all([
      new Promise((resolve, reject) => {
        db.collection(collections[0]).findOne({"state":"US"}, function(err, docs) {
          if (err) {
            reject(err);
          } else {
            console.log("finished fetching " + collections[0]);
            resolve(docs);
          }
        })
      }),
      new Promise((resolve, reject) => {
        db.collection(collections[1]).findOne({"state":"US"}, function(err, docs) {
          if (err) {
            reject(err);
          } else {
            console.log("finished fetching " + collections[1]);
            resolve(docs);
          }
        })
      }),
    ])
    .then((collections) => {
      var [coll1, coll2] = collections;
      var responseObject = {}

      Object.assign(responseObject, coll1, coll2)

      console.log(responseObject)
      
      res.status(200).json(responseObject); 
    })
    .catch(function(err) {
      // Will catch failure of first failed promise
      console.log("Failed:", err);
    });
  } else {
    db.collection(req.params.collection).findOne({"state":"US"}, function(err, docs) {
      if (err) {
        res.status(500)
        res.json({
          message: err.message,
          error: err
        });
      } else {
        res.status(200).json(docs);
      }
    });
  }
});

app.get('/api/state-congressional-district-info/:state', (req, res) => {
  db.collection('inst_schools').aggregate(
      [
        {
          $match: {'state': req.params.state}
        },
        {
          $group: {
            _id: "$cngdstcd",
            count: { $sum: 1 }
          }
        }
      ]
    ).toArray(function(err, docs) {
    if (err) {
      res.status(500)
      res.json({
        message: err.message,
        error: err
      });
    } else {
      res.status(200).json(docs);
    }
  });
});
   
app.post('/api/update_data/:collection', cors(corsOptions), (req, res) => {
    db.collection(req.params.collection).drop();

    db.collection(req.params.collection).insertMany(req.body, function(err, docs) {
      if (err) {
        console.log(err)
        res.status(500)
        res.json({
          message: err.message,
          error: err
        });
      } else {
        console.log("success!");
        db.collection("data_info").updateOne({collection: req.params.collection}, { $set: {last_updated: new Date(), fileType: "data"}}, { upsert: true})
        res.status(200).json({});
      }
    });
});

app.post('/api/update_codebook/:type', cors(corsOptions), (req, res) => {
  db.collection("codebooks").replaceOne({type: req.params.type}, req.body, { upsert: true}, function(err, docs) {
    if (err) {
      console.log(err)
      res.status(500)
      res.json({
        message: err.message,
        error: err
      });
    } else {
      console.log("success!");
      db.collection("data_info").updateOne({collection: "codebook_" + req.params.type}, { $set: {last_updated: new Date(), fileType: "codebook"}}, { upsert: true})
      res.status(200).json({});
    }
  })
});

app.post('/api/update_indicator/', cors(corsOptions), (req, res) => {
  var action = req.body.action;
  delete req.body.action;

  if (action == "update") {
    var id = new mongodb.ObjectId(req.body._id);
    delete req.body._id

    db.collection('indicators').updateOne({_id: id}, { $set: req.body}, { upsert: true}, function(err, docs) {
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

  console.log(process.memoryUsage().heapUsed)
  
  db.collection(collection).find({}).toArray(function(err, docs) {
    console.log(process.memoryUsage().heapUsed)
    if (err) {
      handleError(res, err.message, "Failed to get");
    } else {
      json2csv({ data:docs, flatten:true}, function(err, csv) {
        if (err) return console.log(err);
        console.log(process.memoryUsage().heapUsed)
        fs.writeFile(collection + '.csv', csv, function(err) {
          if (err) throw err;
          console.log(process.memoryUsage().heapUsed)
          res.download(collection + '.csv');
          console.log(process.memoryUsage().heapUsed)
          global.gc()
          console.log(process.memoryUsage().heapUsed)
        });
      });
    }
  });
});

app.get('/api/download_codebook/:type', (req, res) => {
  const { type } = req.params;
  
  db.collection("codebooks").find({"type":type}).toArray(function(err, docs) {
    if (err || !docs || !docs[0]) {
      handleError(res, err.message, "Failed to get");
    } else {
      json2csv({ data:docs[0].data}, function(err, csv) {
        if (err) return console.log(err);
  
        fs.writeFile(type + '.csv', csv, function(err) {
          if (err) throw err;
    
          res.download(type + '.csv');
        });
      });
    }
  });
});
