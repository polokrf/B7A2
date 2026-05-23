import { Router } from "express";
import { issuesController } from "./issues.controller";
import { auth } from "../midlewear/auth";

const router = Router()

router.post( '/', auth('contributor','maintainer'), issuesController.createIssues);
router.get('/',issuesController.getIssues)
router.get('/:id',issuesController.getSingleIssues)
router.patch('/:id',auth('maintainer', 'contributor'),issuesController.updateIssues);
router.delete('/:id',auth('maintainer'),issuesController.deleteIssues);

export const issuesRouter= router