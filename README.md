# Documentation for Archive Mediator

### Base URL


```bash
http://localhost:3000/api
```


##Routes

### Health Check
GET
```bash
http://localhost:3000/api/health
```

### List all objects
GET
```bash
http://localhost:3000/api/objects
```

### 	Get single object
GET
```bash
http://localhost:3000/api/objects/:id
```

###  Archive an Object
POST
```bash
http://localhost:3000/api/objects/:id/archive
```

### Restore an Object
POST
```bash
http://localhost:3000/api/objects/:id/restore
```


### Partial Restore an Object
POST
```bash
http://localhost:3000/api/objects/:id/partial-restore
```
Body
```bash
{
"startByte":0,
"endByte":20
}
```
### Delete object
DELETE
```bash
http://localhost:3000/api/objects/:id
```

### Get job Status
GET
```bash
http://localhost:3000/api/jobs/:id
```

### List all jobs
GET
```bash
http://localhost:3000/api/jobs
```
