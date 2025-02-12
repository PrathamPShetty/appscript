const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});




mongoose.connect("mongodb+srv://Pratham99sai:Pratham99sai@pratham.cwnip.mongodb.net/sheet?retryWrites=true&w=majority&appName=Pratham", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once("open", () => console.log("Connected to MongoDB"));

// Define Schema & Model
const sheetSchema = new mongoose.Schema({
    sheet_name: { type: String, required: true },
    sheet_data: { type: Array, default: [] },
});

const Sheet = mongoose.model("Sheet", sheetSchema);

async function fetchAndStoreData() {
    try {
      console.log("Fetching data...");
      const apiUrl = "https://script.google.com/macros/s/AKfycbwylAWS4nuKA3BeLmLgKzricJ-9kZVCEhQva4qP4l9rXyDVhr0k-TIzMHcZZmLqk0UN/exec"; 
      const response = await axios.get(apiUrl);
      const data = response.data;

      


  
      if (!data || data.length === 0) {
        console.log("No data found!");
        return;
      }
  
      await Sheet.deleteMany({}); // Clear old data
      await Sheet.insertMany(data.map(item => ({ sheet_name: item.sheet_name, sheet_data: item.sheet_data })));
  
      console.log("Data successfully stored in MongoDB!");
    } catch (error) {
      console.error("Error fetching/storing data:", error.message);
    }
  }
  
  // Call Function Every 5 Seconds (5000ms)
  setInterval(fetchAndStoreData, 20000);
  
  // API Endpoint to Manually Fetch and Store Data
  app.get("/fetchData", async (req, res) => {
    try {
        console.log("Api Fetching data...");
        const apiUrl = "https://script.google.com/macros/s/AKfycbwylAWS4nuKA3BeLmLgKzricJ-9kZVCEhQva4qP4l9rXyDVhr0k-TIzMHcZZmLqk0UN/exec"; 
        const response = await axios.get(apiUrl);
        const data = response.data;
  
        
  
  
    
        if (!data || data.length === 0) {
          console.log("No data found!");
          return;
        }
    
        await Sheet.deleteMany({}); // Clear old data
        await Sheet.insertMany(data.map(item => ({ sheet_name: item.sheet_name, sheet_data: item.sheet_data })));
    
        console.log("Data successfully stored in MongoDB!");

        const sheets = await Sheet.find({}, { _id: 0, __v: 0 });

        res.json(sheets);
      } catch (error) {
        console.error("Error fetching/storing data:", error.message);
      }
  }); 

// Fetch Data from MongoDB
app.get('/get-sheets', (req, res) => {
    request('http://register.mcceducare.com/get-sheets', (error, response, body) => {
        if (!error && response.statusCode === 200) {
            res.send(body);
        } else {
            res.status(response.statusCode).send(error);
        }
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));
