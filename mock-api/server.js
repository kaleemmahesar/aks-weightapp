const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

// Sample data
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 2,
    username: 'operator',
    password: 'operator123',
    role: 'operator'
  }
];

const records = [
  {
    id: 1,
    vehicle_number: 'ABC-123',
    party_name: 'Test Party 1',
    vehicle_type: 'Truck',
    product: 'Cement',
    first_weight: 5000,
    second_weight: 3000,
    net_weight: 2000,
    total_price: 20000,
    first_weight_time: '2023-05-01T10:30:00Z',
    second_weight_time: '2023-05-01T11:30:00Z',
    driver_name: 'Test Driver',
    status: 'completed'
  },
  {
    id: 2,
    vehicle_number: 'XYZ-789',
    party_name: 'Test Party 2',
    vehicle_type: 'Trailer',
    product: 'Steel',
    first_weight: 8000,
    second_weight: null,
    net_weight: null,
    total_price: 15000,
    first_weight_time: '2023-05-02T14:45:00Z',
    second_weight_time: null,
    driver_name: 'Test Driver 2',
    status: 'pending'
  }
];

const expenses = [
  {
    id: 1,
    description: 'Office Supplies',
    amount: 1500,
    category: 'Regular Expense',
    date: '2024-01-15',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    description: 'Fuel Cost',
    amount: 3000,
    category: 'Regular Expense',
    date: '2024-01-14',
    created_at: '2024-01-14T14:20:00Z'
  },
  {
    id: 3,
    description: 'Owner Payment',
    amount: 50000,
    category: 'Deposit to Owner',
    date: '2024-01-13',
    created_at: '2024-01-13T16:45:00Z'
  }
];

const settings = {
  vehiclePrices: {
    Truck: 500,
    Trailer: 400,
    Container: 600,
    DahWheeler: 500,
    SixWheeler: 400,
    Tractor: 300,
    Mazda: 300,
    Datson: 150,
    Shahzore: 150,
    Daalo: 100,
    Chingchi: 100,
    GadahGano: 100
  }
};

app.use(cors());
app.use(express.json());

// Routes
app.post('/index.php', (req, res) => {
  const action = req.query.action;
  
  if (action === 'login') {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      res.status(200).json({
        success: true,
        role: user.role,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    return;
  }
  
  if (action === 'saveFirstWeight') {
    const newRecord = {
      id: Date.now(),
      vehicle: req.body.vehicle,
      party: req.body.party,
      type: req.body.type,
      product: req.body.product,
      weight: req.body.weight,
      price: req.body.price,
      driver: req.body.driver,
      firstTime: new Date().toISOString(),
      status: 'pending'
    };
    
    // Add to records array
    records.push({
      id: newRecord.id,
      vehicle_number: newRecord.vehicle,
      party_name: newRecord.party,
      vehicle_type: newRecord.type,
      product: newRecord.product,
      first_weight: newRecord.weight,
      second_weight: null,
      net_weight: null,
      total_price: newRecord.price,
      first_weight_time: newRecord.firstTime,
      second_weight_time: null,
      driver_name: newRecord.driver,
      status: 'pending'
    });
    
    res.status(200).json({
      success: true,
      record: newRecord,
      message: 'First weight saved successfully'
    });
    return;
  }
  
  if (action === 'saveSecondWeight') {
    res.status(200).json({
      success: true,
      record: req.body,
      message: 'Second weight saved successfully'
    });
    return;
  }
  
  if (action === 'updateRecord') {
    res.status(200).json({
      success: true,
      record: req.body,
      message: 'Record updated successfully'
    });
    return;
  }
  
  if (action === 'addExpense') {
    const newExpense = {
      id: Date.now(),
      ...req.body,
      created_at: new Date().toISOString()
    };
    expenses.push(newExpense);
    res.status(200).json({
      success: true,
      data: newExpense,
      message: 'Expense added successfully'
    });
    return;
  }
  
  if (action === 'updateExpense') {
    const expenseIndex = expenses.findIndex(e => e.id == req.body.id);
    if (expenseIndex !== -1) {
      expenses[expenseIndex] = { ...expenses[expenseIndex], ...req.body };
      res.status(200).json({
        success: true,
        data: expenses[expenseIndex],
        message: 'Expense updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    return;
  }
  
  if (action === 'deleteExpense') {
    const expenseIndex = expenses.findIndex(e => e.id == req.body.id);
    if (expenseIndex !== -1) {
      expenses.splice(expenseIndex, 1);
      res.status(200).json({
        success: true,
        message: 'Expense deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    return;
  }
  
  res.status(404).json({ message: 'Action not found' });
});

app.get('/index.php', (req, res) => {
  const action = req.query.action;
  
  if (action === 'getRecords') {
    res.status(200).json({
      success: true,
      data: records
    });
    return;
  }
  
  if (action === 'getSettings') {
    res.status(200).json({
      success: true,
      data: settings
    });
    return;
  }
  
  if (action === 'getExpenses') {
    res.status(200).json({
      success: true,
      data: expenses
    });
    return;
  }
  
  res.status(404).json({ message: 'Action not found' });
});

app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
});