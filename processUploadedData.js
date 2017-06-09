

function nestYears(inputData) {
	let regEx = new RegExp('_[0-9]{4}');
	let retArray = [];
	inputData.forEach((d) => {
		let currItem = {};
		for (let key of Object.keys(d)) {
			if (regEx.test(key)) {
				let keyWithoutYears = key.replace(/_[0-9]{4}/i, ''),
					year = key.match(/[0-9]{4}/i);

				if (!(keyWithoutYears in currItem)) {
					currItem[keyWithoutYears] = {};
				} 
				currItem[keyWithoutYears][year] = d[key];
			} else {
				if (key == "INSTNM" || key == "school") {
					currItem.name = d[key];
				} else {
					currItem[key] = d[key];
				}
			}
		}
		retArray.push(currItem);
	})

	return retArray;
}

function addFullStateNames(inputData) {
	var abbreviationMappings = {
		AL:"Alabama", AK:"Alaska", AZ:"Arizona", AR:"Arkansas", CA:"California", CO:"Colorado", CT:"Connecticut", DC:"District of Columbia", DE:"Delaware", FL:"Florida", GA:"Georgia", HI:"Hawaii", ID:"Idaho", IL:"Illinois", IN:"Indiana", IA:"Iowa", KS:"Kansas", KY:"Kentucky", LA:"Louisiana", ME:"Maine", MD:"Maryland", MA:"Massachusetts", MI:"Michigan", MN:"Minnesota", MS:"Mississippi", MO:"Missouri", MT:"Montana", NE:"Nebraska", NV:"Nevada", NH:"New Hampshire", NJ:"New Jersey", NM:"New Mexico", NY:"New York", NC:"North Carolina", ND:"North Dakota", OH:"Ohio", OK:"Oklahoma", OR:"Oregon", PA:"Pennsylvania", PR:"Puerto Rico", RI:"Rhode Island", SC:"South Carolina", SD:"South Dakota", TN:"Tennessee", TX:"Texas", UT:"Utah", VT:"Vermont", VA:"Virginia", WA:"Washington", WV:"West Virginia", WI:"Wisconsin", WY:"Wyoming"
	}

	inputData.map((d) => {
		if (d.state) {
			d.state_abbrev = d.state;
			d.name = abbreviationMappings[d.state];
		}
	})

	return inputData;
}

function addPathKeys(inputData) {
	inputData.map((d) => {
		if (d.name) {
			d.path = d.name.toLowerCase().replace(/ /g, "_").replace("&", "and").replace(/,/g, "").replace(/-/g, "_").replace(/'/g, "")
		}
	})

	return inputData;
}

function processData(inputData) {
	let nested = nestYears(inputData);
	let withFullStateNames = addFullStateNames(nested);
	let withPathKeys = addPathKeys(withFullStateNames);

	return withPathKeys;
}
	// originalKeys = Object.keys(inputData[0])
	// keysToReplace = new Set();

	// 

	// originalKeys.map(function(key) {
	// 	if (regEx.test(key)) {
	// 		keysToReplace.add(key.replace(/_[0-9]{4}/i, ''));
	// 	}
	// })

	// keyArray = Array.from(keysToReplace)

	// while ( cursor.hasNext()) {
	// 	curr = cursor.next();
	// 	id = curr._id
	// 	finalValObject = {}
	// 	for (var i = 0; i < keyArray.length; i++) {
	// 		var key = keyArray[i],
	// 			values = {};

	// 		for (var year = 1990; year < 2020; year++) {
	// 			val = curr[key + "_" + year]

	// 			if (!isNaN(val)) {
	// 				values[year] = val;
	// 			}
	// 		}

	// 		finalValObject[key] = values
	// 	}

	// 	if (finalValObject) {
	// 		db[collection].updateOne(
	// 			{"_id": id},
	// 			{ $set: finalValObject }
	// 		);
	// 	}
	// }

// function addPathKeys(collection) {
// 	if (type == "states") {
// 		db[collection].updateMany( {}, { $rename: { "state": "name"}});
// 	} else {
// 		db[collection].updateMany( {}, { $rename: { "school": "name"}});
// 		db[collection].updateMany( {}, { $rename: { "INSTNM": "name"}});
// 	}

// 	cursor = db[collection].find();

// 	while ( cursor.hasNext()) {
// 		curr = cursor.next();
// 		name = curr.name
// 		id = curr._id
		
// 		path = name.toLowerCase().replace(/ /g, "_").replace("&", "and").replace(/,/g, "").replace(/-/g, "_").replace(/'/g, "")

// 		if (path) {
// 			db[collection].updateOne(
// 				{"_id": id},
// 				{ $set: { path : path }}
// 			);
// 		}
// 	}
// }

// function setFullStateNames(collection) {
// 	db[collection].updateMany( {}, { $rename: { "state": "state_abbrev"}});

// 	cursor = db[collection].find();	

// 	while ( cursor.hasNext()) {
// 		curr = cursor.next();
// 		stateAbbrev = curr.state_abbrev;
// 		fullStateName = abbreviationMappings[stateAbbrev];
// 		id = curr._id;
		
// 		db[collection].updateOne(
// 			{"_id": id},
// 			{ $set: { name : fullStateName }}
// 		);
// 	}
// }

module.exports = {
	processData: processData
}
