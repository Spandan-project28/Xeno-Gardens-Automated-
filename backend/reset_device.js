const mongoose = require("mongoose");
require("dotenv").config();

async function reset() {
    await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/irrigation_db"
    );
    const result = await mongoose.connection.db.collection("devices").updateMany(
        {},
        {
            $set: {
                autoMode: false,
                pumpStatus: "OFF",
                manualOverrideUntil: null,
            },
        }
    );
    console.log(`✅ Reset ${result.modifiedCount} device(s) → autoMode=false, pumpStatus=OFF`);
    process.exit(0);
}

reset().catch((e) => {
    console.error("❌ Reset failed:", e.message);
    process.exit(1);
});
