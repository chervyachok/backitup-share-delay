const mongoose = require('mongoose');

async function drop(keep) {
    // Fetch all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();

    for (const collection of collections) {
        if (!keep?.find(k => k === collection.name)) {
            console.log(`Dropping collection: ${collection.name}`);
            await mongoose.connection.db.dropCollection(collection.name);
        }
    }
}

module.exports = {
	drop,
};