const mongoose =require('mongoose')

const farmerSchema = new mongoose.Schema({
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
    products: [{
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
        },
        rating: {
            type: Number,
            required: true
        }
    }]
});

const farmerModel = mongoose.model("farmers", farmerSchema);
module.exports = farmerModel;