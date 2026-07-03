/**
 * medicineController.js
 * @description : exports action methods for medicine.
 */

const Medicine = require('../../../model/medicine');
const medicineSchemaKey = require('../../../utils/validation/medicineValidation');
const validation = require('../../../utils/validateRequest');
const dbService = require('../../../utils/dbService');
const ObjectId = require('mongodb').ObjectId;
const { MEDICAL_STATUS, MEDICAL_TYPES } = require('../../../constants/authConstant')
const utils = require('../../../utils/common');
const Medical_log = require('../../../model/medical_log');
const Stock = require('../../../model/stock');
const COW = require('../../../model/COW');

/**
 * @description : create document of Medicine in mongodb collection.
 * @param {Object} req : request including body for creating document.
 * @param {Object} res : response of created document
 * @return {Object} : created Medicine. {status, message, data}
 */
const addMedicine = async (req, res) => {
  try {
    let dataToCreate = { ...req.body || {} };
    let validateRequest = validation.validateParamsWithJoi(
      dataToCreate,
      medicineSchemaKey.schemaKeys);
    if (!validateRequest.isValid) {
      return res.validationError({ message: `Invalid values in parameters, ${validateRequest.message}` });
    }

    // FOR MEDICAL LOG
    const lastMedicalLogObj = await Medical_log.findOne({ gaushala_id: req.user.gaushala_id }, {}, { sort: { medical_log_id: -1 } }).lean();

    let lastMedicalLogNumber = lastMedicalLogObj ? lastMedicalLogObj.medical_log_id : 0;
    // Increment the last medical_log_id by 1
    lastMedicalLogNumber += 1;

    // Retrieve the last lastMedicalNumber from the database
    const lastMedicalObj = await Medicine.findOne({ gaushala_id: req.user.gaushala_id }, {}, { sort: { medical_id: -1 } }).lean();

    let lastMedicalNumber = lastMedicalObj ? lastMedicalObj.medical_id : 999;

    // Increment the last lastMedicalNumber by 1
    lastMedicalNumber += 1;

    // Convert it back to a string and set the incremented lastMedicalNumber in dataToCreate
    dataToCreate.medical_id = lastMedicalNumber;
    dataToCreate.gaushala_id = req.user.gaushala_id;

    let checkVacAlready = {};

    if (req.body.type == MEDICAL_TYPES.VACCINE) {
      // check cow already give vac.
      checkVacAlready = await Medicine.findOne({
        gaushala_id: req.user.gaushala_id, type: MEDICAL_TYPES.VACCINE,
        vac_name: req.body.vac_name,
        cowId: req.body.cowId,
      });
    }

    if (req.body.type == MEDICAL_TYPES.HEAT) {
      checkVacAlready = await Medicine.findOne({
        gaushala_id: req.user.gaushala_id, type: MEDICAL_TYPES.HEAT,
        cowId: req.body.cowId
      });
    }


    if (checkVacAlready && (req.body.type == MEDICAL_TYPES.VACCINE || req.body.type == MEDICAL_TYPES.HEAT)) {
      return res.alreadyExist({});
    }

    let dataToCreateMedicalLog = {};

    dataToCreateMedicalLog.gaushala_id = dataToCreate.gaushala_id;
    dataToCreateMedicalLog.medical_log_id = lastMedicalLogNumber;
    dataToCreateMedicalLog.medical_id = lastMedicalNumber;
    dataToCreateMedicalLog.item_id = "Medical Initialized";
    dataToCreateMedicalLog.item_name = "Medical Initialized";
    dataToCreateMedicalLog.medical_type = req.body.type;
    dataToCreateMedicalLog.date = dataToCreate.date;
    dataToCreateMedicalLog.remark = "Medical Initialized";

    dataToCreateMedicalLog = new Medical_log(dataToCreateMedicalLog);
    await dbService.create(Medical_log, dataToCreateMedicalLog);

    dataToCreate = new Medicine(dataToCreate);
    let createdMedicine = await dbService.create(Medicine, dataToCreate);
    return res.success({ data: createdMedicine });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// bulk medicine 
const bulkAddMedicine = async (req, res) => {
  try {
    let dataArrayToCreate = req.body || [];
    let createdMedicines = [];

    for (let dataToCreate of dataArrayToCreate) {

      let validateRequest = validation.validateParamsWithJoi(
        dataToCreate,
        medicineSchemaKey.schemaKeys
      );

      if (!validateRequest.isValid) {
        return res.validationError({
          message: `Invalid values in parameters, ${validateRequest.message}`,
        });
      }

      // FOR MEDICAL LOG
      const lastMedicalLogObj = await Medical_log.findOne(
        { gaushala_id: req.user.gaushala_id },
        {},
        { sort: { medical_log_id: -1 } }
      ).lean();

      let lastMedicalLogNumber = lastMedicalLogObj
        ? lastMedicalLogObj.medical_log_id
        : 0;
      // Increment the last medical_log_id by 1
      lastMedicalLogNumber += 1;

      // Retrieve the last lastMedicalNumber from the database
      const lastMedicalObj = await Medicine.findOne(
        { gaushala_id: req.user.gaushala_id },
        {},
        { sort: { medical_id: -1 } }
      ).lean();

      let lastMedicalNumber = lastMedicalObj ? lastMedicalObj.medical_id : 999;

      // Increment the last lastMedicalNumber by the array size
      lastMedicalNumber += 1;

      // Convert it back to a string and set the incremented lastMedicalNumber in dataToCreate
      dataToCreate.medical_id = lastMedicalNumber;
      dataToCreate.gaushala_id = req.user.gaushala_id;

      let checkVacAlready = {};

      if (dataToCreate.type == MEDICAL_TYPES.VACCINE) {
        // check cow already give vac.
        checkVacAlready = await Medicine.findOne({
          gaushala_id: req.user.gaushala_id,
          type: MEDICAL_TYPES.VACCINE,
          vac_name: dataToCreate.vac_name,
          cowId: dataToCreate.cowId,
        });
      }

      if (dataToCreate.type == MEDICAL_TYPES.HEAT) {
        checkVacAlready = await Medicine.findOne({
          gaushala_id: req.user.gaushala_id,
          type: MEDICAL_TYPES.HEAT,
          cowId: dataToCreate.cowId,
        });
      }

      if (
        checkVacAlready &&
        (dataToCreate.type == MEDICAL_TYPES.VACCINE ||
          dataToCreate.type == MEDICAL_TYPES.HEAT)
      ) {
        return res.alreadyExist({});
      }

      let dataToCreateMedicalLog = {};
      let stockData = {
        itemsString: "",
        stockIdString: "",
      };
      if (dataToCreate.medicines.length > 0) {
        stockData = await addStockOnMedicine(dataToCreate.medicines, dataToCreate, false);
      }

      dataToCreateMedicalLog = {
        gaushala_id: dataToCreate.gaushala_id,
        medical_log_id: lastMedicalLogNumber,
        medical_id: lastMedicalNumber,
        item_id: stockData.itemsString,
        stockId: stockData.stockIdString,
        item_name: "Medical Initialized",
        medical_type: dataToCreate.type,
        date: dataToCreate.date,
        remark: dataToCreate.remark
      }

      dataToCreateMedicalLog = new Medical_log(dataToCreateMedicalLog);
      await dbService.create(Medical_log, dataToCreateMedicalLog);

      dataToCreate = new Medicine(dataToCreate);
      let createdMedicine = await dbService.create(Medicine, dataToCreate);
      createdMedicines.push(createdMedicine);
    }

    return res.success({ data: createdMedicines });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : find all documents of Medicine from collection based on query and options.
 * @param {Object} req : request including option and query. {query, options : {page, limit, pagination, populate}, isCountOnly}
 * @param {Object} res : response contains data found from collection.
 * @return {Object} : found Medicine(s). {status, message, data}
 */
const findAllMedicine = async (req, res) => {
  try {
    let options = {};
    let query = {};
    query.gaushala_id = req.user.gaushala_id;

    const pipeline = [
      {
        $match: query
      },
      {
        $lookup: {
          from: 'cows',
          localField: 'cowId',
          foreignField: 'tag_id',
          as: 'cowDetails'
        }
      },
      {
        $unwind: '$cowDetails'
      },
      {
        $match: {
          "cowDetails.gaushala_id": query.gaushala_id
        }
      },
      {
        $addFields: {
          calf_name: '$cowDetails.calf_name'
        }
      },
      {
        $project: {
          cowDetails: 0
        }
      }
    ];

    let foundMedicines = await Medicine.aggregate(pipeline);

    if (!foundMedicines || foundMedicines.length === 0) {
      return res.recordNotFound();
    }

    return res.success({ data: foundMedicines });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : find document of Medicine from table by id;
 * @param {Object} req : request including id in request params.
 * @param {Object} res : response contains document retrieved from table.
 * @return {Object} : found Medicine. {status, message, data}
 */
const getMedicineByCowId = async (req, res) => {
  try {
    let query = {};
    query.gaushala_id = req.user.gaushala_id;
    let options = {};
    query.cowId = req.body.cowId;
    query.gaushala_id = req.user.gaushala_id;

    const pipeline = [
      {
        $match: query
      },
      {
        $lookup: {
          from: "medical_logs",
          localField: "medical_id",
          foreignField: "medical_id",
          as: "medical_log_data"
        }
      },
      {
        $unwind: "$medical_log_data"
      },
      {
        $match: {
          "medical_log_data.gaushala_id": query.gaushala_id
        }
      },
      {
        $group: {
          _id: "$medical_id",
          gaushala_id: { $first: "$gaushala_id" },
          cowId: { $first: "$cowId" },
          vac_name: { $first: "$vac_name" },
          dose: { $first: "$dose" },
          next_dose_time: { $first: "$next_dose_time" },
          date: { $first: "$date" },
          remark: { $first: "$remark" },
          gap_in_day: { $first: "$gap_in_day" },
          status: { $first: "$status" },
          added_by: { $first: "$added_by" },
          type: { $first: "$type" },
          to_date: { $first: "$to_date" },
          heat_attempt: { $first: "$heat_attempt" },
          items: { $last: "$medical_log_data.item_id" },
          last_log_remark: { $last: "$medical_log_data.remark" }
        }
      },
      {
        $project: {
          "gaushala_id": 1,
          "medical_id": 1,
          "cowId": 1,
          "vac_name": 1,
          "dose": 1,
          "next_dose_time": 1,
          "date": 1,
          "remark": 1,
          "gap_in_day": 1,
          "status": 1,
          "added_by": 1,
          "type": 1,
          "to_date": 1,
          "heat_attempt": 1,
          "items": 1,
          "last_log_remark": 1
        }
      }
    ];

    const foundMedicine = await Medicine.aggregate(pipeline);

    if (!foundMedicine || foundMedicine.length === 0) {
      return res.recordNotFound();
    }
    return res.success({ data: foundMedicine });
  }
  catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : update document of Medicine with data by id.
 * @param {Object} req : request including id in request params and data in request body.
 * @param {Object} res : response of updated Medicine.
 * @return {Object} : updated Medicine. {status, message, data}
 */
const medicineUpdate = async (req, res) => {
  try {
    let dataToUpdate = { ...req.body, };

    const errorMedical_ids = [];
    const successMedical_ids = [];

    let query = {};

    query.gaushala_id = req.user.gaushala_id;
    const medical_ids = req.body.medical_ids;


    // STOCK adding process ===================================================================================================================================
    // let itemIds = [];

    // add in stock
    const stockList = dataToUpdate.stockList;

    // const stockListAdd = [];
    // const stockIds = [];

    // if (stockList.length > 0) {
    //   for (let i = 0; i < stockList.length; i++) {
    //     stockListAdd.push({
    //       RFO_no: stockList[i].RFO_no,
    //       gaushala_id: dataToUpdate.gaushala_id,
    //       vendor_id: dataToUpdate.gaushala_id,
    //       bill_no: stockList[i].bill_no,
    //       item_id: stockList[i].item_id,
    //       expence_type: stockList[i].expence_type,
    //       qty: stockList[i].qty,
    //       kg_per_unit: stockList[i].kg_per_unit,
    //       rate_per_unit: stockList[i].rate_per_unit,
    //       totalWtOrQty: stockList[i].totalWtOrQty,
    //       total_amount: stockList[i].total_amount,
    //       entry_by: dataToUpdate.added_by,
    //       remark: dataToUpdate.medical_log_remark,
    //       isStock: stockList[i].isStock,
    //       date: dataToUpdate.medical_log_date,
    //     })

    //     itemIds.push(stockList[i].item_id)

    //   }
    // }

    // if (stockListAdd.length > 0) {
    //   for (let i = 0; i < stockListAdd.length; i++) {

    //     dataToCreateStock = stockListAdd[i];

    //     dataToCreateStock = new Stock(dataToCreateStock);
    //     const stockData = await dbService.create(Stock, dataToCreateStock);
    //     stockIds.push(stockData.id);
    //   }
    // }

    let dataToCreateMedicalLog = {};
    // const itemsString = itemIds.join(',');
    // const stockIdString = stockIds.join(',');

    dataToCreateMedicalLog = {
      gaushala_id: query.gaushala_id,
      item_name: dataToUpdate.item_name,
      medical_type: dataToUpdate.type,
      date: dataToUpdate.medical_log_date,
      remark: dataToUpdate.medical_log_remark
    };

    // STOCK adding process OVER ===========================================================================================

    // Start update proccess 
    for (var medical_id of medical_ids) {
      query.medical_id = medical_id;
      let foundMedicine = await dbService.findOne(Medicine, query);

      const updateMedicineData = {};

      if (!foundMedicine) {
        errorMedical_ids.push(medical_id);
        continue;
      }
      else {

        if (foundMedicine.heat_attempt < foundMedicine.dose) {
          foundMedicine.heat_attempt += 1;
          updateMedicineData.heat_attempt = foundMedicine.heat_attempt;
        }

        if (foundMedicine.heat_attempt == foundMedicine.dose) {
          updateMedicineData.status = MEDICAL_STATUS.Completed;
        }

        if (utils.isBlank(dataToUpdate.next_dose_time)) {
          updateMedicineData.next_dose_time = utils.addDaysToDate(foundMedicine.next_dose_time, foundMedicine.gap_in_day);
        } else {
          updateMedicineData.next_dose_time = dataToUpdate.next_dose_time;
        }

        // update medical here **********************************************************************************************

        let updatedMedicine = await dbService.updateOne(Medicine, query, updateMedicineData);

        if (!updatedMedicine) {
          errorMedical_ids.push(medical_id);
        }

        // find last medical and increment it *************************
        const lastMedicalObj = await Medical_log.findOne({ gaushala_id: req.user.gaushala_id }, {}, { sort: { medical_log_id: -1 } }).lean();

        let lastMedicalLogNumber = lastMedicalObj ? lastMedicalObj.medical_log_id : 0;

        // Increment the last medical_log_id by 1
        const itemIds_stockIds = await addStockOnMedicine(stockList, dataToUpdate, true);



        lastMedicalLogNumber += 1;
        dataToCreateMedicalLog.stockId = itemIds_stockIds.stockIdString;
        dataToCreateMedicalLog.item_id = itemIds_stockIds.itemsString;
        dataToCreateMedicalLog.medical_log_id = lastMedicalLogNumber;
        dataToCreateMedicalLog.medical_id = medical_id;

        // Medical log 
        dataToCreateMedicalLog = new Medical_log(dataToCreateMedicalLog);
        await dbService.create(Medical_log, dataToCreateMedicalLog);
        successMedical_ids.push(medical_id);
      }


    }



    // update medical here
    // let updatedMedicine = await dbService.updateOne(Medicine, query, dataToUpdate);

    // if (!updatedMedicine) {
    //   return res.recordNotFound();
    // }

    // add entry in medical log
    // Retrieve the last medical_log_id from the database gaushala_id: req.user.gaushala_id

    /*
    const lastMedicalObj = await Medical_log.findOne({ gaushala_id: req.user.gaushala_id }, {}, { sort: { medical_log_id: -1 } }).lean();

    let lastMedicalLogNumber = lastMedicalObj ? lastMedicalObj.medical_log_id : 0;

    // Increment the last medical_log_id by 1
    lastMedicalLogNumber += 1;
    **/

    // let itemIds = [];

    // // add in stock
    // let dataToCreateStock = {};
    // const stockList = dataToUpdate.stockList;

    // const stockListAdd = [];
    // const stockIds = [];

    // if (stockList.length > 0) {
    //   for (let i = 0; i < stockList.length; i++) {
    //     stockListAdd.push({
    //       RFO_no: stockList[i].RFO_no,
    //       gaushala_id: dataToUpdate.gaushala_id,
    //       vendor_id: dataToUpdate.gaushala_id,
    //       bill_no: stockList[i].bill_no,
    //       item_id: stockList[i].item_id,
    //       expence_type: stockList[i].expence_type,
    //       qty: stockList[i].qty,
    //       kg_per_unit: stockList[i].kg_per_unit,
    //       rate_per_unit: stockList[i].rate_per_unit,
    //       totalWtOrQty: stockList[i].totalWtOrQty,
    //       total_amount: stockList[i].total_amount,
    //       entry_by: dataToUpdate.added_by,
    //       remark: dataToUpdate.medical_log_remark,
    //       isStock: stockList[i].isStock,
    //       date: dataToUpdate.medical_log_date,
    //     })

    //     itemIds.push(stockList[i].item_id)

    //   }
    // }

    // if (stockListAdd.length > 0) {
    //   for (let i = 0; i < stockListAdd.length; i++) {

    //     dataToCreateStock = stockListAdd[i];

    //     dataToCreateStock = new Stock(dataToCreateStock);
    //     const stockData = await dbService.create(Stock, dataToCreateStock);
    //     stockIds.push(stockData.id);
    //   }
    // }

    // let dataToCreateMedicalLog = {};
    // const itemsString = itemIds.join(',');
    // const stockIdString = stockIds.join(',');

    // dataToCreateMedicalLog.gaushala_id = query.gaushala_id;
    // dataToCreateMedicalLog.medical_log_id = lastMedicalLogNumber;
    // dataToCreateMedicalLog.medical_id = dataToUpdate.medical_id;
    // dataToCreateMedicalLog.stockId = stockIdString;
    // dataToCreateMedicalLog.item_id = itemsString;
    // dataToCreateMedicalLog.item_name = dataToUpdate.item_name;
    // dataToCreateMedicalLog.medical_type = dataToUpdate.type;
    // dataToCreateMedicalLog.date = dataToUpdate.medical_log_date;
    // dataToCreateMedicalLog.remark = dataToUpdate.medical_log_remark;

    /*
    dataToCreateMedicalLog = new Medical_log(dataToCreateMedicalLog);
    let createdMedical_log = await dbService.create(Medical_log, dataToCreateMedicalLog);
    **/
    return res.success({ data: { successMedical_ids, errorMedical_ids } });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

async function addStockOnMedicine(stockList, dataToUpdate, isUpdate) {

  try {

    const stockListAdd = [];
    const stockIds = [];
    let itemIds = [];
    let dataToCreateStock = {};


    if (stockList.length > 0) {
      for (let i = 0; i < stockList.length; i++) {
        stockListAdd.push({
          RFO_no: '',
          gaushala_id: dataToUpdate.gaushala_id,
          vendor_id: dataToUpdate.gaushala_id,
          bill_no: '',
          item_id: stockList[i].item_id,
          expence_type: 'Medical',
          qty: '1',
          kg_per_unit: 0,
          rate_per_unit: 0,
          totalWtOrQty: isUpdate ? stockList[i].totalWtOrQty : stockList[i].count,
          total_amount: 0,
          entry_by: dataToUpdate.added_by,
          remark: dataToUpdate.remark,
          isStock: true, // Because whole medical is stock maintained 
          date: utils.getTodayDate(),
        })

        itemIds.push(stockList[i].item_id)

      }
    }

    if (stockListAdd.length > 0) {
      for (let i = 0; i < stockListAdd.length; i++) {

        dataToCreateStock = stockListAdd[i];

        dataToCreateStock = new Stock(dataToCreateStock);
        const stockData = await dbService.create(Stock, dataToCreateStock);
        stockIds.push(stockData.id);
      }
    }

    const itemsString = itemIds.join(',');
    const stockIdString = stockIds.join(',');

    return { itemsString, stockIdString }

  } catch (error) {
    console.log(error.message)
  }

}

/**
 * @description : deactivate document of Medicine from table by id;
 * @param {Object} req : request including id in request params.
 * @param {Object} res : response contains updated document of Medicine.
 * @return {Object} : deactivated Medicine. {status, message, data}
 */
const softDeleteMedicine = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let query = { _id: req.params.id };
    query.gaushala_id = req.user.gaushala_id;
    const updateBody = { isDeleted: true, };
    let updatedMedicine = await dbService.updateOne(Medicine, query, updateBody);
    if (!updatedMedicine) {
      return res.recordNotFound();
    }
    return res.success({ data: updatedMedicine });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : delete document of Medicine from table.
 * @param {Object} req : request including id as req param.
 * @param {Object} res : response contains deleted document.
 * @return {Object} : deleted Medicine. {status, message, data}
 */
const deleteMedicine = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let query = { _id: req.params.id };
    query.gaushala_id = req.user.gaushala_id;
    const deletedMedicine = await dbService.deleteOne(Medicine, query);
    if (!deletedMedicine) {
      return res.recordNotFound();
    }
    return res.success({ data: deletedMedicine });

  }
  catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getPendingMedications = async (req, res) => {
  try {

    const foundMedicine = await getMedicineList(req.user.gaushala_id)

    if (!foundMedicine || foundMedicine.length === 0) {
      return res.recordNotFound();
    }

    return res.success({ data: foundMedicine });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

async function getMedicineList(gaushala_id) {
  try {

    const today = new Date(); // Get the current date
    const formattedToday = today.toISOString().substring(0, 10); // Format it as "YYYY-MM-DD"

    let query = {};
    query.next_dose_time = {
      $lte: formattedToday // Filter documents with next_dose_time before or on today
    }

    query.status = MEDICAL_STATUS.Running;

    query.gaushala_id = gaushala_id;

    const pipeline = [
      {
        $match: query
      },
      {
        $sort: {
          next_dose_time: -1
        }
      }
      ,
      {
        $lookup: {
          from: 'cows',
          localField: 'cowId',
          foreignField: 'tag_id',
          as: 'cowDetails'
        }
      },
      {
        $unwind: '$cowDetails'
      },
      {
        $match: {
          "cowDetails.gaushala_id": query.gaushala_id
        }
      },
      {
        $addFields: {
          calf_name: '$cowDetails.calf_name',
          shed_id: '$cowDetails.shed_id',
          cow_type: '$cowDetails.type'
        }
      },
      {
        $project: {
          cowDetails: 0
        }
      }
    ];

    const foundMedicine = await Medicine.aggregate(pipeline);

    return foundMedicine;


  } catch (error) {
    console.log(error.message);
    return;
  }
}

const getMedicationHistory = async (req, res) => {
  try {
    let query = {};
    query.medical_id = req.body.medical_id;
    query.gaushala_id = req.user.gaushala_id;

    const pipeline = [
      {
        $match: query
      },
      {
        $addFields: {
          stockIds: {
            $cond: {
              if: {
                $or: [
                  { $eq: ['$stockId', null] },
                  { $eq: ['$stockId', ''] }
                ]
              },
              then: [],
              else: { $split: ['$stockId', ','] }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'stocks',
          let: { stockIds: '$stockIds' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $gt: [{ $size: { $ifNull: ['$$stockIds', []] } }, 0] },
                    { $in: ['$_id', { $map: { input: '$$stockIds', as: 'stockId', in: { $toObjectId: '$$stockId' } } }] }
                  ]
                }
              }
            },
            {
              $lookup: {
                from: 'item_masters',
                localField: 'item_id',
                foreignField: 'ItemId',
                as: 'itemData'
              }
            },
            {
              $unwind: {
                path: '$itemData',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $match: {
                "itemData.gaushala_id": query.gaushala_id
              }
            },
          ],
          as: 'stockData'
        }
      },
      {
        $unwind: {
          path: '$stockData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          "stockData.gaushala_id": query.gaushala_id
        }
      },
      {
        $project: {
          gaushala_id: 1,
          medical_log_id: 1,
          medical_id: 1,
          item_id: 1,
          medical_type: 1,
          date: 1,
          remark: 1,
          totalWtOrQty: {
            $ifNull: ['$stockData.totalWtOrQty', 0]
          },
          item_name: {
            $ifNull: ['$stockData.itemData.ItemName', '']
          }
        }
      }
    ];

    const foundMedicine = await Medical_log.aggregate(pipeline);

    const transformedData = foundMedicine.reduce((accumulator, currentValue) => {
      const existingEntry = accumulator.find((entry) => entry.medical_log_id === currentValue.medical_log_id);

      if (existingEntry) {
        // If medical_log_id already exists, add a new item to the items array
        existingEntry.items.push({
          item_id: currentValue.item_id,
          item_name: currentValue.item_name,
          totalWtOrQty: currentValue.totalWtOrQty,
        });
      } else {
        // If medical_log_id doesn't exist, create a new entry
        accumulator.push({
          medical_log_id: currentValue.medical_log_id,
          date: currentValue.date,
          medical_id: currentValue.medical_id,
          remark: currentValue.remark,
          items: [
            {
              item_id: currentValue.item_id,
              item_name: currentValue.item_name,
              totalWtOrQty: currentValue.totalWtOrQty,
            },
          ],
        });
      }

      return accumulator;
    }, []);


    if (!foundMedicine || foundMedicine.length === 0) {
      return res.recordNotFound();
    }
    return res.success({ data: transformedData });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getPendingVaccineCows = async (req, res) => {
  try {
    let dataToCreate = { ...req.body || {} };
    let validateRequest = validation.validateParamsWithJoi(
      dataToCreate,
      medicineSchemaKey.chechVaccineSchemaKey
    );

    if (!validateRequest.isValid) {
      return res.validationError({
        message: `Invalid values in parameters, ${validateRequest.message}`,
      });
    }

    const vacName = dataToCreate.vac_name;
    const gaushala_id = req.user.gaushala_id;

    const pipeline = [{
      $match: {
        gaushala_id: gaushala_id,
        vac_name: vacName,
        status: 'RUNNING',
      },
    },
    {
      $group: {
        _id: '$cowId',
      },
    },
    ];

    const result = await Medicine.aggregate(pipeline);


    const cowIdsWithMedicine = result.map((entry) => entry._id);

    const shed_id = req.body.shed_id;
    const type = req.body.cow_type;

    let query = {
      tag_id: { $nin: cowIdsWithMedicine }
    }

    if (shed_id != '') {
      query.shed_id = shed_id
    }

    if (type != '') {
      query.type = type
    }

    const cowsWithoutMedicine = await COW.find(query).select('tag_id calf_name shed_id type');

    if (!cowsWithoutMedicine || cowsWithoutMedicine.length === 0) {
      return res.recordNotFound();
    }
    return res.success({ data: cowsWithoutMedicine });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getUpcomingMedications = async (req, res) => {
  try {
    const today = new Date();
    const formattedToday = today.toISOString().substring(0, 10);

    const tomorrowDate = new Date();
    tomorrowDate.setDate(today.getDate() + 1);
    const formattedTomorrowDate = tomorrowDate.toISOString().substring(0, 10);

    // Calculate the date for 30 days from today
    const thirtyDaysFromToday = new Date();
    thirtyDaysFromToday.setDate(tomorrowDate.getDate() + 30);
    const formattedThirtyDaysFromToday = thirtyDaysFromToday.toISOString().substring(0, 10);

    let query = {};
    query.next_dose_time = {
      $lte: formattedThirtyDaysFromToday, // Filter documents with next_dose_time before or on the next 30 days
      $gte: formattedTomorrowDate, // Filter documents with next_dose_time on or after today
    };

    query.status = MEDICAL_STATUS.Running;

    query.gaushala_id = req.user.gaushala_id;

    const pipeline = [
      {
        $match: query
      },
      {
        $sort: {
          next_dose_time: -1
        }
      },
      {
        $lookup: {
          from: 'cows',
          localField: 'cowId',
          foreignField: 'tag_id',
          as: 'cowDetails'
        }
      },
      {
        $unwind: '$cowDetails'
      },
      {
        $match: {
          "cowDetails.gaushala_id": query.gaushala_id
        }
      },
      {
        $addFields: {
          calf_name: '$cowDetails.calf_name',
          shed_id: '$cowDetails.shed_id',
          cow_type: '$cowDetails.type'
        }
      },
      {
        $project: {
          cowDetails: 0
        }
      }
    ];

    const foundMedicine = await Medicine.aggregate(pipeline);

    if (!foundMedicine || foundMedicine.length === 0) {
      return res.recordNotFound();
    }

    return res.success({ data: foundMedicine });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const addNewMedicine = async (req, res) => {
  try {
    let dataToUpdate = { ...req.body };
    let validateRequest = validation.validateParamsWithJoi(
      dataToUpdate,
      medicineSchemaKey.addMedicineSchemaKeys);

    if (!validateRequest.isValid) {
      return res.validationError({ message: `Invalid values in parameters, ${validateRequest.message}` });
    }

    const findMedicine = await dbService.findOne(Medicine, { medical_id: dataToUpdate.medical_id, gaushala_id: req.user.gaushala_id });

    if (!findMedicine) {
      return res.recordNotFound({ message: `Medication not found ${dataToUpdate.medical_id}` });
    }

    // Add the new medicines entry to the medicines array
    const newMedicineEntry = {
      item_id: dataToUpdate.item_id,
      item_name: dataToUpdate.item_name,
      count: dataToUpdate.count,
    };

    findMedicine.medicines.push(newMedicineEntry);

    // Update the medication document in the database
    const updatedMedicine = await dbService.updateOne(Medicine,
      { medical_id: dataToUpdate.medical_id, gaushala_id: req.user.gaushala_id },
      { $set: { medicines: findMedicine.medicines } }
    );

    return res.success({ message: 'Medicines updated successfully', data: updatedMedicine });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const removeMedicine = async (req, res) => {
  try {
    let dataToDelete = { ...req.body };
    let validateRequest = validation.validateParamsWithJoi(
      dataToDelete,
      medicineSchemaKey.removeMedicineSchemaKeys);

    // Validate request parameters
    if (!validateRequest.isValid) {
      return res.validationError({ message: `Invalid values in parameters, ${validateRequest.message}` });
    }
    // Find the medicine based on medical_id and gaushala_id
    const findMedicine = await dbService.findOne(Medicine, { medical_id: dataToDelete.medical_id, gaushala_id: req.user.gaushala_id });

    if (!findMedicine) {
      return res.recordNotFound({ message: `Medication not found for medical_id: ${dataToDelete.medical_id}` });
    }

    // Remove the medicine with the specified item_id from the medicines array
    findMedicine.medicines = findMedicine.medicines.filter(medicine => medicine.item_id !== dataToDelete.item_id);

    // Update the medication document in the database
    const updatedMedicine = await dbService.updateOne(Medicine,
      { medical_id: dataToDelete.medical_id, gaushala_id: req.user.gaushala_id },
      { $set: { medicines: findMedicine.medicines } }
    );

    return res.success({ message: 'Medicine removed successfully', data: updatedMedicine });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  getMedicineList,
  addNewMedicine,
  removeMedicine,
  getUpcomingMedications,
  getPendingVaccineCows,
  bulkAddMedicine,
  getMedicationHistory,
  getPendingMedications,
  addMedicine,
  findAllMedicine,
  getMedicineByCowId,
  medicineUpdate,
  softDeleteMedicine,
  deleteMedicine
};