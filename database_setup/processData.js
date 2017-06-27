abbreviationMappings = {
	AL:"Alabama", AK:"Alaska", AZ:"Arizona", AR:"Arkansas", CA:"California", CO:"Colorado", CT:"Connecticut", DC:"District of Columbia", DE:"Delaware", FL:"Florida", GA:"Georgia", HI:"Hawaii", ID:"Idaho", IL:"Illinois", IN:"Indiana", IA:"Iowa", KS:"Kansas", KY:"Kentucky", LA:"Louisiana", ME:"Maine", MD:"Maryland", MA:"Massachusetts", MI:"Michigan", MN:"Minnesota", MS:"Mississippi", MO:"Missouri", MT:"Montana", NE:"Nebraska", NV:"Nevada", NH:"New Hampshire", NJ:"New Jersey", NM:"New Mexico", NY:"New York", NC:"North Carolina", ND:"North Dakota", OH:"Ohio", OK:"Oklahoma", OR:"Oregon", PA:"Pennsylvania", PR:"Puerto Rico", RI:"Rhode Island", SC:"South Carolina", SD:"South Dakota", TN:"Tennessee", TX:"Texas", UT:"Utah", VT:"Vermont", VA:"Virginia", WA:"Washington", WV:"West Virginia", WI:"Wisconsin", WY:"Wyoming"
}

conn = new Mongo();
// db = conn.getDB("ds151909.mlab.com:51909/heroku_2l5qrfnd");
db = connect("localhost:27017/febp");

print("type: " + type);
print("sheets: " + sheets);

if (type == "states") {
	if (sheets == "all") {
		sections = ["states_students", "states_grants", "states_outcomes", "states_loans", "states_schools"];
	} else {
		sections = sheets
	}
} else if (type == "institutions") {
	if (sheets == "all") {
		sections = ["inst_students", "inst_grants", "inst_outcomes", "inst_loans", "inst_schools"]
	} else {
		sections = sheets
	}
}

for (i = 0; i < sections.length; i++) {
	print("processing: " + sections[i]);

	print("nesting years");
	nestYears(sections[i]);

	if (type == "states") {
		print("setting full state names");
		setFullStateNames(sections[i]);
	}

	print("adding path keys");
	addPathKeys(sections[i]);
}

// nest year data
function nestYears(collection) {
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

		if (finalValObject) {
			db[collection].updateOne(
				{"_id": id},
				{ $set: finalValObject }
			);
		}
	}

	//remove original/now obsolete year categories
	db[collection].updateMany({}, { $unset: keysToUnset })
}

function addPathKeys(collection) {
	if (type == "states") {
		db[collection].updateMany( {}, { $rename: { "state": "name"}});
	} else {
		db[collection].updateMany( {}, { $rename: { "school": "name"}});
		db[collection].updateMany( {}, { $rename: { "INSTNM": "name"}});
	}

	cursor = db[collection].find();

	while ( cursor.hasNext()) {
		curr = cursor.next();
		name = curr.name
		id = curr._id
		
		path = name.toLowerCase().replace(/ /g, "_").replace("&", "and").replace(/,/g, "").replace(/-/g, "_").replace(/'/g, "")

		if (path) {
			db[collection].updateOne(
				{"_id": id},
				{ $set: { path : path }}
			);
		}
	}
}

function setFullStateNames(collection) {
	db[collection].updateMany( {}, { $rename: { "state": "state_abbrev"}});

	cursor = db[collection].find();	

	while ( cursor.hasNext()) {
		curr = cursor.next();
		stateAbbrev = curr.state_abbrev;
		fullStateName = abbreviationMappings[stateAbbrev];
		id = curr._id;
		
		db[collection].updateOne(
			{"_id": id},
			{ $set: { name : fullStateName }}
		);
	}
}

module.exports = {
	nestYears: nestYears
}
