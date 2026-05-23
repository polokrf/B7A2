import{ Pool }from 'pg'
import config from './dotenv'

export const pool = new Pool({
  connectionString:config.db_key
})

export const initDB = async() => {
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
     id SERIAL PRIMARY KEY,
     name VARCHAR(50) NOT NULL,
     email VARCHAR(100) UNIQUE NOT NULL,
     password TEXT NOT NULL,
     role VARCHAR(30) NOT NULL DEFAULT 'contributor',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
      )
      `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues(
      id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL CHECK (CHAR_LENGTH(description)>=20),
      type VARCHAR(30) NOT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'open',
      reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
      )
      `);
    
    console.log('server is run')
    
  } catch (error) {
    console.log(error)
  }
}