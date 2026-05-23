import { pool } from "../../config/db";

import bcrypt from "bcryptjs";
import type { ILogin, IUsers } from "./type";
import jwt from 'jsonwebtoken';
import config from "../../config/dotenv";

// register user
const signupDB = async (payload:IUsers) => {
  try {
    const { name, email, password, role } = payload;
    const hasPassword = await bcrypt.hash(password,10)
    const result = await pool.query(
      `
      INSERT INTO users (name,email,password,role)
      VALUES ($1,$2,$3,COALESCE($4, 'contributor'))
      RETURNING *
      `,
      [name, email, hasPassword, role],
    );
    if (!result.rows) {
      throw new Error('something is wrong')
    }
    return result
  } catch (error) {
    console.log(error)
    throw error
  }
}

// login user with create jwt token
const loginDB = async (payload:ILogin) => {
  try {
    const { email, password} = payload;
    
    const findUser = await pool.query(
      `
      SELECT * FROM users 
      WHERE  email=$1
     
      `,
      [email],
    );
    if (findUser.rows.length === 0) {
      throw new Error('unAuthorized')
    }
    const user = findUser.rows[0]
    const hasPassword = await bcrypt.compare(password, user?.password)
    if (!hasPassword) {
      throw new Error('unAuthorized')
    }
   
   
    const jwtPayload = {
      user_id:user.id,
      name: user?.name,
      email: user?.email,
      role:user?.role
      
    }
  const token = jwt.sign(jwtPayload,config.jwt_secret as string,{expiresIn:'10d'})
  return {token,user}
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const authService = {
  signupDB,
  loginDB
}