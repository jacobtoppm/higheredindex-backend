conn = new Mongo();
db = conn.getDB("live_test");

sections = ["grants"];

for (i = 0; i < sections.length; i++) {
	print("********************************************************************")
	print()
	print(sections[i]);
	print();
	print("********************************************************************")

	count(sections[i]);
}


function count(collection) {
	cursor = db[collection].find();

	example = db[collection].findOne();
	keyList = Object.keys(example);

	counts = {};

	// printjson(example)

	for (i = 0; i < keyList.length; i++) {
		key = keyList[i]
		// print(typeof example[key])
		if (typeof example[key] == "object" && key != "unitid") {
			countList = counts[key] = {};
			for (var year = 2006; year < 2015; year++) {
				countList[year] = 0;
			}
		} else {
			counts[key] = 0
		}
	}

	// printjson(counts)

	counter = 0;
	while ( cursor.hasNext()) {
		// print(counter);
		curr = cursor.next();

		for (i = 0; i < keyList.length; i++) {
			key = keyList[i]
			if (typeof counts[key] == "object") {
				if (curr && curr[key]) {
					for (var year = 2006; year < 2015; year++) {
						if (curr[key][year] || curr[key][year] === 0) {
							counts[key][year]++;
						} else {
							// printjson(curr[key])
						}
					}
				}
			} else {
				if (curr[key]) {
					counts[key]++;
				} else {
					// print(curr[key])
				}
			}
		}
		
		
		counter++;
	}

	printjson(counts);
}