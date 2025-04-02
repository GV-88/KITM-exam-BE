const BasicCRUDController = require("./basicCRUDController");
const Model = require("../models/eventModel");

class EventController extends BasicCRUDController {
  constructor() {
    super(Model);
  }

  //override generic method
  // async createItem(req, res) {
  //   try {
  //     let inputData = this.constructor.mapInputForCreate(req.body);
  //     //TODO: add current user id to inputData
  //     const item = await this.model.create(inputData);
  //     sendJsonWithToken(res.status(201), {
  //       [this.fieldNames.singular]: this.constructor.mapOutput(item),
  //     });
  //     return;
  //   } catch (error) {
  //     sendJsonWithError(res, error);
  //   }
  // }
}

module.exports = EventController;
