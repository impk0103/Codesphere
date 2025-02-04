const mongoose = require('mongoose');
require('dotenv').config();

exports.connect= () =>{
     mongoose.connect(process.env.MONGODB_URL)
     .then(()=>{console.log("Database connected successfully")})
     .catch((error)=>{ console.log("Error encountered while connecting to database");
                        console.log(error);
                        process.exit(1);
     })
}