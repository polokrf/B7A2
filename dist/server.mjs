

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";
import cors from "cors";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/config/db.ts
import { Pool } from "pg";

// src/config/dotenv.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });
var config = {
  port: process.env.PORT,
  db_key: process.env.DB_API_KEY,
  jwt_secret: process.env.JWT_SECRET
};
var dotenv_default = config;

// src/config/db.ts
var pool = new Pool({
  connectionString: dotenv_default.db_key
});
var initDB = async () => {
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
    console.log("server is run");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var signupDB = async (payload) => {
  try {
    const { name, email, password, role } = payload;
    const hasPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `
      INSERT INTO users (name,email,password,role)
      VALUES ($1,$2,$3,COALESCE($4, 'contributor'))
      RETURNING *
      `,
      [name, email, hasPassword, role]
    );
    if (!result.rows) {
      throw new Error("something is wrong");
    }
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
var loginDB = async (payload) => {
  try {
    const { email, password } = payload;
    const findUser = await pool.query(
      `
      SELECT * FROM users 
      WHERE  email=$1
     
      `,
      [email]
    );
    if (findUser.rows.length === 0) {
      throw new Error("unAuthorized");
    }
    const user = findUser.rows[0];
    const hasPassword = await bcrypt.compare(password, user?.password);
    if (!hasPassword) {
      throw new Error("unAuthorized");
    }
    const jwtPayload = {
      user_id: user.id,
      name: user?.name,
      email: user?.email,
      role: user?.role
    };
    const token = jwt.sign(jwtPayload, dotenv_default.jwt_secret, { expiresIn: "10d" });
    return { token, user };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
var authService = {
  signupDB,
  loginDB
};

// src/modules/response.ts
var sendResponse = (res, data) => {
  res.status(data.status).json({
    success: data.success,
    message: data.message,
    data: data.data,
    errors: data.error
  });
};
var response_default = sendResponse;

// src/modules/auth/auth.controller.ts
var signup = async (req, res) => {
  try {
    const result = await authService.signupDB(req.body);
    if (result?.rows?.length === 0) {
      response_default(res, {
        status: 400,
        success: false,
        message: "user register not success"
      });
      return;
    }
    delete result?.rows[0]?.password;
    response_default(res, {
      status: 200,
      success: true,
      message: "User registered successfully",
      data: result?.rows[0]
    });
  } catch (error) {
    response_default(res, {
      status: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var login = async (req, res) => {
  try {
    const result = await authService.loginDB(req.body);
    if (result?.user.length === 0) {
      response_default(res, {
        status: 401,
        success: false,
        message: "Login not success"
      });
      return;
    }
    delete result?.user?.password;
    response_default(res, {
      status: 200,
      success: true,
      message: "Login successful",
      data: { token: result?.token, user: result?.user }
    });
  } catch (error) {
    response_default(res, {
      status: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  signup,
  login
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signup);
router.post("/login", authController.login);
var authRouter = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssuesDB = async (payload, user) => {
  try {
    const { title, description, type } = payload;
    const result = await pool.query(
      `
       INSERT INTO issues (title,description,type,reporter_id)
       VALUES ($1,$2,$3,$4)
       RETURNING *
      `,
      [title, description, type, user?.user_id]
    );
    if (!result.rows) {
      throw new Error("Issue not created ");
    }
    return result;
  } catch (error) {
    console.log(error);
  }
};
var getIssuesDB = async (payload) => {
  try {
    const { sort, type, status } = payload;
    const result = await pool.query(`
      SELECT * FROM issues WHERE 1=1
      ${type ? `AND type=${type}` : ""}
      ${status ? `AND status=${status}` : ""}
      ORDER BY created_at ${sort === "oldest" ? "ASC" : "DESC"}
      
      `);
    const issues = result.rows;
    const getReporterIds = [
      ...new Set(
        issues.map((issue) => issue.reporter_id)
      )
    ];
    if (getReporterIds.length === 0) {
      return [];
    }
    const reportersUser = await pool.query(
      `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
    `,
      [getReporterIds]
    );
    const reporters = reportersUser.rows;
    const formattedIssues = issues.map(
      (issue) => {
        const reporter = reporters.find(
          (user) => user.id === issue.reporter_id
        );
        return {
          id: issue.id,
          title: issue.title,
          description: issue.description,
          type: issue.type,
          status: issue.status,
          reporter,
          created_at: issue.created_at,
          updated_at: issue.updated_at
        };
      }
    );
    return formattedIssues;
  } catch (error) {
    console.log(error);
  }
};
var getSingleIssueDB = async (id) => {
  const result = await pool.query(
    `
      SELECT * FROM issues
      WHERE id = $1
      `,
    [id]
  );
  const issue = result.rows[0];
  if (!issue) {
    throw new Error("Issue not found");
  }
  const reporterId = issue.reporter_id;
  const reporterUser = await pool.query(
    `
      SELECT id, name, role
      FROM users
      WHERE id = $1
      `,
    [reporterId]
  );
  const user = reporterUser.rows[0];
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: user,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssuesDB = async (payload, id) => {
  try {
    const { title, description, type } = payload.body;
    if (payload?.user?.role === "maintainer") {
      const result2 = await pool.query(
        `
        UPDATE issues
        SET title=$1,description=$2,type=$3
        WHERE id=$4
        RETURNING *
      
      `,
        [title, description, type, id]
      );
      return result2;
    }
    ;
    const result = await pool.query(
      `
        UPDATE issues
        SET title=$1,description=$2,type=$3
        WHERE id=$4
        AND reporter_id=$5
        AND status='open'
        RETURNING *
      
      `,
      [title, description, type, id, payload.user.user_id]
    );
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
var deleteIssuesDB = async (id) => {
  try {
    const result = await pool.query(
      `
       DELETE FROM issues
        WHERE id=$1
       `,
      [id]
    );
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
var issuesService = {
  createIssuesDB,
  getIssuesDB,
  updateIssuesDB,
  deleteIssuesDB,
  getSingleIssueDB
};

// src/modules/issues/issues.controller.ts
var createIssues = async (req, res) => {
  try {
    const result = await issuesService.createIssuesDB(req.body, req.user);
    if (result?.rows.length === 0) {
      response_default(res, {
        status: 400,
        success: false,
        message: "issues not created"
      });
      return;
    }
    response_default(res, {
      status: 201,
      success: true,
      message: "Issue created successfully",
      data: result?.rows[0]
    });
  } catch (error) {
    response_default(res, { status: 500, success: false, message: error?.message, error });
  }
};
var getIssues = async (req, res) => {
  try {
    const result = await issuesService.getIssuesDB(req.query);
    if (result?.length === 0) {
      response_default(res, {
        status: 204,
        success: false
      });
      return;
    }
    response_default(res, {
      status: 200,
      success: true,
      message: "Issues retrived successfully",
      data: result
    });
  } catch (error) {
    response_default(res, {
      status: 500,
      success: false,
      message: error?.message,
      error
    });
  }
};
var getSingleIssues = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issuesService.getSingleIssueDB(id);
    if (!result) {
      response_default(res, {
        status: 204,
        success: false
      });
      return;
    }
    response_default(res, {
      status: 200,
      success: true,
      message: "Issue retrived successfully",
      data: result
    });
  } catch (error) {
    response_default(res, {
      status: 500,
      success: false,
      message: error?.message,
      error
    });
  }
};
var updateIssues = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issuesService.updateIssuesDB(req, id);
    if (result?.rows.length === 0) {
      response_default(res, {
        status: 403,
        success: false,
        message: "Issue updated not success"
      });
      return;
    }
    response_default(res, {
      status: 200,
      success: true,
      message: "Issue updated successfully",
      data: result?.rows[0]
    });
  } catch (error) {
    response_default(res, {
      status: 500,
      success: false,
      message: error?.message,
      error
    });
  }
};
var deleteIssues = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req?.user?.role);
    const result = await issuesService.deleteIssuesDB(id);
    console.log(result);
    response_default(res, {
      status: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    response_default(res, {
      status: 500,
      success: false,
      message: error?.message,
      error
    });
  }
};
var issuesController = {
  createIssues,
  getIssues,
  updateIssues,
  deleteIssues,
  getSingleIssues
};

// src/modules/midlewear/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...role) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        response_default(res, { status: 401, success: false, message: "unauthorized" });
        return;
      }
      const decoded = jwt2.verify(token, dotenv_default.jwt_secret);
      const findUser = await pool.query(
        `SELECT * FROM users 
        WHERE id=$1
        `,
        [decoded?.user_id]
      );
      if (findUser.rows[0].length === 0) {
        response_default(res, {
          status: 401,
          success: false,
          message: "unauthorized"
        });
        return;
      }
      const user = findUser.rows[0];
      if (role.length && !role.includes(user.role)) {
        response_default(res, {
          status: 403,
          success: false,
          message: "Forbidden access"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      response_default(res, {
        status: 500,
        success: false,
        message: error?.message,
        error
      });
    }
  };
};

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", auth(), issuesController.createIssues);
router2.get("/", issuesController.getIssues);
router2.get("/:id", issuesController.getSingleIssues);
router2.patch("/:id", auth("maintainer", "contributor"), issuesController.updateIssues);
router2.delete("/:id", auth("maintainer"), issuesController.deleteIssues);
var issuesRouter = router2;

// src/app.ts
var app = express();
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRouter);
app.use("/api/issues", issuesRouter);
app.get("/", (req, res) => {
  res.send("Hello World!");
});
var app_default = app;

// src/server.ts
var startServer = async () => {
  await initDB();
  app_default.listen(dotenv_default.port, () => {
    console.log(`Example app listening on port ${dotenv_default.port}`);
  });
};
startServer();
//# sourceMappingURL=server.mjs.map