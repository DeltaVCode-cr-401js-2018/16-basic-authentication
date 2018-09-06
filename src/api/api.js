'use strict';
import express from 'express';
const router = express.Router();

export default router;
import modelFinder from '../middleware/models';
router.param('model', modelFinder);

import cors from 'cors';
router.use(cors());

import auth from '../auth/middleware';
router.use(auth);


router.post('/500', (req, res) => {
  throw new Error('Test Error');
});
router.get('/', (req, res) => {
  html(res, '<!DOCTYPE html><html><head><title> cowsay </title>  </head><body><header><nav><ul><li><a href="/cowsay">cowsay</a></li></ul></nav><header><main><!-- project description --></main></body></html>');
});
router.get('/:model', (req,res,next) =>{
  req.Model.find({})
    .then(models => {
      res.json(models);
    });
});
router.get('/:model/:_id', (req,res,next) =>{
  return req.Model.findById(req.params._id)
    .then(model => {
      if(model === null){
        res.sendStatus(404);
        return;
      }
      res.json(model);
    })
    .catch(next);
});
router.post('/:model', auth, (req, res, next) =>{
  if (!req.body) {
    res.send(400);
    res.end();
    return;
  }
  var newModel = new req.Model(req.body);
  newModel.save()
    .then(saved=>{
      return req.Model.findById(saved._id);
    })
    .then(found =>{
      res.json(found);
    })
    .catch(next);
});
router.put('/:model/:_id', (req,res,next)=>{
  return req.Model.findById(req.params._id)
    .then(model =>{
      model.name = req.body.name;
      model.family = req.body.family;
      model.retailer = req.body.retailer;
      res.json(model);
      res.end();
      return;
    })
    .catch(next);
});
router.delete('/:model/:_id', auth, (req,res, next)=>{
  req.Model.findByIdAndRemove(req.params.id)
    .then(removed => {
      if (!removed) {
        return next();
      }

      res.json({
        message: `ID ${req.params._id} was deleted`,
      });
    })
    .catch(next);
});

function html(res, content, statusCode=200, statusMessage='OK'){
  res.statusCode = statusCode;
  res.statusMessage = statusMessage;
  res.setHeader('Content-Type', 'text/html');
  res.write(content);
  res.end();
}