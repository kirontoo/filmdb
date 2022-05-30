import mongoose from 'mongoose';


const schema = mongoose.Schema({
    "title": String,
    "year": Number,
    "rated": String,
    "released": String,
    "runtime": String,
    "genre": String,
    "director": String,
    "writer": [String],
    "actors": [String],
    "plot": String,
    "language": String,
    "country": [String],
    "poster": String,
    "rating": {
        type: Number,
        default: 0
    },
    "metascore": Number,
    "imdbRating": Number,
    "imdbVotes": Number,
    "imdbID": String,
    "type": String,
});

const Movie = mongoose.model(
    'Movie',
    schema
)

export default Movie;
