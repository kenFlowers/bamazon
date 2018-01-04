var mysql = require("mysql");
var inq = require("inquirer");
var Table = require("cli-table");

var connection = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "bamazon"
});

connection.connect(function(err){
	if(err) throw err;
	manageStore();
});

function createTable(err, data){
	if(err) throw err;
	var table = new Table({
		head: ["ID", "Name", "Dept", "Price", "Quantity"],
		colWidths: [5, 20, 20, 10, 10]
	});

	for(var i = 0; i < data.length; i++){
		table.push(
			[data[i].item_id, data[i].prod_name, data[i].dept_name, data[i].price, data[i].quantity]
		);
	}


	console.log(table.toString());
	manageStore();
}

function manageStore(){
	inq.prompt([
		{
			type: "list",
			name: "choice",
			message: "================ \n Welcome to the Bamazon Marketplace!\n==============\n Choose an option.",
			choices: ["View All Products", "View Low Inventory", "Add Inventory", "Add New Product", "Leave the store"]
		}


	]).then(function(data){
		var userChoice = data.choice;

		if(userChoice === "View All Products"){
			connection.query("SELECT * FROM products", function(err, data){
				createTable(err, data);
			}); 
		}


		if(userChoice === "View Low Inventory"){
			connection.query("SELECT * FROM products WHERE quantity < 5", function(err, data){
				if (data.length === 0){
					console.log("\n \n \n No products have low inventory at the time \n \n \n");
					manageStore();
				}else{
					createTable(err, data);
				}
			})
		}


		if(userChoice === "Add Inventory"){
			connection.query("SELECT * FROM products", function(err, data){
				if(err) throw err;
				var table = new Table({
					head: ["ID", "Name", "Dept", "Price", "Quantity"],
					colWidths: [5, 20, 20, 10, 10]
				});

				for(var i = 0; i < data.length; i++){
					table.push(
						[data[i].item_id, data[i].prod_name, data[i].dept_name, data[i].price, data[i].quantity]
					);
				}
				console.log(table.toString());
				
				inq.prompt([
					{
						name: "item",
						type: "prompt",
						message: "What is the ID of the item you want to add?"
					},
					{
						name: "amount",
						type: "prompt",
						message: "How many units do you want to add?"
					}
					]).then(function(prompt){
						var item = prompt.item;
						var units = prompt.amount;
						connection.query("SELECT * FROM products WHERE item_id = ?", [item], function(err, data){
							var inventory = data[0].quantity;
							var addUnits = parseFloat(units) + inventory;
							connection.query("UPDATE products SET quantity = ? WHERE item_id = ?", [addUnits, item]);
						});
						
						connection.query("SELECT * FROM products WHERE item_id = ?", [item], function(err, data){
							console.log("\n \n You added " + units + " units to the " + data[0].prod_name + " count. \n");
							manageStore();
						});
					})	
				});	
		}

		if(userChoice === "Add New Product"){
			inq.prompt([
				{
					type: "list",
					name: "dept",
					message: "What department will this item go into?",
					choices: ["Electronics", "Cleaning", "Food", "Other"]
				},
				{
					type: "prompt",
					name: "item",
					message: "What item do you want add?"
				},
				{
					type: "prompt",
					name: "quantity",
					message: "How many are you adding?"
				},
				{
					type: "prompt",
					name: "price",
					message: "How much does this item cost?"
				}

				]).then(function(data){
					console.log("\n You will be adding " + data.quantity + " units of " + data.item + " to the store. The " + data.item + " will cost " + data.price + " dollars.\n");
					inq.prompt([
						{
							type: "confirm",
							name: "confirm",
							message: "Continue with addition of item?"
						}
						]).then(function(confirm){
							if(confirm.confirm){
								connection.query("INSERT INTO products (prod_name, dept_name, price, quantity) VALUES (?,?,?,?)", [data.item, data.dept, data.price, data.quantity]);
								connection.query("SELECT * FROM products", function(err, data){
									createTable(err, data);
								});
							}else{
								console.log("Sorry to hear that \n");
								manageStore();
							}
						});

				});

		}

		if(userChoice === "Leave the store"){
			console.log("\nThanks for visiting the store!\n");
			connection.end();
		}

	});
}