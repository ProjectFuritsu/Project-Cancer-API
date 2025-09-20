import con from "../con.js";

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
 * TODO: Include related tables such as description and contact details.
 * * SUGGESTION: Use JOINs to fetch related data in a single query.
 * 
 */
export async function get_hospital_info(req, res, next) {

    const { id } = req.params;
    try {
        const result =await con.query(`
        SELECT 	hi.health_insti_id,
            hi.health_insti_name,
            prov.province_name,
            cities.city_name,
            barangays.brgy_name,
            Concat_ws(' ',TO_CHAR(ophr.service_start_time,'HH24:MI'), ophr.start_time_type_code) as StartTime,
            Concat_ws(' ',TO_CHAR(ophr.service_end_time,'HH24:MI'), ophr.end_time_type_code) as CloseTime
        FROM health_insti as hi
        JOIN insti_ophr as ophr on ophr."health_insti_id" = hi.health_insti_id
        JOIN provinces as prov ON prov.province_code = hi.provincial_code
        JOIN cities ON cities.city_zip_code = hi.city_zip_code
        JOIN barangays ON barangays.brgy_code = hi.brgy_code
        where hi.health_insti_id = $1
            `, [id])
            if (!result || !result.rows || result.rows.length === 0) {
            return res.status(404).json({ error: 'Hospital not found' });
        }
        res.json(result.rows[0]); // send single hospital object back to the client
    } catch (err) {
        console.error('Error fetching hospital:', err);
        res.status(500).json({ error: 'Failed to fetch hospital' });
    }
}

/**
 * TODO: Validate input data before insertion and include also the description and the contact tables during insertion.
 * * SUGGESTION: Use transactions to ensure all related inserts succeed or fail together.
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