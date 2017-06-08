conn = new Mongo();
db = conn.getDB("febp");

valList = []

// db.states_combined.updateMany( {}, { $rename: { "state": "name"}});
db.inst_combined.updateMany( {}, { $rename: { "school": "name"}});

cursor = db.inst_combined.find();

while ( cursor.hasNext()) {
	curr = cursor.next();
	name = curr.name
	id = curr._id
	// print(name)
	path = name.toLowerCase().replace(/ /g, "_").replace("&", "and").replace(/,/g, "").replace(/-/g, "_").replace(/'/g, "")
	if (valList.indexOf(path) === -1) {
		valList.push(path);
	} else {
		print(name)
		print(path)
	}

	db.inst_combined.updateOne(
		{"_id": id},
		{ $set: { path : path }}
	);

}


