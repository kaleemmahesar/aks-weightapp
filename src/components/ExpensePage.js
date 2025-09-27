import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  fetchExpenses, 
  addExpense, 
  updateExpense, 
  deleteExpense,
  calculateTotalExpenses,
  calculateTodayExpenses 
} from '../redux/slices/expenseSlice';
import { FaPlus, FaEdit, FaTrash, FaMoneyBillWave, FaCalendarAlt } from 'react-icons/fa';
import notify from './notification';
import '../styles/WeightForms.css';
import '../styles/EnhancedForms.css';

const ExpensePage = () => {
  const dispatch = useDispatch();
  const { expenses, loading, totalExpenses, todayExpenses } = useSelector(state => state.expenses);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(''); // For filtering by category

  // Expense categories
  const expenseCategories = [
    'Regular Expense',
    'Deposit to Owner',
    'Chae Pani',
    'Other',
  ];

  // Validation schema
  const validationSchema = Yup.object({
    description: Yup.string()
      .required('Description is required')
      .min(3, 'Description must be at least 3 characters'),
    amount: Yup.number()
      .required('Amount is required')
      .positive('Amount must be positive')
      .min(1, 'Amount must be at least 1'),
    category: Yup.string()
      .required('Category is required'),
    date: Yup.date()
      .required('Date is required')
      .max(new Date(), 'Date cannot be in the future')
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      description: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (editingExpense) {
          await dispatch(updateExpense({ ...editingExpense, ...values })).unwrap();
          notify('Expense updated successfully!', 'success');
          setEditingExpense(null);
        } else {
          await dispatch(addExpense(values)).unwrap();
          notify('Expense added successfully!', 'success');
        }
        resetForm();
        setShowForm(false);
        dispatch(calculateTotalExpenses());
        dispatch(calculateTodayExpenses());
      } catch (error) {
        notify('Error saving expense: ' + error, 'error');
      }
    }
  });

  // Load expenses on component mount
  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);

  // Calculate totals when expenses change
  useEffect(() => {
    if (expenses.length > 0) {
      dispatch(calculateTotalExpenses());
      dispatch(calculateTodayExpenses());
    }
  }, [expenses, dispatch]);

  // Filter expenses by category
  const filteredExpenses = selectedCategory 
    ? expenses.filter(expense => expense.category === selectedCategory)
    : expenses;

  // Calculate total for filtered expenses
  const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

  // Handle edit
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    formik.setValues({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await dispatch(deleteExpense(expenseId)).unwrap();
        notify('Expense deleted successfully!', 'success');
        dispatch(calculateTotalExpenses());
        dispatch(calculateTodayExpenses());
      } catch (error) {
        notify('Error deleting expense: ' + error, 'error');
      }
    }
  };

  // Cancel edit/add
  const handleCancel = () => {
    setEditingExpense(null);
    setShowForm(false);
    formik.resetForm();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Filter expenses by date range
  const getFilteredExpenses = (days = null) => {
    if (!days) return expenses;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return expenses.filter(expense => new Date(expense.date) >= cutoffDate);
  };

  return (
    <div className="dashboard-container">
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="mb-0">
                <FaMoneyBillWave className="me-2 text-danger" />
                Expense Management
              </h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(!showForm)}
              >
                <FaPlus className="me-2" />
                {showForm ? 'Cancel' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-danger text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="card-title">Today's Expenses</h6>
                    <h4 className="mb-0">{formatCurrency(todayExpenses || 0)}</h4>
                  </div>
                  <FaCalendarAlt size={30} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="card-title">This Week</h6>
                    <h4 className="mb-0">
                      {formatCurrency(
                        getFilteredExpenses(7).reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
                      )}
                    </h4>
                  </div>
                  <FaCalendarAlt size={30} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="card-title">This Month</h6>
                    <h4 className="mb-0">
                      {formatCurrency(
                        getFilteredExpenses(30).reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
                      )}
                    </h4>
                  </div>
                  <FaCalendarAlt size={30} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-secondary text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="card-title">Total Expenses</h6>
                    <h4 className="mb-0">{formatCurrency(totalExpenses || 0)}</h4>
                  </div>
                  <FaMoneyBillWave size={30} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                  </h5>
                </div>
                <div className="card-body">
                  <form onSubmit={formik.handleSubmit}>
                    <div className="row">
                      <div className="col-md-5">
                        <div className="mb-3">
                          <label className="form-label">Description *</label>
                          <input
                            type="text"
                            className={`form-control ${formik.touched.description && formik.errors.description ? 'is-invalid' : ''}`}
                            name="description"
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Enter expense description"
                          />
                          {formik.touched.description && formik.errors.description && (
                            <div className="invalid-feedback">{formik.errors.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="mb-3">
                          <label className="form-label">Amount (PKR) *</label>
                          <input
                            type="number"
                            className={`form-control ${formik.touched.amount && formik.errors.amount ? 'is-invalid' : ''}`}
                            name="amount"
                            value={formik.values.amount}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="0"
                            min="1"
                            step="0.01"
                          />
                          {formik.touched.amount && formik.errors.amount && (
                            <div className="invalid-feedback">{formik.errors.amount}</div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="mb-3">
                          <label className="form-label">Date *</label>
                          <input
                            type="date"
                            className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                            name="date"
                            value={formik.values.date}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            max={new Date().toISOString().split('T')[0]}
                          />
                          {formik.touched.date && formik.errors.date && (
                            <div className="invalid-feedback">{formik.errors.date}</div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Category *</label>
                          <select
                            className={`form-select ${formik.touched.category && formik.errors.category ? 'is-invalid' : ''}`}
                            name="category"
                            value={formik.values.category}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          >
                            <option value="">Select Category</option>
                            {expenseCategories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                          {formik.touched.category && formik.errors.category && (
                            <div className="invalid-feedback">{formik.errors.category}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Add Expense')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Expense Records ({filteredExpenses.length})</h5>
                  <div className="d-flex align-items-center gap-3">
                    {selectedCategory && (
                      <div className="text-end">
                        {/* <small className="text-muted d-block">Total for {selectedCategory}:</small> */}
                        <strong className="text-primary">{formatCurrency(filteredTotal)}</strong>
                      </div>
                    )}
                    <div style={{ minWidth: '200px' }}>
                      <select
                        className="form-select form-select-sm"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="">All Categories</option>
                        {expenseCategories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {loading && expenses.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted">
                      {selectedCategory ? `No expenses found for category "${selectedCategory}".` : 'No expenses recorded yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Category</th>
                          <th>Amount</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...filteredExpenses]
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((expense) => (
                          <tr key={expense.id}>
                            <td>{new Date(expense.date).toLocaleDateString()}</td>
                            <td>{expense.description}</td>
                            <td>
                              <span className="badge bg-secondary">{expense.category}</span>
                            </td>
                            <td className="text-danger fw-bold">
                              {formatCurrency(expense.amount)}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => handleEdit(expense)}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(expense.id)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensePage;