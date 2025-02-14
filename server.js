const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const { v4: uuidv4 } = require('uuid');



const app = express();
app.use(cors());
app.use(express.json());





mongoose.connect("mongodb+srv://Pratham99sai:Pratham99sai@pratham.cwnip.mongodb.net/sheet1?retryWrites=true&w=majority&appName=Pratham", {
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
      const apiUrl = "https://script.google.com/macros/s/AKfycbwylAWS4nuKA3BeLmLgKzricJ-9kZVCEhQva4qP4l9rXyDVhr0k-TIzMHcZZmLqk0UN/exec"; //takes 59.06 sec
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
  


  // app.get("/fetchData", async (req, res) => {
  //   try {
  //       console.log("Api Fetching data...");
  //       const apiUrl = "https://script.google.com/macros/s/AKfycbwylAWS4nuKA3BeLmLgKzricJ-9kZVCEhQva4qP4l9rXyDVhr0k-TIzMHcZZmLqk0UN/exec"; 
  //       const response = await axios.get(apiUrl);
  //       const data = response.data;
  //       if (!data || data.length === 0) {
  //         console.log("No data found!");
  //         return;
  //       }
  //       await Sheet.deleteMany({}); // Clear old data
  //       await Sheet.insertMany(data.map(item => ({ sheet_name: item.sheet_name, sheet_data: item.sheet_data })));
    
  //       console.log("Data successfully stored in MongoDB!");

  //       const sheets = await Sheet.find({}, { _id: 0, __v: 0 });

  //       res.json(sheets);
  //     } catch (error) {
  //       console.error("Error fetching/storing data:", error.message);
  //     }
  // }); 




app.get("/get-sheets", async (req, res) => {
  try {
    console.log("Api Fetching data...");
    const sheets = await Sheet.find({}, { _id: 0, __v: 0 });
    console.log("data loading");
    res.json(sheets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error: error.message });
  }
});



app.post("/addData", async (req, res) => { 
  try {
    const { sheet_name, data } = req.body;

    if (!sheet_name || !data) { 
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Generate unique ID if not provided
    if (!data.id) {
      data.id = uuidv4();
    }

    // Update only if the ID doesn't exist in the array
    const result = await Sheet.updateOne(
      { sheet_name: sheet_name },
      { $push: { sheet_data: data } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Sheet not found" });
    }

    res.status(200).json({ success: true, message: "New data added successfully", id: data.id });

  } catch (error) {
    console.error("Error adding data:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});



app.post("/addnewSheetName", async (req, res) => {
  try {
    const { sheet_name } = req.body;

    // Validate Input
    if (!sheet_name) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Check if Sheet Already Exists
    const find = await Sheet.find({ sheet_name: sheet_name });
    if (find.length > 0) {
      return res.status(409).json({ success: false, message: "Sheet already present" });
    }

    // Insert New Sheet
    const newSheet = await Sheet.create({
      sheet_name: sheet_name,
    });

    if (!newSheet) {
      return res.status(500).json({ success: false, message: "Failed to add new sheet" });
    }

    // Success Response
    res.status(201).json({ success: true, message: "New sheet added successfully", data: newSheet });

  } catch (error) {
    console.error("Error adding data:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


app.post("/updateSheetItem", async (req, res) => {
  try {
    const { sheet_name, item_id, updateData } = req.body;

    if (!sheet_name || !item_id || !updateData) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const result = await Sheet.updateOne(
      { sheet_name: sheet_name, "sheet_data.id": item_id },
      { $set: { "sheet_data.$": updateData } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Sheet or item not found" });
    }

    res.status(200).json({ success: true, message: "Item updated successfully" });

  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});




app.post("/updateName", async (req, res) => {
  try {
    const { sheet_name, oldName, newName } = req.body;

    if (!sheet_name || !oldName || !newName) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Find and update the record within the sheet data
    const result = await Sheet.updateOne(
      { 
        sheet_name: sheet_name, 
        "sheet_data.name": oldName 
      },
      { 
        $set: { "sheet_data.$.name": newName } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Name not found in the sheet" });
    }

    res.status(200).json({ success: true, message: "Name updated successfully" });

  } catch (error) {
    console.error("Error updating name:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});



app.listen(7002, () => console.log("Server running on port 7002"));
