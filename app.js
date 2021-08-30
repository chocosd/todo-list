//jshint esversion:6
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const dbName = process.env.DB_NAME;
const mongoose = require("mongoose")
const express = require("express");
const app = express();
const _ = require("lodash");
const db = mongoose.connection;

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(`${dbName}`, {useNewUrlParser: true, useUnifiedTopology: true});

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log("Connected"));

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({ name: "Welcome to your todolist!" });
const item2 = new Item({ name: "Hit the + button to add a new item." });
const item3 = new Item({ name: "<-- Hit this to delete an item." });
const defaultItems = [item1, item2, item3];
const listTabs = [];

const listSchema = {
  listTitle: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) =>{
  Item.find({}, (err, foundItems) =>{
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => err ? console.log(err): console.log("Saved default items to DB."));
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.get("/:customListName", (req, res) =>{
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({listTitle: customListName}, (err, foundList) =>{
    if(!err){
      if(!foundList){
        // creating documents/row
        const list = new List({
          listTitle: customListName,
          items: defaultItems
        });
        list.save((err, result) => res.redirect("/" + customListName));
      } else{
        res.render("list",{
          listTitle: foundList.listTitle,
          newListItems: foundList.items
        });
      }
    }
  });
 
});

app.post("/", (req, res) =>{
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({listTitle: listName}, (err, foundList) =>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});




app.post("/delete", (req, res) =>{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) =>{
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      {listTitle: listName},
      {$pull: {items: {_id: checkedItemId}}}, (err, foundList) =>{
      if (!err){
        console.log("deleted");
        res.redirect("/" + listName);
      }
    });
  }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));