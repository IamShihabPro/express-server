import express, { type Express, type Request, type Response } from 'express';
import {Pool} from 'pg'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({path: path.join(process.cwd(), '.env')})

const app: Express = express();
const port = 5000;

const pool = new Pool({
  connectionString: `${process.env.CONNECTION_STR}`
})

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      age INT,
      phone VARCHAR(15),
      address TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos(
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT false,
        due_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

};

initDB();

//parser
app.use(express.json())
// app.use(express.urlencoded())

app.get('/', (req: Request, res: Response) => {
  res.send('Hello Big Boss');
});

app.post("/users", async (req, res) => {
  try {
    const { name, email, age, phone, address } = req.body;

    const result = await pool.query(
      `INSERT INTO users(name, email, age, phone, address)
       VALUES($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, age, phone, address]
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: result.rows[0]
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/users', async (req, res)=>{
  try {
    const result = await pool.query(`SELECT * FROM users`)
     res.status(201).json({
      success: true,
      message: "User retrieved successfully",
      data: result.rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
})


app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, age, phone, address } = req.body;

    const result = await pool.query(
      `
      UPDATE users
      SET name = $1,
          email = $2,
          age = $3,
          phone = $4,
          address = $5,
          updated_at = NOW()
      WHERE id = $6
      RETURNING *
      `,
      [name, email, age, phone, address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: result.rows[0],
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});