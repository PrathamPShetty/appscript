const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const { v4: uuidv4 } = require('uuid');



const app = express();
app.use(express.json());

app.use(cors());

// app.use(cors({ origin: "https://register.mcceducare.com", credentials: true }));






mongoose.connect("mongodb+srv://pratham:fCjtZdGU9qgRefZw@cluster0.zuygi.mongodb.net/bdrctool?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 100000, // 10 seconds
  serverSelectionTimeoutMS: 100000,
  socketTimeoutMS: 20000,
});


const db = mongoose.connection;
db.once("open", () => console.log("Connected to MongoDB"));

// Define Schema & Model
const sheetSchema = new mongoose.Schema({
    sheet_name: { type: String, required: true },
    sheet_data: { type: Array, default: [] },
});

const Sheet = mongoose.model("Sheet", sheetSchema);


// async function fetchAndStoreData() {
//   try {
//     console.log("Fetching data...");

//     // API URL
//     const apiUrl = "https://script.google.com/macros/s/AKfycbwxLKMDCJXXCK5wS2JnoQY7K4rKBjlfZZQS_p8f-RqWDq2LrrHiYgqhMNf6i8jbomyplA/exec";

//     // Fetch data from the MongoDB collection
//     const data = await Sheet.find({}, { _id: 0, __v: 0 });


//     // console.log("Data fetched from MongoDB:", JSON.stringify(data, null, 2));

//     for (const record of data) {
//       // Convert sheet_data to JSON string before URL encoding
//       const sheetName = encodeURIComponent(record.sheet_name);

//       const sheetData = encodeURIComponent(JSON.stringify(record.sheet_data));
      
//       // console.log("dsfs"+sheetName);
//       // console.log(sheetData);
//       const response = await axios.get(
//         `${apiUrl}?action=update&sheet_name=${sheetName}&newData=${sheetData}&callback=?`,
//         {
//           timeout: 30000  // Set the timeout to 30 seconds
//         }
//       );
      

//       //console.log(`Response for ${record.sheet_name}:`, response);
//     }
//   } catch (error) {
//     console.error("Error fetching/storing data:", error.message);
//     if (error.response) {
//       console.error("API Response:", error.response.data);
//     }
//   }
// }


async function fetchAndStoreData() {
  try {
    console.log("Fetching data...");

    const apiUrl = "https://script.google.com/macros/s/AKfycbwxLKMDCJXXCK5wS2JnoQY7K4rKBjlfZZQS_p8f-RqWDq2LrrHiYgqhMNf6i8jbomyplA/exec";

    // Fetch all data from MongoDB
    const data = await Sheet.find({}, { _id: 0, __v: 0 });

    if (!data || data.length === 0) {
      console.log("No data to sync.");
      return;
    }

    // Split data into chunks
    const chunkSize = 2;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);

      // Prepare the payload
      const records = chunk.map(record => ({
        sheet_name: record.sheet_name,
        sheet_data: record.sheet_data
      }));

      // Send data without encoding
      const response = await axios.post(apiUrl, {
        action: "updateAll",
        sheetData: records  // Send directly as an array
      }, { timeout: 30000 });

      console.log(`Chunk ${i / chunkSize + 1} response:`, response.data);
    }

    console.log("Data successfully sent in batches!");

  } catch (error) {
    console.error("Error during data sync:", error.message);
    if (error.response) {
      console.error("API Response:", error.response.data);
    }
  }
}

// fetchAndStoreData();


// setInterval(fetchAndStoreData, 30000);



  

app.get("/fetchData", async (req, res) => {
  try {
    console.log("API Fetching data...");
    db.once("open", () => console.log("Connected to MongoDB"));

    const apiUrl = "https://script.google.com/macros/s/AKfycbwylAWS4nuKA3BeLmLgKzricJ-9kZVCEhQva4qP4l9rXyDVhr0k-TIzMHcZZmLqk0UN/exec"; 
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      console.log("No valid data found!");
      return res.status(400).json({ error: "Invalid or empty data" });
    }

    await Sheet.deleteMany({}); 

    const records = data.map(item => ({
      sheet_name: item.sheet_name,
      sheet_data: item.sheet_data.map(entry => ({
        ...entry,
        id: entry.id || uuidv4()
      }))
    }));

    await Sheet.insertMany(records);

    console.log("Data successfully stored in MongoDB!");

    const sheets = await Sheet.find({}, { _id: 0, __v: 0 });
    res.json(sheets);

  } catch (error) {
    console.error("Error fetching/storing data:", error.message);
    res.status(500).json({ error: error.message });
  }
});



  // app.post("/fetchData", async (req, res) => {
  //   try {
  //     const { data } = req.body;
  
  //     if (!data || data.length === 0) {
  //       console.log("No data provided!");
  //       return res.status(400).json({ success: false, message: "No data provided" });
  //     }
  
  //     // Clear existing collection and insert new data
  //     await Sheet.deleteMany({});
  //     await Sheet.insertMany(
  //       data.map(item => ({
  //         sheet_name: item.sheet_name,
  //         sheet_data: item.sheet_data
  //       }))
  //     );
  
  //     console.log("Data successfully stored in MongoDB!");
  
  //     // Retrieve and return the inserted sheets (excluding _id and __v)
  //     const sheets = await Sheet.find({}, { _id: 0, __v: 0 });
  
  //     res.status(201).json({ success: true, data: sheets });
  //   } catch (error) {
  //     console.error("Error fetching/storing data:", error.message);
  //     res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  //   }
  // });
  


  app.get("/get-sheet", async (req, res) => {
    try {
      console.log("API Fetching the first 5 records sorted alphabetically (excluding names starting with 'D')...");
      db.once("open", () => console.log("Connected to MongoDB"));
  
      const sheets = await Sheet.find({}, { _id: 0, __v: 0 });
      
  
      console.log("Data loaded successfully");
      res.json(sheets);
  
    } catch (error) {
      console.error("Error fetching data:", error.message);
      res.status(500).json({ message: "Error fetching data", error: error.message });
    }
  });
  
  

app.get("/get-sheets", async (req, res) => {
  try {
    console.log("Api Fetching data...");
    db.once("open", () => console.log("Connected to MongoDB"));
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
    db.once("open", () => console.log("Connected to MongoDB"));

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

    console.log(sheet_name);

    // Check if Sheet Already Exists
    const find = await Sheet.find({ sheet_name: sheet_name });

    
    if (find.length > 0) {
      return res.status(409).json({ success: false, message: "Sheet already present" });
    }



  

    const newSheet = await Sheet.create({
      sheet_name: sheet_name
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



app.post("/editData", async (req, res) => {
  try {
    const { sheet_name, newData } = req.body;

    // Validate inputs
    if (!sheet_name || !newData.id) {
      return res.status(400).json({ success: false, message: "Missing required fields: sheet_name or id" });
    }

    newData['Resident Full Name Background']= newData['Background'];

    // Prepare the update object dynamically
    let updateFields = {};
    for (const [key, value] of Object.entries(newData)) {
      if (key !== "id") {
        updateFields[`sheet_data.$.${key}`] = value;
      }
    }

    

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    // Perform the update
    const result = await Sheet.updateOne(
      { sheet_name: sheet_name, "sheet_data.id": newData.id },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "ID not found in the sheet" });
    }

    res.status(200).json({ success: true, message: "Row updated successfully" });

  } catch (error) {
    console.error("Error updating row:", error);
    res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
  }
});


app.post("/deleteData", async (req, res) => {
  try {
    const { sheet_name, rowData, dischargeDate } = req.body;

    console.log("Incoming Delete Request:", req.body); // Debugging

    if (!sheet_name || !rowData.id) {
      return res.status(400).json({ success: false, message: "Missing required fields: sheet_name or id" });
    }

    // Check if the row exists before attempting deletion
    const existingSheet = await Sheet.findOne({
      sheet_name: sheet_name,
      "sheet_data.id": rowData.id
    });

    if (!existingSheet) {
      return res.status(404).json({ success: false, message: "Row not found" });
    }

    // Extract the data to be transferred
    const deletedRow = existingSheet.sheet_data.find((row) => row.id === rowData.id);

    // Perform the deletion
    const result = await Sheet.updateOne(
      { sheet_name: sheet_name },
      { $pull: { sheet_data: { id: rowData.id } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Row not found or already deleted" });
    }
    

    deletedRow["Discharge Date"] = dischargeDate;
    // Prepare discharge sheet name
    const dischargeSheetName = `Discharge_${sheet_name}`;

    // Check if discharge sheet exists, if not create it
    const dischargeSheet = await Sheet.findOne({ sheet_name: dischargeSheetName });
    if (!dischargeSheet) {
      await Sheet.create({ sheet_name: dischargeSheetName, sheet_data: [deletedRow] });
    } else {
      // Add the deleted row to the discharge sheet
      await Sheet.updateOne(
        { sheet_name: dischargeSheetName },
        { $push: { sheet_data: deletedRow } }
      );
    }

    res.status(200).json({ success: true, message: "Row deleted and moved to discharge sheet successfully" });

  } catch (error) {
    console.error("Error deleting row:", error);
    res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
  }
});


app.post("/readmitData", async (req, res) => {
  try {
    const { sheet_name, rowData } = req.body;

    if (!sheet_name || !rowData?.id) {
      return res.status(400).json({ success: false, message: "Missing required fields: sheet_name or rowData.id" });
    }

    const dischargeSheetName = sheet_name;

    // Find the discharged row
    const dischargeSheet = await Sheet.findOne({ sheet_name: dischargeSheetName });
    if (!dischargeSheet) {
      return res.status(404).json({ success: false, message: "Discharge sheet not found" });
    }

    const dischargedRow = dischargeSheet.sheet_data.find(row => row.id === rowData.id);
    if (!dischargedRow) {
      return res.status(404).json({ success: false, message: "Patient not found in discharge sheet" });
    }

    // Remove the row from the discharge sheet
    const removeResult = await Sheet.updateOne(
      { sheet_name: dischargeSheetName },
      { $pull: { sheet_data: { id: rowData.id } } }
    );

    if (removeResult.modifiedCount === 0) {
      return res.status(500).json({ success: false, message: "Failed to remove patient from discharge sheet" });
    }

    // Remove the 'Discharge Date' field before re-admitting
    delete dischargedRow['Discharge Date'];

    // Get the original sheet name
    const originalSheetName = dischargeSheetName.replace("Discharge_", "");

    // Add the row back to the original sheet
    const addResult = await Sheet.updateOne(
      { sheet_name: originalSheetName },
      { $push: { sheet_data: dischargedRow } }
    );

    if (addResult.modifiedCount === 0) {
      return res.status(500).json({ success: false, message: "Failed to add patient back to the original sheet" });
    }

    res.status(200).json({ success: true, message: "Patient readmitted successfully" });

  } catch (error) {
    console.error("Error readmitting patient:", error);
    res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
  }
});




app.listen(7002, () => console.log("Server running on port 7002"));
