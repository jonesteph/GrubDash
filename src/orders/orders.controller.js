const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");



// middleware

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body
    if (data[propertyName] && data[propertyName] !== "") {
      return next()
    }
    next({
        status: 400,
        message: `Must include a ${propertyName}`
    })
  }
}


function checkDishes(req, res, next){
  const { data: { dishes } = {} } = req.body
  if(dishes.length && Array.isArray(dishes)){
    return next()
  }
  next({
    status: 400,
    message: "Order must include at least one dish"
  })
}


function checkDishDetails(req, res, next){
  const { data: { dishes } = {} } = req.body
  for (i in dishes) {
    const dish = dishes[i]
    const quant = dish.quantity
    if (!quant || quant < 1 || !Number.isInteger(quant)){
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`
      })
    }
  }
  next()
}


function orderExists(req, res, next){
  const { orderId } = req.params
  const foundOrder = orders.find((order) => order.id === orderId)
  if (foundOrder) {
    res.locals.order = foundOrder
    return next()
  }
  next({
    status: 404,
    message: `Order id does not exist: ${orderId}`,
  })
}


function matchIds(req, res, next) {
  const { orderId } = req.params
  const { data: { id } = {} } = req.body
  if (!id || id === orderId){
    res.locals.orderId = orderId
    return next()
  } 
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
  })
}


function updateStatus(req, res, next){
  const { data: { status } = {} } = req.body
  if (status === "delivered") {
      return next({
        status: 400,
        message: "A delivered order cannot be changed"
    }) 
  }
  if (status && status !== "" && (status === "pending" || status === "preparing" || status === "out-for-delivery")){
    return next()
  }
  next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    }) 
}


function deleteStatus(req, res, next) {
  if (res.locals.order.status === "pending") {
      return next()
    }
  next({
        status: 400,
        message: "An order cannot be deleted unless it is pending"
  })
}




//handlers

function list(req, res, next) => {
  res.json({ data: orders })
}


function create(req, res, next) => {
  const data = req.body.data || {}
  const newOrder = {
     ...data, 
     id: nextId(),
  }
  orders.push(newOrder)
  res.status(201).json({ data: newOrder})
}


function read(req, res, next) => {
  res.json({ data: res.locals.order })
}


function update(req, res, next) => {
  const order = res.locals.order
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body
  const newOrder = {
    id: res.locals.orderId,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
    status: status,
  }

  res.json({ data: newOrder })
}


function destroy(req, res, next) => {
  const { orderId } = req.params
  const i = orders.findIndex((order) => order.id === Number(orderId))
  const deletedOrders = orders.splice(i, 1);
  res.sendStatus(204);
}



module.exports = {
  list,
  create: [
      bodyDataHas("deliverTo"),
      bodyDataHas("mobileNumber"),
      bodyDataHas("dishes"),
      checkDishes,
      checkDishDetails,
      create
  ],
  read: [
      orderExists,
      read
  ],
  update: [
      orderExists,
      matchIds,
      bodyDataHas("deliverTo"),
      bodyDataHas("mobileNumber"),
      bodyDataHas("dishes"),
      checkDishes,
      checkDishDetails,
      updateStatus,
      update
  ],
  delete: [
    orderExists,
    deleteStatus,
    destroy
  ]
}
