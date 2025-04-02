const BasicCRUDController = require("./basicCRUDController");
const Model = require("../models/eventModel");

class EventController extends BasicCRUDController {
  constructor() {
    super(Model);
  }
}

module.exports = EventController;
