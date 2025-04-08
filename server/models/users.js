const mongoose =require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mail: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    orders: [{
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        cost: {
            type: Number,
            required: true
        },
        image: {
            type: String, // Store the image as a URL or Base64 string
            required: true
        }
    }]
});

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;