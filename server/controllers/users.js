import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import bcrypt from 'bcrypt';

// TODO: make env var
const SECRET = "test-secret-key";
const SALTROUNDS = 10;

async function signin(req, res) {

}

async function signup(req, res) {
    const { email, password, username } = req.body;

    try {
        // Make sure username and email is unique
        // NOTE: Mongodb does not validate uniqueness
        await User.or([{email}, {username}]).findOne((err, user) => {
            if (err) { throw new Error(err.message); }

            if (user) {
                if (user.username == username) {
                    return res.status(400).send('username already exists');
                } else {
                    return res.status(400).send('user already exists');
                }
            }
        });

        // hash password
        const hashedPass = await bcrypt.hash(password, SALTROUNDS);

        // create a new user in db
        const newUser = await User.create({
            email,
            password: hashedPass,
            username
        });

        const token = jwt.sign({
            email: newUser.email, 
            id: newUser._id,
        }, SECRET, '14 days');

        res.status(201).json({ user: newUser, token });
    } catch ( error ) {
        return res.status(500).send(error.message);
    }

}

export { signup, signin };
