import e from 'express';
import denv from 'dotenv';



const app = e();
denv.config();



app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
