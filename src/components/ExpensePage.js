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
import PaginationControls from './PaginationControls';
import '../styles/WeightForms.css';
import '../styles/EnhancedForms.css';

const ExpensePage = () => {
  const dispatch = useDispatch();
  const { expenses, loading, totalExpenses, todayExpenses } = useSelector(state => state.expenses);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(''); // For filtering by category
  const [searchTerm, setSearchTerm] = useState(''); // For text-based search
  const [currentPage, setCurrentPage] = useState(1);
  const [expensesPerPage, setExpensesPerPage] = useState(5); // Default to 5 expenses per page to show pagination

  // Expense categories
  const expenseCategories = [
    'Regular Expense',
    'Deposit to Owner',
    'Chae Pani',
    'Equipment',
    'Maintenance',
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
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      description: editingExpense?.description || '',
      amount: editingExpense?.amount || '',
      category: editingExpense?.category || '',
      date: editingExpense?.date ? new Date(editingExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (editingExpense) {
          await dispatch(updateExpense({ ...editingExpense, ...values })).unwrap();
          notify.success('Expense updated successfully!');
          setEditingExpense(null);
        } else {
          await dispatch(addExpense(values)).unwrap();
          notify.success('Expense added successfully!');
        }
        
        // Close modal and reset form immediately after successful save
        resetForm();
        setShowModal(false);
        
        // Refetch expenses to ensure UI shows latest data
        try {
          await dispatch(fetchExpenses());
          dispatch(calculateTotalExpenses());
          dispatch(calculateTodayExpenses());
        } catch (refreshError) {
          console.warn('Error refreshing expense data:', refreshError);
          // Don't show error to user as the expense was saved successfully
        }
      } catch (error) {
        notify.error('Error saving expense: ' + error);
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

  // Helper function to get expense date (handles both 'date' and 'expense_date' properties)
  const getExpenseDate = (expense) => {
    const dateValue = expense.date || expense.expense_date || expense.created_at;
    if (!dateValue) return null;
    return new Date(dateValue);
  };

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredExpenses.length / expensesPerPage);
  const paginatedExpenses = [...filteredExpenses]
    .sort((a, b) => {
      const dateA = getExpenseDate(a);
      const dateB = getExpenseDate(b);
      return dateB - dateA;
    })
    .slice(
      (currentPage - 1) * expensesPerPage,
      currentPage * expensesPerPage
    );

  // Pagination handlers
  const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePageClick = (page) => setCurrentPage(page);
  const handleExpensesPerPageChange = (e) => {
    setExpensesPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing expenses per page
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colorMap = {
      'Regular Expense': 'bg-primary',
      'Deposit to Owner': 'bg-success',
      'Chae Pani': 'bg-info',
      'Equipment': 'bg-warning text-dark',
      'Staff Expense': 'bg-danger',
      'Other': 'bg-secondary',
      'Maintenance': 'bg-warning text-dark'
    };
    return colorMap[category] || 'bg-secondary';
  };

  // Handle edit
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await dispatch(deleteExpense(expenseId)).unwrap();
        notify.success('Expense deleted successfully!');
        // Refetch expenses to ensure UI shows latest data
        await dispatch(fetchExpenses());
        dispatch(calculateTotalExpenses());
        dispatch(calculateTodayExpenses());
      } catch (error) {
        notify.error('Error deleting expense: ' + error);
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

  // Filter expenses by date range
  const getFilteredExpenses = (days = null) => {
    if (!days) return expenses;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return expenses.filter(expense => {
      const expenseDate = getExpenseDate(expense);
      return expenseDate && expenseDate >= cutoffDate;
    });
  };

  // Calculate filtered stats based on current search and category filters
  const getFilteredStats = (days = null) => {
    let baseData = filteredExpenses; // Use already filtered data
    
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      baseData = baseData.filter(expense => {
        const expenseDate = getExpenseDate(expense);
        return expenseDate && expenseDate >= cutoffDate;
      });
    }
    
    return baseData.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  // Calculate today's filtered expenses
  const getTodayFilteredExpenses = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return filteredExpenses
      .filter(expense => {
        const expenseDate = getExpenseDate(expense);
        return expenseDate && expenseDate >= today && expenseDate < tomorrow;
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
                onClick={() => {
                  setEditingExpense(null);
                  setShowModal(true);
                }}
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
               display: showModal ? 'block' : 'none'
             }}
             tabIndex="-1" 
             aria-labelledby="expenseModalLabel" 
             aria-hidden={!showModal}
             onClick={(e) => {
               if (e.target === e.currentTarget) {
                 handleCancel();
               }
             }}>
          <div className="modal-dialog modal-dialog-centered" style={{ 
            maxWidth: '860px', 
            width: '90%',
            margin: '0 auto'
          }}>
            <div className="modal-content" style={{ 
              minHeight: '370px',
              minWidth: '100%',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
              <div className="modal-header" style={{ 
                padding: '1rem 2rem',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #dee2e6'
              }}>
                <h5 className="modal-title fw-bold" id="expenseModalLabel" style={{ fontSize: '1.5rem' }}>
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCancel}
                  aria-label="Close">
                </button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem 2rem' }}>
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
                  <div className="modal-footer" style={{ padding: '1rem 0' }}>
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
                    >
                      {loading ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Add Expense')}
                    </button>
                  </div>
                </form>
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
                ) : (
                  <>
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
                          {paginatedExpenses.length > 0 ? (
                            paginatedExpenses.map((expense) => (
                              <tr key={expense.id}>
                                <td>
                                  {(() => {
                                    const expenseDate = getExpenseDate(expense);
                                    return expenseDate ? 
                                      expenseDate.toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      }) : 
                                      'No Date';
                                  })()}
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
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center text-muted py-3">
                                {selectedCategory ? `No expenses found for category "${selectedCategory}".` : 'No expenses recorded yet.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={expensesPerPage}
                        totalItems={filteredExpenses.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(value) => {
                          setExpensesPerPage(value);
                          setCurrentPage(1);
                        }}
                        itemsPerPageOptions={[5, 10, 20, 50]}
                      />
                    )}
                  </>
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