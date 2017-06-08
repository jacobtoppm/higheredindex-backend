conn = new Mongo();
// db = conn.getDB("ds151909.mlab.com:51909/heroku_2l5qrfnd");
db = connect("localhost:27017/febp");

// sections = ["states_students", "states_grants", "states_outcomes", "states_loans", "states_schools"];
sections = ["inst_students", "inst_grants", "inst_outcomes", "inst_loans", "inst_schools"]

// nest year data

for (i = 0; i < sections.length; i++) {
	print("nesting " + sections[i]);
	nest(sections[i]);
}

function nest(collection) {
	cursor = db[collection].find();

	example = db[collection].findOne();
	printjson(example)
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

			for (var year = 1990; year < 2020; year++) {
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