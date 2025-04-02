const mongoose = require("mongoose");
const { msgCodes } = require("../constants/msgCodes");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, msgCodes.CATEGORY_VALIDATION_REQUIRE_NAME],
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
