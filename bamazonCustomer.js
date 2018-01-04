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
	goShopping();
});

function goShopping(){

	inq.prompt([
		{
			type: "list",
			name: "choice",
			message: "================ \n Welcome to the Bamazon Marketplace!\n==============\n Choose an option.",
			choices: ["Look at all items", "Leave the store"]
		}


	]).then(function(data){
		var userChoice = data.choice;

		if(userChoice === "Look at all items"){

			connection.query("SELECT * FROM products", function(err, data){
				if(err) throw err;

				var table = new Table({

					head: ["ID", "Name", "Dept", "Price"],
					colWidths: [5, 20, 20, 10]
				});

				for(var i = 0; i < data.length; i++){
					table.push(
						[data[i].item_id, data[i].prod_name, data[i].dept_name, data[i].price]
					);
				}
				console.log(table.toString());
				inq.prompt([
					{
						type: "prompt",
						name: "select",
						message: "What is the ID of the item you would like to purchase?"
					},
					{
						type: "prompt",
						name: "count",
						message: "How many units would you like to purchase?"
					}
					]).then(function(prompt){
						var item = prompt.select;
						var unit = prompt.count;
						connection.query("SELECT * FROM products WHERE item_id = ?", [item], function(err, data){
							var customerItem = data[0];
							if(customerItem.quantity < parseFloat(unit)){
								console.log("Sorry, looks we only have " + customerItem.quantity + " left. Pick another item or lower your order. \n");
								goShopping();

							}else{
								var customerPrice = parseFloat(unit) * customerItem.price;
								console.log("Your " + unit + " units of " + customerItem.prod_name + " will cost " + customerPrice + " dollars \n");

								inq.prompt([
									{
										type: "confirm",
										name: "purchase",
										message: "Continue with purchase?"
									}

								]).then(function(confirm){
									if(confirm.purchase){
										var newQuantity = customerItem.quantity - parseFloat(unit);
										connection.query("UPDATE products SET quantity = ? WHERE item_id = ?", [newQuantity, item]);
										goShopping();
									}else{
										console.log("Sorry to hear that. Please continue shopping!\n");
										goShopping();
									}
									
								});
								
							}
	
						});
	
					})
	
			})
		}

		if(userChoice === "Leave the store"){
			console.log("Thanks for visiting the store!");
			connection.end();
		}

	});
}