Start Mongo Server: mongod

~States~

Import CSV Data:
mongoimport --db febp --collection states_students --type csv --headerline --file data/states/ed-index-students-states.csv
mongoimport --db febp --collection states_outcomes --type csv --headerline --file data/states/ed-index-outcomes-states.csv
mongoimport --db febp --collection states_schools --type csv --headerline --file data/states/ed-index-schools-states.csv
mongoimport --db febp --collection states_grants --type csv --headerline --file data/states/ed-index-grants-states.csv
mongoimport --db febp --collection states_loans --type csv --headerline --file data/states/ed-index-loans-states.csv

Process data:
mongo --eval 'let type="states", sheets="all"' ./database_setup/processData.js 



~Institutions~

Import CSV Data:
mongoimport --db febp --collection inst_students --type csv --headerline --file data/inst/ed-index-students-inst.csv
mongoimport --db febp --collection inst_outcomes --type csv --headerline --file data/inst/ed-index-outcomes-inst.csv
mongoimport --db febp --collection inst_schools --type csv --headerline --file data/inst/ed-index-schools-inst.csv
mongoimport --db febp --collection inst_grants --type csv --headerline --file data/inst/ed-index-grants-inst.csv
mongoimport --db febp --collection inst_loans --type csv --headerline --file data/inst/ed-index-loans-inst.csv

Process data:
mongo --eval 'let type="institutions", sheets="all"' ./database_setup/processData.js 



Uploading to Production Database

mongodump --db febp

