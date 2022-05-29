import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

const PORT = process.env.PORT || 5000;

// @param limit: limit the file size, good for when you send in images
app.use(bodyParser.json({limit: "28mb", extended: true}));
app.use(bodyParser.urlencoded({limit: "30mb", extended: true}));
app.use(cors());

mongoose.connect(process.env.CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port: ${PORT}`)
    })
}).catch((err) => {
    console.error(err.message);
});
