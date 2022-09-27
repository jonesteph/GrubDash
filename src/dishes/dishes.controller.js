const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
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


function checkPrice(req, res, next){
  const { data: { price } = {} } = req.body
  if(price > 0 && Number.isInteger(price)){
    return next()
  }
  next({
    status: 400,
    message: "Dish must have a price that is an integer greater than 0"
  })
}


function dishExists(req, res, next){
  const { dishId } = req.params
  const foundDish = dishes.find((dish) => dish.id === dishId)
  if (foundDish) {
    res.locals.dish = foundDish
    return next()
  }
  next({
    status: 404,
    message: `Dish id does not exist: ${dishId}`,
  })
}


function matchIds(req, res, next) {
  const { dishId } = req.params
  const { data: { id } = {} } = req.body
  if (!id || id === dishId){
    res.locals.dishId = dishId
    return next()
  } 
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
  })
}


//handlers

const list = (req, res, next) => {
  res.json({ data: dishes })
}


const read = (req, res, next) => {
  res.json({ data: res.locals.dish })
}


const create = (req, res, next) => {
  const data = req.body.data || {}
  const newDish = {
     ...data, 
     id: nextId(),
  }
  dishes.push(newDish)
  res.status(201).json({ data: newDish})
}


const update = (req, res, next) => {
  const dish = res.locals.dish
  const { data: { name, description, image_url, price } = {} } = req.body
  const newDish = {
    id: res.locals.dishId,
    name: name,
    description: description,
    image_url: image_url,
    price: price,
  }

  res.json({ data: newDish }); 
}


module.exports = {
  list,
  read: [
      dishExists,
      read
  ],
  create: [
      bodyDataHas("name"),
      bodyDataHas("description"),
      bodyDataHas("price"),
      bodyDataHas("image_url"),
      checkPrice,
      create
  ],
  update: [
      dishExists,
      matchIds,
      bodyDataHas("name"),
      bodyDataHas("description"),
      bodyDataHas("price"),
      bodyDataHas("image_url"),
      checkPrice,
      update
  ],
}