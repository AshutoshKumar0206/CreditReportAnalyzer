const express = require('express');
const cors = require('cors');
const app = express();
const connectDB = require('./config/mongoDB');
const creditReportRoutes = require('./routes/creditReportRoutes');

require('dotenv').config();
const PORT = process.env.PORT || 4000 

//Mongo DB connection
connectDB();

app.use(express.static('public'));

const allowedOrigins = ['https://credit-report-analyzer-phi.vercel.app', 'http://localhost:3000']
app.use((req, res, next) =>{
    const origin = req.headers.origin;
    if(allowedOrigins.includes(origin)){
        res.setHeader('Access-Control-Allow-Origin', origin);
    }   
    res.header(
        'Access-Control-Allow-Methods', 
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    next(); 
})
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // allow all domains
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/reports', creditReportRoutes);
app.listen(PORT, () => {
  console.log(`Server running on PORT : ${PORT}`);
});
