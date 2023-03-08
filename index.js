
// npm installs
require('dotenv').config();
const inquirer = require('inquirer');
const mysql = require('mysql2');
const table = require('console.table');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'employeeTracker_db'
});

db.connect(function(err) {
    if (err) throw err
    console.log('MySQL Connected')
    startPrompt();
});

const startPrompt = () => {
    return inquirer.prompt([{
        name: 'action',
        type: 'list',
        message: 'What would like to do?',
        choices: [
            "View all departments",
            "View all roles",
            "View all employees",
            "Add department",
            "Add role",
            "Add employee",
            "Update employee role"
        ]
    }]).then(function(val) {
        switch (val.action) {
            case "View all departments":
                console.log(val.action);
                viewAllDepartments();
                break;
            case "View all roles":
                viewAllRoles();
                break;
            case "View all employees":
                viewAllEmployees();
                break;
            case "Add department":
                addDepartment();
                break;
            case "Add role":
                addRole();
                break;
            case "Add employee":
                addEmployee();
                break;
            case "Update employee role":
                updateEmployee();
        }
    });
}

const viewAllDepartments = () => {
    const query = `SELECT * FROM department`;
    db.query(query,
        function(err, res) {
            if (err) throw err
            console.table(res)
            startPrompt()
        })
}

const viewAllRoles = () => {
    const query = `SELECT roles.id, roles.title, roles.salary FROM roles`;
    db.query(query,
        function(err, res) {
            if (err) throw err
            console.table(res)
            startPrompt()
        })
};

const viewAllEmployees = () => {
    const query = `SELECT employees.id, employees.first_name, employees.last_name, department.name, roles.title, roles.salary, CONCAT(e.first_name, ' ' ,e.last_name) AS Manager FROM employees INNER JOIN roles on roles.id = employees.role_id INNER JOIN department on department.id = roles.department_id left join employees e on employees.manager_id = e.id;`;
    db.query(query,
        function(err, res) {
            if (err) throw err
            console.table(res)
            startPrompt()
        })
};

const addDepartment = () => {
    inquirer.prompt([{
        name: "Name",
        type: "input",
        message: "What department would you like to add?"
    }]).then(function(res) {
        const query = "INSERT INTO department SET ?";
        db.query(
            query, {
                name: res.Name
            },
            function(err) {
                if (err) throw err
                console.table(res);
                startPrompt();
            }
        )
    })
}

let roleArr = [];
const selectRole = () => {
    const query = "SELECT * FROM roles";
    db.query(query, function(err, res) {
        if (err) throw err
        for (var i = 0; i < res.length; i++) {
            roleArr.push(res[i].title);
        }
    })
    return roleArr;
};

let managerArr = [];
const selectManager = () => {
    const query = `SELECT first_name, last_name FROM employees WHERE manager_id IS NULL`;
    db.query(query, function(err, res) {
        if (err) throw err
        for (var i = 0; i < res.length; i++) {
            managerArr.push(res[i].first_name);
        }
    })
    return managerArr;
};

const addRole = () => {
    const query = `SELECT roles.title, roles.salary FROM roles`;
    db.query(query, function(err,res) {
        inquirer.prompt([{
            name: "Title",
            type: "input",
            message: "What is the roles Title?"
        },
        {
            name: "Salary",
            type: "input",
            message: "What is the Salary?"
        }
    ]).then(function(res) {
        db.query(
            "INSERT INTO roles SET ?", {
                title: res.Title,
                salary: res.Salary,
            },
            function(err) {
                if (err) throw err
                console.table(res);
                startPrompt();
            }
        )
    })
    })
}

const addEmployee = () => {
    inquirer.prompt([{
        name: "first_name",
        type: "input",
        message: "Enter employee's first name"
    },
    {
        name: "last_name",
        type: "input",
        message: "Enter employee's last name"
    },
    {
        name: "roles",
        type: "list",
        message: "What is this employee's role?",
        choices: selectRole()
    },
    {
        name: "choice",
        type: "list",
        message: "Who is this employees manager?",
        choices: selectManager()
    }
]).then(function(val) {
    const roleId = selectRole().indexOf(val.role) + 1;
    const managerId = selectManager().indexOf(val.choice) + 1;
    db.query("INSERT INTO employees SET ?", {
        first_name: val.first_name,
        last_name: val.last_name,
        manager_id: managerId,
        role_id: roleId
    }, function(err) {
        if (err) throw err
        console.table(val)
        startPrompt()
    })
})
};

const updateEmployee = () => {
    const query = `SELECT employees.last_name, roles.title FROM employees JOIN roles ON employees.role_id = roles.id`;
    db.query(query, function(err, res) {
        if (err) throw err
        inquirer.prompt([{
            name: "lastName",
            type: "rawlist",
            choices: function() {
                let lastName = [];
                for (var i = 0; i < res.length; i++) {
                    lastName.push(res[i].last_name);
                }
                return lastName;
            }, message: "What is the Employee's last name?",
        },
        {
            name: "roles",
            type: "rawlist",
            message: "What is the Employees new title?",
            choices: selectRole()
        },
    ]).then(function(val) {
        let roleId = selectRole().indexOf(val.roles) + 1;
        db.query("Update employees set ? where ?", [{
            last_name: val.lastName,
        },
    {
        role_id: roleId
    }],
    function(err) {
        if (err) throw err
        console.table(val)
        startPrompt()
    })
    })
    })
}