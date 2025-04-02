const mongoose = require("mongoose");
const { msgCodes } = require("../constants/msgCodes");

const eventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: [true, msgCodes.TASK_VALIDATION_REQUIRE_USER],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      // required: [true, msgCodes.EVENT_VALIDATION_REQUIRE_CATEGORY],
    },
    name: {
      type: String,
      required: [true, msgCodes.EVENT_VALIDATION_REQUIRE_NAME],
    },
    description: {
      type: String,
    },
    Date: {
      type: Date,
      cast: msgCodes.VALIDATION_DATE_PARSE,
      // might also validate for past dates, but who says events cannot be logged retroactively?
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
