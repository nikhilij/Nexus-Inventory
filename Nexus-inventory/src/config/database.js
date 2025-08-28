const {Pool} = require('pg');

// pool will use the env variables to connect 
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});


module.exports = {
    query: (text,params) =>{
        return pool.query(text,params);
    }
}
