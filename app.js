const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

// O body-parser atribui o valor para a variável pegando o value do elemento que possui o name, o qual está dentro de um form.
// const {variável} = req.body.{name:value};


// date() agora executa a função getDate() do módulo date.js
// console.log(date);

const port = 3000;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

/* Especifica para o express para servir o folder public, o qual contém CSS */
app.use(express.static("public"));

/* Especifica ao Express quais arquivos de modelo renderizar. No caso os ejs. */
/* O método res.render() utiliza o 'view engine' para renderizar páginas. */
/* Por padrão o 'view engine' irá olhar a pasta 'views' para renderizar a página. */
app.set('view engine', 'ejs');

// Conecta/Cria o DB todolistDB
mongoose.connect("mongodb://127.0.0.1/todolistDB", { useNewURLParser: true });

// Schema é como se fosse o molde para determinado item ser criado.
const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
});

// A collection será items
const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
    name: "Organize room"
});

const item2 = new Item({
    name: "Check passage"
});

const item3 = new Item({
    name: "Practice focus methods"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

// A collection será lists
const List = mongoose.model("List", listSchema);

// Rotas
app.get("/", function (req, res) {
    Item.find({}, function (err, foundItems) {
        if (err) {
            console.log(err);
        } else {
            if (foundItems.length === 0) {
                Item.insertMany(defaultItems, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Default items added successfully!");
                    }
                });
                res.redirect("/");
            } else {
                res.render('list', { listTitle: "Today", newListItems: foundItems });
            }
        }
    });
});

app.get("/:customList", (req, res) => {
    // req.params.customList -> Parâmetro customList da requisição ao endereço.
    const customListName = _.capitalize(req.params.customList);
    console.log("Moved to " + customListName + " list");

    // Procura por uma lista já existente.
        // Existe: Redireciona para ela.
        // Não existe: cria a lista, salva(atualiza) e redireciona.
    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render('list', { listTitle: foundList.name, newListItems: foundList.items });
            }
        } else {
            console.log(err);
        };
    });
});

// Realizado através do botão + ou Enter
app.post("/", function (req, res) {
    // Pega o valor do elemento de name newItem dentro do form no submit
    const itemName = req.body.newItem;
    
    // Pega o valor do elemento de name list dentro do form no submit
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect('/');
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect('/' + listName);
        });
    };
    console.log("Added " + itemName + " to " + listName + " list");
});

// Executado quando o usuário clica no checkbox
app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === 'Today') {
        Item.findByIdAndDelete(checkedItemId, function (err) {
            if (!err) {
                console.log("Item removed from To do list");
                res.redirect('/');
            } else {
                console.log(err);
            }
        });
    } else {
        // Primeiro encontra a lista e $pull em items encontra o item com a id a ser removido. Callback function.
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
            if (!err) {
                console.log("Item removed from " + listName + " list");
                res.redirect('/' + listName);
            } else {
                console.log(err);
            };
        });
    };
});


app.get("/about", function (req, res) {
    res.render("about");
});

app.listen(port, function () {
    console.log("Server running on port: " + port);
});