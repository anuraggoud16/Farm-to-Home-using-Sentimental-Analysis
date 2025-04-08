const mongoose =require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            'mongodb+srv://kanuraggoud:farmtohome@farm2home.nuelp.mongodb.net/farm2home?retryWrites=true&w=majority&appName=Farm2Home'
        );
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};
module.exports = connectDB;