// connect to db
sections = ["schools", "students", "outcomes", "grants", "loans"];
conn = new Mongo();
db = conn.getDB("live_test");

// nest year data

for (i = 0; i < sections.length; i++) {
	print("nesting " + sections[i]);
	nest(sections[i]);
}

function nest(collection) {
	cursor = db[collection].find();

	example = db[collection].findOne();
	originalKeys = Object.keys(example)
	keysToReplace = new Set();
	keysToUnset = {};

	regEx = new RegExp('_[0-9]{4}');

	originalKeys.map(function(key) {
		if (regEx.test(key)) {
			keysToReplace.add(key.replace(/_[0-9]{4}/i, ''));
			keysToUnset[key] = "";
		}
	})

	keyArray = Array.from(keysToReplace)

	while ( cursor.hasNext()) {
		curr = cursor.next();
		id = curr._id
		finalValObject = {}
		for (var i = 0; i < keyArray.length; i++) {
			var key = keyArray[i],
				values = {};

			for (var year = 2006; year < 2015; year++) {
				val = curr[key + "_" + year]


				if (!isNaN(val)) {
					values[year] = val;
				}
			}

			finalValObject[key] = values
		}

		db[collection].updateOne(
			{"_id": id},
			{ $set: finalValObject }
		);
	}

	//remove original/now obsolete year categories
	db[collection].updateMany({}, { $unset: keysToUnset })
}

//add sections to final collection

db.schools.find({}, { opeidstring: 1, school: 1 }).forEach(function(doc){ db.final_test.insert(doc); });

print("adding schools to final_test collection");
db.final_test.aggregate([{ $lookup: { from:"schools", localField:"opeidstring", foreignField:"opeidstring", as:"schools" }},{ $out: "final_test"}]);
print(db.final_test.count({}));
print("adding students to final_test collection");
db.final_test.aggregate([{ $lookup: { from:"students", localField:"opeidstring", foreignField:"opeidstring", as:"students" }},{ $out: "final_test"}]);
print(db.final_test.count({}));
print("adding loans to final_test collection");
db.final_test.aggregate([{ $lookup: { from:"loans", localField:"opeidstring", foreignField:"opeidstring", as:"loans" }},{ $out: "final_test"}]);
print(db.final_test.count({}));
print("adding grants to final_test collection");
db.final_test.aggregate([{ $lookup: { from:"grants", localField:"opeidstring", foreignField:"opeidstring", as:"grants" }},{ $out: "final_test"}]);
print(db.final_test.count({}));
print("adding outcomes to final_test collection");
db.final_test.aggregate([{ $lookup: { from:"outcomes", localField:"opeidstring", foreignField:"opeidstring", as:"outcomes" }},{ $out: "final_test"}]);
print(db.final_test.count({}));


db.final_test.updateMany( {}, { $rename: { "school": "name"}});
