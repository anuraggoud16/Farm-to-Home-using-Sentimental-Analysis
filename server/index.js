const express = require('express');
const connectDB = require('./db.js');
const farmerModel = require('./models/farmers.js');
const userModel = require('./models/users.js');
const crypto = require('crypto'); 
const cors = require('cors');
const mongoose =require('mongoose');
const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const Sentiment = require('sentiment');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

connectDB();

const sentiment = new Sentiment();

// Razorpay configuration
const razorpay = new Razorpay({
  key_id: 'rzp_test_512Znk0awantVQ',
  key_secret: 'h3l4a95FYwpeouwRHivNbJuY', 
});

// Route to create an order
app.post('/api/create-order', async (req, res) => {
  const { amount, currency, receipt, notes } = req.body;

  const options = {
    amount: amount * 100, // Convert to paise
    currency,
    receipt,
    payment_capture: 1, // Auto-capture
    notes,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Route to verify payment
app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const generated_signature = crypto
    .createHmac('sha256', razorpay.key_secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    // Signature is valid
    res.json({ status: 'ok' });
    // TODO: Update order status in your database
  } else {
    // Invalid signature
    res.status(400).json({ status: 'verification_failed' });
  }
});



// // Route to create an order
// app.post('/api/create-order', async (req, res) => {
//   try {
//     const { amount, currency, receipt } = req.body;
    
//     const options = {
//       amount: amount * 100, // Amount in paise
//       currency,
//       receipt,
//       payment_capture: 1 // 1 for auto-capture, 0 for manual
//     };

//     const order = await razorpay.orders.create(options);
//     res.json(order);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error creating order');
//   }
// });

// // Route to verify payment
// app.post('/api/verify-payment', (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//   const body = razorpay_order_id + '|' + razorpay_payment_id;
//   const expectedSignature = crypto
//     .createHmac('sha256', razorpay.key_secret)
//     .update(body.toString())
//     .digest('hex');

//   if (expectedSignature === razorpay_signature) {
//     res.status(200).json({ status: 'ok' });
//   } else {
//     res.status(400).json({ status: 'verification_failed' });
//   }
// });


app.post("/userlogin", async (req, res) => {
    const { mail, password } = req.body;

    try {
        const user = await userModel.findOne({ mail });

        if (user) {
            if (user.password === password) {
                res.json("exist");
            } else {
                res.json("notexist");
            }
        } else {
            res.json("notexist");
        }
    } catch (e) {
        res.json("fail");
    }
});

app.post("/adminlogin", async (req, res) => {
    const { mail, password } = req.body;

    try {

        if (true) {
            if ( mail === 'shiva@gmail.com' && password === 'shiva') {
                res.json("exist");
            } else {
                res.json("notexist");
            }
        } else {
            res.json("notexist");
        }
    } catch (e) {
        res.json("fail");
    }
});

app.post("/farmerlogin", async (req, res) => {
    const { mail, password } = req.body;

    try {
        const user = await farmerModel.findOne({ mail });

        if (user) {
            if (user.password === password) {
                res.json("exist");
            } else {
                res.json("notexist");
            }
        } else {
            res.json("notexist");
        }
    } catch (e) {
        res.json("fail");
    }
});

app.post("/usersignup", async (req, res) => {
    const { name, mail, password } = req.body;

    const data = {
        name,
        mail,
        password,
        orders: []
    };

    try {
        const check = await userModel.findOne({ mail });

        if (check) {
            res.json("exist");
        } else {
            await userModel.create(data);
            res.json("inserted");
        }
    } catch (e) {
        res.json("fail");
    }
});

app.post("/farmersignup", async (req, res) => {
    const { name, mail, password } = req.body;

    const data = {
        name,
        mail,
        password,
        products: []
    };

    try {
        const check = await farmerModel.findOne({ mail });

        if (check) {
            res.json("exist");
        } else {
            await farmerModel.create(data);
            res.json("inserted");
        }
    } catch (e) {
        res.json("fail");
    }
});



app.get('/api/products', async (req, res) => {
    const farmers = await farmerModel.find();
    const products = farmers.map(farmer => farmer.products).flat();
    res.json(products);
});

// Fetch farmer's products
app.get('/api/farmer/products', async (req, res) => {
    const farmer = await farmerModel.findOne({ mail: req.query.mail });
    res.json(farmer.products);
});

// Add a new product (Farmer's action)
app.post('/api/farmer/products', async (req, res) => {
    const farmer = await farmerModel.findOne({ mail: req.body.mail });
    const rate=10;
    const newProduct = {
        title: req.body.title,
        description: req.body.description,
        cost: req.body.cost,
        image: req.body.image,
        rating: rate
    };
    farmer.products.push(newProduct);
    await farmer.save();
    res.json(newProduct);
});

// Remove a product (Farmer's action)
app.delete('/api/farmer/removeproducts', async (req, res) => {
    const { mail, id } = req.body;

    try {
        const response = await farmerModel.updateOne(
            { mail }, 
            { $pull: { products: { _id: new mongoose.Types.ObjectId(id) } } }
        );

        if (response.modifiedCount > 0) {
            res.status(204).send(); // Success, no content
        } else {
            return res.json("notdeleted"); // Product not found in the array
        }
    } catch (e) {
        console.error('Error occurred during product deletion:', e);
        return res.status(500).json({ status: 'fail', message: 'An error occurred' });
    }
});

app.delete('/api/adminremove', async (req, res) => {
    const { id } = req.body;

    try {
        // Find the farmer who owns this product
        const farmer = await farmerModel.findOne({ "products._id": id });

        if (!farmer) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Remove the product from the farmer's products array
        const response = await farmerModel.updateOne(
            { _id: farmer._id }, 
            { $pull: { products: { _id: new mongoose.Types.ObjectId(id) } } }
        );

        if (response.modifiedCount > 0) {
            return res.status(204).send(); // Success, no content
        } else {
            return res.json("notdeleted"); // If for some reason the deletion failed
        }
    } catch (e) {
        console.error('Error occurred during product deletion:', e);
        return res.status(500).json({ status: 'fail', message: 'An error occurred' });
    }
});


// Purchase a product (User's action)
app.post('/api/orders', async (req, res) => {
    const user = await userModel.findOne({ mail: req.body.mail });
    const newOrder = {
        title: req.body.title,
        description: req.body.description,
        cost: req.body.cost,
        image: req.body.image
    };
    user.orders.push(newOrder);
    await user.save();
    res.json(newOrder);
});

app.post('/api/review', async (req, res) => { 
    const { productid, review } = req.body;
    try {
        const farmer = await farmerModel.findOne({ "products._id": productid });

        if (!farmer) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Extract the specific product from the array
        const productIndex = farmer.products.findIndex(p => p._id.toString() === productid);

        if (productIndex === -1) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Perform sentiment analysis
        const sentimentResult = sentiment.analyze(review);
        const sentimentScore = sentimentResult.score;
        console.log(sentimentScore);

        // Convert sentiment score to a rating scale (1 to 10)
        let newReviewRating;
        if (sentimentScore > 2) {
            newReviewRating = 10;
        } else if (sentimentScore > 1) {
            newReviewRating = 8;
        } else if (sentimentScore > 0) {
            newReviewRating = 7;
        } else if (sentimentScore === 0) {
            newReviewRating = 5;
        } else {
            newReviewRating = 3;
        }

        // Update rating by averaging the new rating with the existing one
        const currentRating = farmer.products[productIndex].rating || 0;
        farmer.products[productIndex].rating = ((currentRating + newReviewRating) / 2).toFixed(1);

        await farmer.save();

        res.json({ message: "Rating updated", newRating: farmer.products[productIndex].rating });
    } catch (error) {
        console.error("Error updating rating:", error);
        res.status(500).json({ message: "Error updating rating" });
    }
});


// app.post('/api/review', async (req, res) => {
//     const { productid, review } = req.body;
//     try {
//         const farmer = await farmerModel.findOne({ "products._id": productid });

//         if (!farmer) {
//             return res.status(404).json({ message: "Product not found" });
//         }

//         // Extract the specific product from the array
//         const product = farmer.products.find(p => p._id.toString() === productid);

//         console.log(product);
//                if (!product) {
//                     return res.status(404).json({ message: "Product not found" });
//                 }

//         // Perform sentiment analysis
//         const sentimentResult = sentiment.analyze(review);
//         const sentimentScore = sentimentResult.score;
//         console.log(sentimentScore);

//         // Convert sentiment score to a rating scale (1 to 5)
//         let newReviewRating;
//         if (sentimentScore > 2) {
//             newReviewRating = 10;
//         } else if (sentimentScore > 1) {
//             newReviewRating = 8;
//         } else if (sentimentScore > 0) {
//             newReviewRating = 7;
//         } else if (sentimentScore === 0) {
//             newReviewRating = 5;
//         } else {
//             newReviewRating = 3;
//         }
//         console.log(product);
//         // Update rating by averaging the new rating with the existing one
//         product.rating = product.rating ? ((product.rating + newReviewRating) / 2).toFixed(1) : newReviewRating;

//         await product.save();

//         res.json({ message: "Rating updated", newRating: product.rating });
//     } catch (error) {
//         console.error("Error updating rating:", error);
//         res.status(500).json({ message: "Error updating rating" });
//     }
// });


// app.post('/api/review', async (req, res) => {
//     const { productid, review } = req.body;

//     try {
//         // Perform sentiment analysis
//         const sentimentResult = sentiment.analyze(review);
//         let newRating = sentimentResult.score; // Sentiment score

//         // Find the farmer containing the product
//         const farmer = await farmerModel.findOne({ "products._id": productid });

//         if (!farmer) {
//             return res.status(404).json({ message: "Product not found" });
//         }

//         // Find the product within the farmer's products
//         const product = farmer.products.id(id);

//         // Compute new rating as an average
//         product.rating = ((product.rating + newRating) / 2).toFixed(1);

//         // Save changes to the database
//         await farmer.save();

//         res.json({ message: "Rating updated successfully", newRating: product.rating });
//     } catch (error) {
//         console.error("Error updating rating:", error);
//         res.status(500).json({ message: "An error occurred" });
//     }
// });


app.listen(process.env.PORT || 3000, () => {
    console.log("App is running on port 3000");
});

// AIzaSyCf7mqFvpq-ZqcPaG60EJJZgIoMqO4P0vw