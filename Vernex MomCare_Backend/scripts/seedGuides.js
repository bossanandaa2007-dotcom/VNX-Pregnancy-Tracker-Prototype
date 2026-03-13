require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Guide = require("../models/Guide");
const guides = require("../data/guideDataset");

const seed = async () => {

  await connectDB();

  await Guide.deleteMany();

  await Guide.insertMany(guides);

  console.log("Guide dataset inserted");

  process.exit();

};

seed();