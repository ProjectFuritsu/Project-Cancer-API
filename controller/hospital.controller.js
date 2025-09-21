import con from "../con.js";

/**
 * 
 * get the list of the health Institution
 * 
 */
export async function get_hospital_list(req, res, next) {
    try {
        const result = await con.query('SELECT * FROM health_insti ORDER BY health_insti_id ASC');
        res.json(result.rows); // send result back to the client
    } catch (err) {
        console.error('Error fetching hospital list:', err);
        res.status(500).json({ error: 'Failed to fetch hospital list' });
    }
}

/**
 * 
 * * This is finished and needs optimization and requires documentation
 * 
 */
export async function get_hospital_info(req, res, next) {

    const { id } = req.params;
    try {

        const hiResult = await con.query(`
        SELECT 
            hi.health_insti_id,
            hi.health_insti_name,
            prov.province_name,
            cities.city_name,
            barangays.brgy_name,
            
            Concat_ws(' ',TO_CHAR(ophr.service_start_time,'HH24:MI'), ophr.start_time_type_code) as StartTime,
            Concat_ws(' ',TO_CHAR(ophr.service_end_time,'HH24:MI'), ophr.end_time_type_code) as CloseTime
        FROM health_insti as hi
        LEFT JOIN health_insti_ophr as ophr ON ophr.health_insti_id = hi.health_insti_id
        LEFT JOIN provinces as prov ON prov.province_code = hi.provincial_code
        LEFT JOIN cities ON cities.city_zip_code = hi.city_zip_code
        LEFT JOIN barangays ON barangays.brgy_code = hi.brgy_code
        WHERE hi.health_insti_id = $1
            `, [id])


        const hiServicesResult = await con.query(`
           SELECT 
                his.service_id,
                his.service_name,
                his.service_desc,
                Concat_ws(' ',TO_CHAR(hso.service_start_time,'HH24:MI'), hso.start_time_type_code) as StartTime,
                Concat_ws(' ',TO_CHAR(hso.service_end_time,'HH24:MI'), hso.end_time_type_code) as CloseTime 
            FROM health_insti_services as his 
            LEFT JOIN health_service_ophr as hso on hso.service_id = his.service_id
            WHERE his.health_insti_id =$1
            `, [id]);

        const hiContactDetailsResults = await con.query(`
            SELECT 
                ct.contact_type_name, 
                hic.contact_detail 
            FROM health_insti_contacts as hic 
            JOIN contact_type as ct on ct.contact_type_id = hic.contact_type_id 
            WHERE hic.health_insti_id = $1`, [id])

        const ServiceID = hiServicesResult.rows[0].service_id;


        const hiServicesRequirements = await con.query(`
            SELECT 
                sr.req_name,
                sr.req_desc,
                sr.service_id
            FROM service_requirements as sr 
            WHERE service_id = $1`, [ServiceID])
        
        const hiServicesProcedure =  await con.query(`
            SELECT 
                seq_no,
                procedure_name,
                procedure_desc,
                service_id
            FROM services_procedure
            where service_id = $1
            ORDER BY seq_no ASC`, [ServiceID])


        if (!hiResult || !hiResult.rows || hiResult.rows.length === 0) {
            return res.status(404).json({ error: 'Hospital not found' });
        }

        const servicesWithRequirements_Procedure = hiServicesResult.rows.map(service => ({
            ...service,
            Procedure: hiServicesProcedure.rows.filter(p => p.service_id=== service.service_id),
            Requirements: hiServicesRequirements.rows.filter(r => r.service_id === service.service_id)
        }));


        res.json({
            ...hiResult.rows[0],
            Contacts_Details: hiContactDetailsResults.rows,
            Services_Offered: servicesWithRequirements_Procedure
        });
    } catch (err) {
        console.error('Error fetching hospital:', err);
        res.status(500).json({ error: 'Failed to fetch hospital' });
    }
}

/**
 * 
 * @param { Details of a health Institution [name, ophr, services offered, etc]} req 
 * @param {status codes} res 
 * @returns status code of 201
 * 
 * TODO NEXT TASK
 */

export async function insert_hospital(req, res, next) {

    try {
        const { name, geo_latitude, geo_longhitude, city_zip_code, brgy_code, provincial_code, purok_code } = req.body;

        if (!name || !geo_latitude || !geo_longhitude || !city_zip_code || !provincial_code) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await con.query(
            `INSERT INTO health_insti (health_insti_name, geo_latitude, geo_longhitude, city_zip_code, brgy_code, provincial_code, purok_code) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`,
            [name, geo_latitude, geo_longhitude, city_zip_code, brgy_code, provincial_code, purok_code]
        );

        // return the inserted row and its primary key - adjust field name if your PK is `health_insti_id`
        const inserted = result && result.rows && result.rows[0];
        const insertedId = inserted ? (inserted.health_insti_id || inserted.id) : null;
        res.status(201).json({
            message: 'Hospital added successfully',
            hospital: inserted,
            hospitalId: insertedId
        });

    } catch (err) {
        console.error('Error inserting hospital:', err);
        res.status(500).json({ error: 'Failed to insert hospital' });
    }
}

export async function update_hospital(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        // Build SET clause dynamically
        const setClause = Object.keys(updates)
            .map((key, i) => `${key} = $${i + 1}`)
            .join(', ');

        const values = Object.values(updates);
        values.push(id); // For WHERE clause

        const query = `
            UPDATE health_insti
            SET ${setClause}
            WHERE health_insti_id = $${values.length}
            RETURNING *;
        `;

        const result = await con.query(query, values);

        if (!result || result.rowCount === 0) {
            return res.status(404).json({ error: 'Hospital not found' });
        }

        res.json({ message: 'Hospital updated successfully', hospital: result.rows[0] });

    } catch (err) {
        console.error('Error updating hospital:', err);
        res.status(500).json({ error: 'Failed to update hospital' });
    }
}

export async function delete_hospital(req, res, next) {
    try {
        const { id } = req.params;
        const result = await con.query('DELETE FROM health_insti WHERE health_insti_id = $1 RETURNING *', [id]);

        if (!result || result.rowCount === 0) {
            return res.status(404).json({ error: 'Hospital not found' });
        }
        res.json({ message: 'Hospital deleted successfully', hospital: result.rows[0] });
    } catch (err) {
        console.error('Error deleting hospital:', err);
        res.status(500).json({ error: 'Failed to delete hospital' });
    }
}