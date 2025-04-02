const { sendJsonWithToken, sendJsonWithError } = require("../utils/utils");

class BasicCRUDController {
	constructor(model) {
		this.model = model;

		const lowerCaseName = model.modelName.slice(0, 1).toLowerCase() + model.modelName.slice(1);

		this.fieldNames = { singular: lowerCaseName, plural: lowerCaseName + "s" };
		this.msgCodeIdNotFound = `${model.modelName.toUpperCase()}_ID_NOT_FOUND`;
		this.msgTextIdNotFound = `${model.modelName} ID not found`;
		this.msgCodeRequireId = `${model.modelName.toUpperCase()}_REQUIRE_ID`;
		this.msgTextRequireId = `${model.modelName} ID not found`;
		this.baseFieldsExclude = new Set(["__v", "createdAt", "updatedAt"]);
	}

	static mapOutput(item) {
		return item;
	}

	static mapInputForCreate(reqBody) {
		return reqBody;
	}

	static mapInputForUpdate(reqBody) {
		return reqBody;
	}

	requireId(req, res, next) {
		const id = req.params["id"] ?? req.query["id"];
		if (!id) {
			res.status(400).json({ msgCode: this.msgCodeRequireId, message: this.msgTextRequireId });
			return;
		}
		req.params["id"] = id;
		next();
	}

	makeQuery(baseQuery, includeFields) {
		//console.log("makeQuery base");
		const fieldsToExclude = this.baseFieldsExclude;
		//TODO: validate includeFields by schema
		includeFields.forEach((field) => {
			fieldsToExclude.delete(field);
		});
		return baseQuery.select(
			Array.from(fieldsToExclude)
				.map((field) => `-${field}`)
				.join(" ")
		);
	}

	async getItems(req, res) {
		// returns all items if id parameter is not supplied
		try {
			const requestedId = req.params["id"] ?? req.query["id"];
			const includeFields = req.query["fields"] ? req.query["fields"].split(",") : [];

			let items = [];
			let query = this.makeQuery(this.model.find(), includeFields);

			if (requestedId) {
				query = query.where("_id", requestedId);
			}

			//console.log("populated paths:");
			//console.log(query.getPopulatedPaths());

			items = await query;

			if (requestedId && (!items?.length || items[0] === null)) {
				// is this status code really accurate? (it might seem so if requesting id in url path)
				res.status(404).json({ msgCode: this.msgCodeIdNotFound, message: this.msgTextIdNotFound });
				return;
			}

			items = items ? items.map((item) => this.constructor.mapOutput(item)) : [];
			const responseBody = requestedId ? { [this.fieldNames.singular]: items[0] } : { [this.fieldNames.plural]: items };
			sendJsonWithToken(res.status(200), responseBody);
			return;
		} catch (error) {
			sendJsonWithError(res, error);
		}
	}

	async createItem(req, res) {
		try {
			const item = await this.model.create(this.constructor.mapInputForCreate(req.body));
			sendJsonWithToken(res.status(201), { [this.fieldNames.singular]: this.constructor.mapOutput(item) });
			return;
		} catch (error) {
			sendJsonWithError(res, error);
		}
	}

	async updateItem(req, res) {
		// accessible only with admin token; requires id parameter
		try {
			const update = this.constructor.mapInputForUpdate(req.body);
			//!!! findByIdAndUpdate does not trigger "save" middleware, so use it carefully!!!
			// https://mongoosejs.com/docs/middleware.html#notes
			const item = await this.model.findByIdAndUpdate(req.params["id"], update, { new: true, runValidators: true });
			if (item === null) {
				res.status(404).json({ msgCode: this.msgCodeIdNotFound, message: this.msgTextIdNotFound });
				return;
			}

			sendJsonWithToken(res.status(200), { [this.fieldNames.singular]: this.constructor.mapOutput(item) });
			return;
		} catch (error) {
			sendJsonWithError(res, error);
		}
	}

	async deleteItem(req, res) {
		// accessible only with admin token; requires id parameter
		try {
			const item = await this.model.findByIdAndDelete(req.params["id"]);
			if (item === null) {
				res.status(404).json({ msgCode: this.msgCodeIdNotFound, message: this.msgTextIdNotFound });
				return;
			}

			sendJsonWithToken(res.status(200), { [this.fieldNames.singular]: this.constructor.mapOutput(item) });
			return;
		} catch (error) {
			sendJsonWithError(res, error);
		}
	}
}

module.exports = BasicCRUDController;
