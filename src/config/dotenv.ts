import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') });

const config = {
  port: process.env.PORT,
  db_key: process.env.DB_API_KEY,
  jwt_secret: process.env.JWT_SECRET,
};

export default config