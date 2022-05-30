import Movie from '../models/movie.js';

const getMovies = async ( req, res) => {
    try {
        const movies = await Movie.find();
        res.send(movies);
    } catch(err) {
        console.log(`GET Movies: ${err.message}`);
        res.status(404).json({message: err.message});
    }
}

const createMovie = async (req, res) => {
    const movie = req.body;
    const newMovie = new Movie(movie);

    try {
        await newMovie.save();
        res.status(201).save();
    } catch(err) {
        console.log(`POST Movie: ${err.message}`);
        res.status(409).json({message: err.message});
    }
}

export {
    getMovies,
    createMovie
};
