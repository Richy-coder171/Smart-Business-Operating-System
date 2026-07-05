import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import { customerCreateSchema, customerQuerySchema, customerUpdateSchema } from "../validators/customerValidators.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "../config/db.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensureObjectId(id) {
  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid customer id.");
  }
}

async function assertUniquePhone(ownerId, phone, excludeId = null) {
  if (!phone) return;
  const query = { ownerId, phone };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existing = await Customer.findOne(query);
  if (existing) {
    throw new ApiError(409, "A customer with this phone already exists.");
  }
}

export const listCustomers = asyncHandler(async (req, res) => {
  const query = customerQuerySchema.parse(req.query);
  const filter = { ownerId: req.ownerId };

  if (query.status !== "all") {
    filter.status = query.status;
  }

  if (query.outstanding === "true") {
    filter.totalDue = { $gt: 0 };
  } else if (query.outstanding === "false") {
    filter.totalDue = 0;
  }

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ name: pattern }, { phone: pattern }];
  }

  const skip = (query.page - 1) * query.limit;
  const sort = { [query.sortBy]: query.sortOrder === "asc" ? 1 : -1 };
  const [customers, total] = await Promise.all([
    Customer.find(filter).sort(sort).skip(skip).limit(query.limit),
    Customer.countDocuments(filter)
  ]);

  res.json({
    success: true,
    customers,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit)
    }
  });
});

export const getCustomer = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const customer = await Customer.findOne({ _id: req.params.id, ownerId: req.ownerId });

  if (!customer) {
    throw new ApiError(404, "Customer not found.");
  }

  res.json({ success: true, customer });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const payload = customerCreateSchema.parse(req.body);
  await assertUniquePhone(req.ownerId, payload.phone);

  const customer = await Customer.create({
    ...payload,
    ownerId: req.ownerId
  });

  res.status(201).json({ success: true, customer });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const payload = customerUpdateSchema.parse(req.body);
  const customer = await Customer.findOne({ _id: req.params.id, ownerId: req.ownerId });

  if (!customer) {
    throw new ApiError(404, "Customer not found.");
  }

  if (payload.phone !== undefined) {
    await assertUniquePhone(req.ownerId, payload.phone, customer._id);
  }

  Object.assign(customer, payload);
  await customer.save();

  res.json({ success: true, customer });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const customer = await Customer.findOne({ _id: req.params.id, ownerId: req.ownerId });

  if (!customer) {
    throw new ApiError(404, "Customer not found.");
  }

  const transactionCount = await Transaction.countDocuments({
    ownerId: req.ownerId,
    customerId: customer._id
  });

  if (transactionCount > 0) {
    customer.status = "inactive";
    await customer.save();
    return res.json({
      success: true,
      message: "Customer has transactions and was marked inactive.",
      customer
    });
  }

  await customer.deleteOne();
  return res.json({
    success: true,
    message: "Customer deleted."
  });
});
