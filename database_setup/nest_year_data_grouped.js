sections = [
	{
		name: "students",
	},
	{
		name: "schools",
	},
]
conn = new Mongo();
db = conn.getDB("testjoin");
cursor = db.final.find();

example = db.final.findOne();
printjson( example );

for(i = 0; i < sections.length; i++) {
	section = sections[i].name
	originalKeys = Object.keys(example[section])
	// print(originalKeys)
	dedupedKeys = new Set();

	originalKeys.map(function(key) {
		dedupedKeys.add(key.replace(/_[0-9]{4}/i, ''));
	})
	// print(Array.from(dedupedKeys))
	// print("NEXT")
	sections[i].keys = originalKeys;
}

// keyArray = Array.from(originalKeys)

regEx = new RegExp('_[0-9]{4}');
counter = 0
while ( cursor.hasNext()) {
	curr = cursor.next();
	id = curr._id
	print(counter)
	for (secI = 0; secI < sections.length; secI++) {
		section = sections[secI]
		keyArray = section.keys

		for (var i = 0; i < keyArray.length; i++) {
			var originalKey = keyArray[i];
			if (regEx.test(originalKey)) {
				variable = originalKey.replace(/_[0-9]{4}/i, '');
				year = originalKey.match(/[0-9]{4}/i);
				value = curr[section.name][originalKey]
				newFieldRef = section.name + "." + variable + "." + year;
				oldFieldRef = section.name + "." + originalKey;

				db.final.updateOne(
					{"_id": id},
					{ $set: { [newFieldRef] : value },
					  $unset: { [oldFieldRef] : ""}
					}
				);
			}
		}

	}
		
		
	counter++;
}