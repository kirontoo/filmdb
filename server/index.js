import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';

// Import routes
import movieRoutes from './routes/movies.js';
import userRoutes from './routes/users.js';

const app = express();

const PORT = process.env.PORT || 5000;

// @param limit: limit the file size, good for when you send in images
app.use(bodyParser.json({limit: "28mb", extended: true}));
app.use(bodyParser.urlencoded({limit: "30mb", extended: true}));
app.use(cors());

app.use('/api/movies', movieRoutes);
app.use('/api/auth', userRoutes);

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
