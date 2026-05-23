import express, { type Request, type Response } from 'express';
import cors from 'cors'
import { authRouter } from './modules/auth/auth.route';
import { issuesRouter } from './modules/issues/issues.route';
const app = express();

app.use(express.json())
app.use(cors())


app.use('/api/auth', authRouter);
app.use('/api/issues',issuesRouter);

app.get('/', (req:Request, res:Response) => {
  res.send('Hello World!');
});

export default app