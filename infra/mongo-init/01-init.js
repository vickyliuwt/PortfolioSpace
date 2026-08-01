// runs once on first mongo boot
// just make the db + a marker
db = db.getSiblingDB("portfoliospace");
db.createCollection("_bootstrap");
db._bootstrap.insertOne({ note: "portfoliospace ready", at: new Date() });
print("portfoliospace db ready");
