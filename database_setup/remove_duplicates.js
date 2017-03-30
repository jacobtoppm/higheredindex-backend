conn = new Mongo();
db = conn.getDB("live");
cursor = db.institutions.find();

example = db.institutions.findOne();
printjson( example );
originalKeys = Object.keys(example)
dedupedKeys = new Set();

// originalKeys.map(function(key) {
// 	dedupedKeys.add(key.replace(/_[0-9]{4}/i, ''));
// })

keyArray = Array.from(originalKeys)

regEx = new RegExp('_[0-9]{4}');

while ( cursor.hasNext() ) {
	curr = cursor.next();
	id = curr._id
	print(id)
	for (var i = 0; i < keyArray.length; i++) {
		var key = keyArray[i];
		if (regEx.test(key)) {
			variable = key.replace(/_[0-9]{4}/i, '');
			year = key.match(/[0-9]{4}/i);
			fullFieldRef = variable + "." + year;
			db.institutions.updateOne(
				{"_id": id},
				{ $set: { [fullFieldRef] : curr[key] },
				  $unset: { [key] : ""}
				}
			);
		}
	}

}