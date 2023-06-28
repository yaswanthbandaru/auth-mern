require("dotenv").config();
require("./config/database");
const express = require('express');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const User = require("./model/user");
const auth = require("./middleware/auth");

const app = express();
const port = process.env.PORT || 3000;

// app.use(bodyParser);
app.use(bodyParser.json());

app.post('/register', async (req, res) => {
    try{
        const { firstname, lastname, email, password } = req.body;

        if(!(email && password && firstname && lastname)) {
            res.status(400).send("All input is required");
        }

        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        // encrypt user password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // Create user in our database
        const user = await User.create({
            firstname,
            lastname,
            email: email.toLowerCase(), // sanitize: convert email to lowercase
            password: encryptedPassword,
        });

        // Create token
        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h",
            }
        );

        // save the created token into the user model
        user.token = token;
        
        // return new user
        res.status(201).send(user);
    } catch (err) {
        console.log(err);
    }
});

app.post('/login', async (req, res) => {
    try {
        // Get user input
        const { email, password } = req.body;

        // Validate user input
        if(!(email && password)) {
            res.status(400).send("All input is required");
        }
        // Validate if user exits in out database
        const user = await User.findOne({ email });

        if(user && (await bcrypt.compare(password, user.password))) {
            // Crete token
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h",
                }
            );

            // save user token;
            user.token = token;

            // user
            res.status(200).json(user);
        }
        res.status(400).send("Invalid Credentials");
    } catch (err) {

    }
    res.status(200);
});

app.get('/welcome', (req, res) => {
    res.status(200).send("Welcome 🙌 ");
});

// app.use("*", (req, res) => {
//     res.status(404).json({
//         "success": "false",
//         "message": "Page not found",
//         "error": {
//             "statusCode": 404,
//             "message": "Yous reached a route that is not defined on this server",
//         },
//     });
// });

app.listen(port, (req, res) => {
    console.log(`Server listening at port ${port}`)
})