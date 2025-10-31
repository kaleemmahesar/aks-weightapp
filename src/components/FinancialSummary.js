import React from "react";
import { 
  FaMoneyBillWave,
  FaChartLine,
  FaArrowDown,
  FaUniversity,
  FaMoneyBill,
  FaUser
} from "react-icons/fa";

const FinancialSummary = ({ financialStats, reportType, formatCurrency }) => {
  return (
    <div className="mb-5">
      {/* Financial Summary Cards - Clear Layout */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <FaChartLine className="me-2" />
                Financial Summary - {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                
                {/* Total Sale */}
                <div className="col-lg-2 col-md-4 col-sm-6">
                  <div className="text-center p-3 border rounded bg-light">
                    <FaMoneyBillWave className="text-success fs-2 mb-2" />
                    <h6 className="text-muted mb-1">Total Sale</h6>
                    <h4 className="text-success fw-bold mb-0">
                      {formatCurrency(financialStats.filteredRevenue)}
                    </h4>
                  </div>
                </div>

                {/* Expenses */}
                <div className="col-lg-2 col-md-4 col-sm-6">
                  <div className="text-center p-3 border rounded bg-light">
                    <FaArrowDown className="text-danger fs-2 mb-2" />
                    <h6 className="text-muted mb-1">Regular Expenses</h6>
                    <h4 className="text-danger fw-bold mb-0">
                      {formatCurrency(financialStats.filteredRegularExpenses)}
                    </h4>
                  </div>
                </div>

                {/* Profit */}
                <div className="col-lg-2 col-md-4 col-sm-6">
                  <div className="text-center p-3 border rounded bg-light">
                    <FaChartLine className={`${financialStats.filteredProfit >= 0 ? 'text-success' : 'text-danger'} fs-2 mb-2`} />
                    <h6 className="text-muted mb-1">Profit</h6>
                    <h4 className={`${financialStats.filteredProfit >= 0 ? 'text-success' : 'text-danger'} fw-bold mb-0`}>
                      {formatCurrency(financialStats.filteredProfit)}
                    </h4>
                  </div>
                </div>

                {/* Paid to Boss */}
                <div className="col-lg-2 col-md-4 col-sm-6">
                  <div className="text-center p-3 border rounded bg-light">
                    <FaUniversity className="text-info fs-2 mb-2" />
                    <h6 className="text-muted mb-1">Paid to Boss</h6>
                    <h4 className="text-info fw-bold mb-0">
                      {formatCurrency(financialStats.filteredDeposits)}
                    </h4>
                  </div>
                </div>

                {/* Remaining Cash */}
                <div className="col-lg-2 col-md-4 col-sm-6">
                  <div className="text-center p-3 border rounded bg-light">
                    <FaMoneyBill className={`${financialStats.filteredAvailableCash >= 0 ? 'text-primary' : 'text-warning'} fs-2 mb-2`} />
                    <h6 className="text-muted mb-1">Remaining Cash</h6>
                    <h4 className={`${financialStats.filteredAvailableCash >= 0 ? 'text-primary' : 'text-warning'} fw-bold mb-1`}>
                      {formatCurrency(financialStats.filteredAvailableCash)}
                    </h4>
                    {reportType !== 'overall' && (
                      <div className="d-flex align-items-center justify-content-center">
                        {financialStats.filteredAvailableCash !== financialStats.previousPeriod.availableCash && (
                          <span className={`badge ${
                            financialStats.filteredAvailableCash > financialStats.previousPeriod.availableCash 
                              ? 'bg-success' 
                              : 'bg-danger'
                          } ms-1`}>
                            {financialStats.filteredAvailableCash > financialStats.previousPeriod.availableCash ? '↗' : '↘'}
                            {Math.abs(financialStats.filteredAvailableCash - financialStats.previousPeriod.availableCash).toLocaleString('en-PK', {
                              style: 'currency',
                              currency: 'PKR',
                              minimumFractionDigits: 0
                            })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Text */}
                <div className="col-lg-2 col-md-4 col-sm-6">
                  <div className="text-center p-3 border rounded bg-primary text-white">
                    <FaUser className="fs-2 mb-2" />
                    <h6 className="text-white-50 mb-1">Records</h6>
                    <h4 className="text-white fw-bold mb-0">
                      {financialStats.filteredRecordsLength}
                    </h4>
                  </div>
                </div>

              </div>

              {/* Calculation Breakdown */}
              <div className="mt-4 pt-3 border-top">
                <div className="row text-center">
                  <div className="col-12">
                    <small className="text-muted">
                       <strong>Calculation:</strong> 
                       Sale ({formatCurrency(financialStats.filteredRevenue)}) 
                       - Regular Expenses ({formatCurrency(financialStats.regularExpenses)}) 
                       = Profit ({formatCurrency(financialStats.filteredProfit)}) 
                       - Paid to Boss ({formatCurrency(financialStats.bankDeposits)}) 
                       = Remaining Cash ({formatCurrency(financialStats.availableCash)})
                     </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;