conn = new Mongo();
db = conn.getDB("febp");

db.states_combined.updateMany( {}, { $rename: { "state": "state_abbrev"}});

var abbreviationMappings = {
	AL:"Alabama",
	AK:"Alaska",
	AZ:"Arizona",
	AR:"Arkansas",
	CA:"California",
	CO:"Colorado",
	CT:"Connecticut",
	DC:"District of Columbia",
	DE:"Delaware",
	FL:"Florida",
	GA:"Georgia",
	HI:"Hawaii",
	ID:"Idaho",
	IL:"Illinois",
	IN:"Indiana",
	IA:"Iowa",
	KS:"Kansas",
	KY:"Kentucky",
	LA:"Louisiana",
	ME:"Maine",
	MD:"Maryland",
	MA:"Massachusetts",
	MI:"Michigan",
	MN:"Minnesota",
	MS:"Mississippi",
	MO:"Missouri",
	MT:"Montana",
	NE:"Nebraska",
	NV:"Nevada",
	NH:"New Hampshire",
	NJ:"New Jersey",
	NM:"New Mexico",
	NY:"New York",
	NC:"North Carolina",
	ND:"North Dakota",
	OH:"Ohio",
	OK:"Oklahoma",
	OR:"Oregon",
	PA:"Pennsylvania",
	PR:"Puerto Rico",
	RI:"Rhode Island",
	SC:"South Carolina",
	SD:"South Dakota",
	TN:"Tennessee",
	TX:"Texas",
	UT:"Utah",
	VT:"Vermont",
	VA:"Virginia",
	WA:"Washington",
	WV:"West Virginia",
	WI:"Wisconsin",
	WY:"Wyoming"
}

cursor = db.states_combined.find();

while ( cursor.hasNext()) {
	curr = cursor.next();
	stateAbbrev = curr.state_abbrev
	name = abbreviationMappings[stateAbbrev]
	id = curr._id
	print(stateAbbrev)
	print(name)
	
	db.states_combined.updateOne(
		{"_id": id},
		{ $set: { name : name }}
	);

}
