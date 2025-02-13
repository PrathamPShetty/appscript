const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
//app.use(cors());
app.use(express.json());





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

//   app.get("/editData", async (req, res) => {
//     const { action, sheet_name, oldData, newData } = req.query;

//     if (action !== "update") {
//       return res.status(400).json({ success: false, message: "Invalid action" });
//     }

//     // Parse oldData and newData from JSON strings
//     let oldDataParsed, newDataParsed;
//     try {
//       oldDataParsed = JSON.parse(oldData);
//       newDataParsed = JSON.parse(newData);
//     } catch (error) {
//       return res.status(400).json({ success: false, message: "Invalid JSON format for oldData or newData" });
//     }

//     console.log("before Modified oldData:", oldDataParsed);
//     // Add or modify properties before sending
//     oldDataParsed["Resident Full Name Background"] = oldDataParsed["Background"];
//     delete oldDataParsed["Background"];

//     console.log("Modified oldData:", oldDataParsed);

//     try {
//       console.log("Updating sheet:", sheet_name);

//       // Construct API URL with encoded JSON
//       const apiUrl = `https://script.google.com/macros/s/AKfycbwylAWS4nuKA3BeLmLgKzricJ-9kZVCEhQva4qP4l9rXyDVhr0k-TIzMHcZZmLqk0UN/exec?action=update` +
//         `&sheet_name=${encodeURIComponent(sheet_name)}` +
//         `&oldData=${encodeURIComponent(JSON.stringify(oldDataParsed))}` +
//         `&newData=${encodeURIComponent(JSON.stringify(newDataParsed))}`;

//       const response = await axios.get(apiUrl);
//       const data = response.data;

//       if (!data) {
//         console.log("No data found from Google Sheets!");
//         return res.status(404).json({ success: false, message: "No data found from Google Sheets!" });
//       }

      
      
     
//       res.json({ success: true, message: "Row updated successfully!" });

//     } catch (error) {
//       console.error("Error updating data:", error.message);
//       res.status(500).json({ success: false, message: "Error updating data: " + error.message });
//     }
// });


app.get("/get-sheets", async (req, res) => {
  try {
    console.log("Api Fetching data...");
    const sheets = await Sheet.find({}, { _id: 0, __v: 0 });

    res.json(sheets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error: error.message });
  }
});

app.listen(7002, () => console.log("Server running on port 7002"));
