const mongoose = require("mongoose");

const GuideSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  content: {
    type: String,
    required: true
  },

  icon: {
    type: String
  },

  category: {
  type: String,
  enum: ["diet", "exercise", "wellness", "dos", "donts"],
  required: true
},

  weekStart: {
    type: Number,
    required: true
  },

  weekEnd: {
    type: Number,
    required: true
  },

 trimester: {
  type: String,
  enum: ["first", "second", "third", "all"]
},

  source: {
    type: String,
    enum: ["WHO", "MOHFW"],
    required: true
  },

  referenceLink: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Guide", GuideSchema);
