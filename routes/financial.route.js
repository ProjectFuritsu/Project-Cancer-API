const express = require('express');
const { get_financial_Insti_list, get_financial_Insti_info} = require('../controller/financial.controller')


const financialrouter = express.Router();

financialrouter.get('/', get_financial_Insti_list);
financialrouter.get('/:id', get_financial_Insti_info);

module.exports = financialrouter;