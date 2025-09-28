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
import { FaPlus, FaEdit, FaTrash, FaMoneyBillWave, FaCalendarAlt, FaSearch } from 'react-icons/fa';
import notify from './notification';
import '../styles/WeightForms.css';
import '../styles/EnhancedForms.css';

const ExpensePage = () => {
  const dispatch = useDispatch();
  const { expenses, loading, totalExpenses, todayExpenses } = useSelector(state => state.expenses);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(''); // For filtering by category
  const [searchTerm, setSearchTerm] = useState(''); // For text-based search

  // Expense categories
  const expenseCategories = [
    'Regular Expense',
    'Deposit to Owner',
    'Chae Pani',
    'Equipment',
    'Staff Expense',
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
        setShowModal(false);
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

  // Filter expenses by category and search term
  const filteredExpenses = expenses.filter(expense => {
    // Filter by category if selected
    const categoryMatch = selectedCategory ? expense.category === selectedCategory : true;
    
    // Filter by search term if provided
    const searchMatch = searchTerm ? (
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.amount.toString().includes(searchTerm)
    ) : true;
    
    return categoryMatch && searchMatch;
  });

  // Calculate total for filtered expenses
  const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

  // Get category color
  const getCategoryColor = (category) => {
    const colorMap = {
      'Regular Expense': 'bg-primary',
      'Deposit to Owner': 'bg-success',
      'Chae Pani': 'bg-info',
      'Equipment': 'bg-warning text-dark',
      'Staff Expense': 'bg-danger',
      'Other': 'bg-secondary'
    };
    return colorMap[category] || 'bg-secondary';
  };

  // Handle edit
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    formik.setValues({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date
    });
    setShowModal(true);
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
    setShowModal(false);
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

  // Helper function to get expense date (handles both 'date' and 'expense_date' properties)
  const getExpenseDate = (expense) => {
    const dateValue = expense.date || expense.expense_date || expense.created_at;
    if (!dateValue) return null;
    return new Date(dateValue).toISOString().split('T')[0];
  };

  // Filter expenses by date range
  const getFilteredExpenses = (days = null) => {
    if (!days) return expenses;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    return expenses.filter(expense => {
      const expenseDateStr = getExpenseDate(expense);
      return expenseDateStr && expenseDateStr >= cutoffDateStr;
    });
  };

  // Calculate filtered stats based on current search and category filters
  const getFilteredStats = (days = null) => {
    let baseData = filteredExpenses; // Use already filtered data
    
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
      baseData = baseData.filter(expense => {
        const expenseDateStr = getExpenseDate(expense);
        return expenseDateStr && expenseDateStr >= cutoffDateStr;
      });
    }
    
    return baseData.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  // Calculate today's filtered expenses
  const getTodayFilteredExpenses = () => {
    const today = new Date().toISOString().split('T')[0];
    return filteredExpenses
      .filter(expense => {
        const expenseDateStr = getExpenseDate(expense);
        return expenseDateStr === today;
      })
      .reduce((sum, expense) => {
        const amount = parseFloat(expense.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
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
                onClick={() => setShowModal(true)}
              >
                <FaPlus className="me-2" />
                Add Expense
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
                    <h4 className="mb-0">{formatCurrency(getTodayFilteredExpenses())}</h4>
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
                      {formatCurrency(getFilteredStats(7))}
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
                      {formatCurrency(getFilteredStats(30))}
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
                    <h4 className="mb-0">{formatCurrency(getFilteredStats())}</h4>
                  </div>
                  <FaMoneyBillWave size={30} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        <div className={`modal fade ${showModal ? 'show' : ''}`} 
             style={{ 
               display: showModal ? 'flex' : 'none',
               alignItems: 'center',
               justifyContent: 'center'
             }}
             tabIndex="-1" 
             aria-labelledby="expenseModalLabel" 
             aria-hidden={!showModal}>
          <div className="modal-dialog modal-xl" style={{ margin: 'auto', maxWidth: '800px' }}>
            <div className="modal-content" style={{ minHeight: '500px' }}>
              <div className="modal-header">
                <h5 className="modal-title" id="expenseModalLabel">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCancel}
                  aria-label="Close">
                </button>
              </div>
              <div className="modal-body" style={{ padding: '2rem' }}>
                <form onSubmit={formik.handleSubmit}>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="mb-4">
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
                    <div className="col-md-6">
                      <div className="mb-4">
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
                  </div>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="mb-4">
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
                    <div className="col-md-6">
                      <div className="mb-4">
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
                </form>
              </div>
              <div className="modal-footer" style={{ padding: '1.5rem 2rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-lg"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                  onClick={formik.handleSubmit}
                >
                  {loading ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Add Expense')}
                </button>
              </div>
            </div>
          </div>
        </div>
        {showModal && <div className="modal-backdrop fade show"></div>}

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
                    <div className="position-relative" style={{ minWidth: '250px' }}>
                      <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                      <input
                        type="text"
                        className="form-control form-control-sm ps-5"
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
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
                          .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
                          .map((expense) => (
                          <tr key={expense.id}>
                            <td>
                              {expense.date || expense.created_at ? 
                                new Date(expense.date || expense.created_at).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }) : 
                                'No Date'
                              }
                            </td>
                            <td>{expense.description || expense.title || 'No Description'}</td>
                            <td>
                              <span className={`badge ${getCategoryColor(expense.category)}`}>
                                {expense.category || 'Uncategorized'}
                              </span>
                            </td>
                            <td className="text-danger fw-bold">
                              {expense.amount && !isNaN(expense.amount) ? 
                                formatCurrency(parseFloat(expense.amount)) : 
                                'Rs 0'
                              }
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