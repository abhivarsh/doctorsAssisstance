const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    console.log('MongoDB connected successfully!!');
  } catch (err) {
    console.error(err.message);
    //Exit the process with a failure.
    process.exit(1);
  }
};

module.exports = connectDB;
