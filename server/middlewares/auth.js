import jwt from 'jsonwebtoken';

// TODO: Make env var
const SECRET = "test-secret-key";

async function authenticate(req, res, next) {
    let data;
    try {
        const token = req.headers.authorization.split(" ")[1];
        if (token) {
            data = jwt.verify(token, SECRET);
            req.userId = data?.id;
        }

        next();
    } catch ( error ) {
        console.error(`AUTH ERROR: ${error.message}`);
    }
}

export default authenticate;
