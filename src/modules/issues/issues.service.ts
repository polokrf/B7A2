import { error } from "console";
import { pool } from "../../config/db";
import type { IIssues } from "./issuesType";
import type { Request } from "express";
// create issues
const createIssuesDB = async (payload:IIssues,user:any) => {
  try {
    const { title, description, type } = payload;

    const result = await pool.query(
      `
       INSERT INTO issues (title,description,type,reporter_id)
       VALUES ($1,$2,$3,$4)
       RETURNING *
      `,
      [title, description, type,user?.user_id],
    );
    
    if (!result.rows) {
      throw new Error('Issue not created ')
     
    }
   
    
    return result
  } catch (error) {
    console.log(error)
  }
}

// get all users
const getIssuesDB = async (payload: any) => {
  try {
    const { sort, type, status } = payload
    const result = await pool.query(`
      SELECT * FROM issues WHERE 1=1
      ${type ? `AND type=${type}` : ''}
      ${status ? `AND status=${status}` : ''}
      ORDER BY created_at ${sort === 'oldest' ?'ASC' :'DESC'}
      
      `);
    const issues = result.rows;
    const getReporterIds = [
      ...new Set(
        issues.map((issue) => issue.reporter_id)
      ),
    ];
    
    
     if (getReporterIds.length === 0) {
      return [];
    }
   

    const reportersUser = await pool.query(
      `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
    `,[getReporterIds],
    );

    const reporters = reportersUser.rows;

    const formattedIssues = issues.map(
      (issue) => {
        const reporter = reporters.find(
          (user) =>
            user.id === issue.reporter_id
        );

        return {
          id: issue.id,
          title: issue.title,
          description: issue.description,
          type: issue.type,
          status: issue.status,
          reporter,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
        };
      }
    );

    return formattedIssues;

    
    
  } catch (error) {
    console.log(error)
  }
}

// get single data
 const getSingleIssueDB = async (id:string) => {
  const result = await pool.query(
    `
      SELECT * FROM issues
      WHERE id = $1
      `,
    [id],
  );

  const issue = result.rows[0];

  if (!issue) {
    throw new Error('Issue not found');
  }
  
  const reporterId = issue.reporter_id;
  const reporterUser = await pool.query(
    `
      SELECT id, name, role
      FROM users
      WHERE id = $1
      `,
    [reporterId],
  );
 const user =reporterUser.rows[0]
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: user,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};
// update own issues if status is open , and  Maintainer  update all issues
const updateIssuesDB = async (payload:Request,id:string) => {
  try {
    const { title, description, type } = payload.body as IIssues
    if (payload?.user?.role === 'maintainer') {
      const result = await pool.query(
        `
        UPDATE issues
        SET title=$1,description=$2,type=$3
        WHERE id=$4
        RETURNING *
      
      `,
        [title, description, type, id],
      );

      return result; 
    };

      const result = await pool.query(
        `
        UPDATE issues
        SET title=$1,description=$2,type=$3
        WHERE id=$4
        AND reporter_id=$5
        AND status='open'
        RETURNING *
      
      `,
        [title, description, type, id, payload.user.user_id],
      );
    
    
    return result 
  } catch (error) {
    console.log(error)
    throw error;
  }
}
// deleted only Maintainer 
const deleteIssuesDB = async (id: string) => {
  try {
  const result = await pool.query(
      `
       DELETE FROM issues
        WHERE id=$1
       `,
      [id],
    );

    return result;
  }
  catch (error) {
    console.log(error)
    throw error
  }
}

export const issuesService = {
  createIssuesDB,
  getIssuesDB,
  updateIssuesDB,
  deleteIssuesDB,
  getSingleIssueDB,
};