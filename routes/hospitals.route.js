const express = require('express');
const AuthenticateToken = require ('../utils/auth/authenticate')
const { get_hospital_list, insert_hospital, get_hospital_info,update_hospital,delete_hospital } = require('../controller/hospital.controller');

const hospitalrouter = express.Router();

hospitalrouter.get('/', AuthenticateToken ,get_hospital_list);
hospitalrouter.post('/', AuthenticateToken,insert_hospital);
hospitalrouter.get('/:id',AuthenticateToken ,get_hospital_info);
hospitalrouter.put('/:id', AuthenticateToken,update_hospital);
hospitalrouter.delete('/:id', AuthenticateToken,delete_hospital);

module.exports = hospitalrouter;